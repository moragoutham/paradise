# FrameVault — AWS Deployment Guide

This guide provides step-by-step instructions for deploying **FrameVault** to Amazon Web Services (AWS) using **Amazon EC2**, **Amazon S3**, and **IAM Instance Roles**.

---

## Architecture Overview

```
                 Internet
                    │
            [Port 80 / 443]
                    ▼
          ┌───────────────────┐
          │  EC2 Instance     │
          │                   │
          │  ┌─────────────┐  │           Direct S3 Upload (Presigned URL)
          │  │ Nginx (80)  │  │◄─────────────────────────────────────┐
          │  └──────┬──────┘  │                                      │
          │         │ /api    │                                      │
          │  ┌──────▼──────┐  │       Generates Presigned URL        │
          │  │ Backend     │──┼──────────────────────────────┐       │
          │  └──────┬──────┘  │                               ▼       │
          │         │         │                          ┌─────────┐  │
          │  ┌──────▼──────┐  │                          │  AWS S3 │  │
          │  │ PostgreSQL  │  │                          │  Bucket │──┘
          │  └─────────────┘  │                          └─────────┘
          └───────────────────┘
```

---

## Prerequisites

1. An **AWS Account** with administrative or appropriate IAM permissions.
2. **AWS CLI** installed and configured locally (`aws configure`) or use the AWS Management Console.
3. An **SSH Key Pair** created in your chosen AWS Region (e.g., `us-east-1`).

---

## Step 1: Create and Configure the Amazon S3 Bucket

Visual assets are stored in Amazon S3. The browser uploads assets directly to S3 via secure **presigned PUT URLs**.

### 1.1 Create the S3 Bucket

Choose a globally unique name (e.g., `framevault-assets-prod-12345`):

```bash
aws s3api create-bucket \
  --bucket framevault-assets-prod-12345 \
  --region us-east-1
```
*(Note: If using a region other than `us-east-1`, add `--create-bucket-configuration LocationConstraint=<region>`)*

### 1.2 Enable Block Public Access (Security Best Practice)

All uploads and downloads use presigned URLs, so the bucket must remain strictly **private**:

```bash
aws s3api put-public-access-block \
  --bucket framevault-assets-prod-12345 \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 1.3 Configure S3 CORS (Critical for Direct Browser Uploads)

Because the user's web browser performs a direct `PUT` request to Amazon S3, S3 must allow CORS from your application domain.

Create a file named `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": [
        "http://<YOUR_EC2_PUBLIC_IP>",
        "https://<YOUR_CUSTOM_DOMAIN>",
        "http://localhost:5173"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply the CORS configuration:

```bash
aws s3api put-bucket-cors \
  --bucket framevault-assets-prod-12345 \
  --cors-configuration file://cors.json
```

---

## Step 2: Create IAM Role for EC2 (No Hardcoded Keys)

Instead of hardcoding `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, attach an **IAM Instance Profile** to your EC2 instance. The AWS SDK (`boto3`) automatically retrieves temporary credentials.

### 2.1 Create S3 Least-Privilege Policy

Create a policy file named `s3-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FrameVaultS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::framevault-assets-prod-12345",
        "arn:aws:s3:::framevault-assets-prod-12345/*"
      ]
    }
  ]
}
```

Create the IAM Policy:

```bash
aws iam create-policy \
  --policy-name FrameVaultS3Policy \
  --policy-document file://s3-policy.json
```

### 2.2 Create the EC2 IAM Role

Create trust policy file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create Role and attach policy:

```bash
# Create IAM Role
aws iam create-role \
  --role-name FrameVaultEC2Role \
  --assume-role-policy-document file://trust-policy.json

# Attach the S3 Policy (replace YOUR_ACCOUNT_ID)
aws iam attach-role-policy \
  --role-name FrameVaultEC2Role \
  --policy-arn arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/FrameVaultS3Policy

# Create Instance Profile and attach Role
aws iam create-instance-profile --instance-profile-name FrameVaultInstanceProfile
aws iam add-role-to-instance-profile \
  --instance-profile-name FrameVaultInstanceProfile \
  --role-name FrameVaultEC2Role
```

---

## Step 3: Launch and Configure EC2 Instance

### 3.1 Security Group Rules

Create a Security Group with the following inbound rules:

| Type | Port | Source | Description |
|---|---|---|---|
| SSH | 22 | `My IP` (or restricted CIDR) | Admin access |
| HTTP | 80 | `0.0.0.0/0` | Public web traffic (Nginx) |
| HTTPS | 443 | `0.0.0.0/0` | Secure web traffic (SSL) |

> ⚠️ **Security Warning**: Never expose port 5432 (PostgreSQL) or port 8000 (FastAPI directly) to `0.0.0.0/0`. They communicate via the internal Docker bridge network.

### 3.2 Launch Instance

- **AMI**: Ubuntu Server 24.04 LTS (HVM) or Amazon Linux 2023
- **Instance Type**: `t3.small` (recommended, 2 vCPU, 2GB RAM) or `t2.micro` (free tier, ensure swap memory is added)
- **IAM Instance Profile**: `FrameVaultInstanceProfile`
- **Security Group**: Selected from Step 3.1
- **Key Pair**: Your SSH key pair
- **Storage**: 20–30 GB gp3

---

## Step 4: Install Docker & Docker Compose on EC2

Connect via SSH to your instance:

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

Update system packages and install Docker:

```bash
# Update package index
sudo apt update && sudo apt upgrade -y

# Install Docker prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable non-root docker execution
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Step 5: Deploy FrameVault via Docker Compose

### 5.1 Clone the Codebase

```bash
git clone https://github.com/<your-username>/paradise.git framevault
cd framevault
```

### 5.2 Configure Production Environment Variables

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
nano .env
```

Configure the following values:

```ini
# Environment
APP_ENV=production

# JWT signing secret (generate with: openssl rand -hex 32)
JWT_SECRET=b8d7a164923e4c02f1a601e847cbb62e519280d94f318991a0cba4837265bc9a

# Database credentials
POSTGRES_DB=framevault
POSTGRES_USER=framevault
POSTGRES_PASSWORD=generate_a_strong_password_here

# AWS & S3 Configuration
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
S3_BUCKET_NAME=framevault-assets-prod-12345

# Notice: Leave AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY empty!
# The backend automatically uses the attached IAM Instance Profile.
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Presigned URL Settings
PRESIGNED_UPLOAD_EXPIRES=900
PRESIGNED_DOWNLOAD_EXPIRES=3600

# Public Domain / IP
DOMAIN_URL=http://<YOUR_EC2_PUBLIC_IP>
ALLOWED_ORIGINS=http://<YOUR_EC2_PUBLIC_IP>,http://localhost:5173
```

### 5.3 Build and Launch Containers

Run Docker Compose with the production configuration:

```bash
# Build images and run services detached
docker compose -f docker-compose.yml up -d --build
```

Verify that all containers are healthy:

```bash
docker compose ps
```

Expected output:
```
NAME                      IMAGE                  COMMAND                  SERVICE    STATUS
framevault-db             postgres:16-alpine     "docker-entrypoint.s…"   db         Up (healthy)
framevault-backend        framevault-backend     "uvicorn app.main:ap…"   backend    Up (healthy)
framevault-frontend       framevault-frontend    "/docker-entrypoint.…"   frontend   Up (healthy)
```

---

## Step 6: Verify the Deployment

### 6.1 Check Health Endpoint
From your local terminal:
```bash
curl http://<YOUR_EC2_PUBLIC_IP>/api/v1/health
```
Response:
```json
{"status":"healthy","service":"framevault-api","version":"0.1.0","storage_backend":"s3"}
```

### 6.2 Browser Verification
1. Open `http://<YOUR_EC2_PUBLIC_IP>` in your browser.
2. Register an account or sign in.
3. Create a collection and upload an image.
4. Verify the image uploads directly to S3 and previews correctly!

---

## Step 7: (Optional) Custom Domain & HTTPS with Let's Encrypt

To configure a free SSL certificate using Certbot on your EC2 instance:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL Certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Mount the certificates into Nginx or terminate SSL at an **AWS Application Load Balancer (ALB)** with AWS Certificate Manager (ACM).

---

## Useful Maintenance Commands

```bash
# View real-time logs
docker compose logs -f

# View backend logs specifically
docker compose logs -f backend

# Restart services
docker compose restart

# Stop services
docker compose down

# Run database shell
docker compose exec db psql -U framevault -d framevault
```
