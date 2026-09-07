# FrameVault — Cost-Optimized AWS Deployment Guide

> **Goal:** Deploy the full FrameVault stack on AWS for as little money as possible,
> so your **$100 credit** lasts many months — or even through the entire portfolio
> showcase period.

---

## 1. Cost Analysis — What This Project Actually Needs

Before spending a dollar, let's look at every component FrameVault runs and map it to
an AWS service.

### 1.1 Architecture Components

| Component | What It Does | Fits On |
|---|---|---|
| **Nginx** | Serves the React SPA, reverse-proxies `/api` to FastAPI | Same EC2 instance |
| **FastAPI** (Uvicorn) | REST API, JWT auth, generates S3 presigned URLs | Same EC2 instance |
| **MySQL** | Stores users, collections, assets metadata | Same EC2 instance |
| **Amazon S3** | Stores actual image files (direct browser upload) | Managed AWS service |

> **Key Insight:** Because the browser uploads files **directly to S3** via
> presigned URLs, the EC2 instance never handles file bytes. It only handles tiny
> JSON API requests. This means even the smallest instance can serve this workload.

### 1.2 Monthly Cost Breakdown (Optimized for $100 budget)

All prices are **us-east-1** (N. Virginia), which is cheapest. Use your free tier where noted.

| AWS Service | Config | Monthly Cost | Notes |
|---|---|---|---|
| **EC2 t2.micro** | 1 vCPU, 1 GB RAM | **$0.00** | Free tier: 750 hrs/month for 12 months |
| **EC2 t3.micro** (after free tier) | 2 vCPU, 1 GB RAM | ~**$7.59** | After free tier expires |
| **EBS gp3 Storage** | 20 GB root disk | **$0.00** | Free tier: 30 GB/month |
| **S3 Storage** | 5 GB images | **$0.12** | Free tier: 5 GB for 12 months; $0.023/GB after |
| **S3 PUT Requests** | ~1,000 uploads | **$0.005** | $0.005 per 1,000 PUT requests |
| **S3 GET Requests** | ~10,000 views | **$0.004** | $0.0004 per 1,000 GET requests |
| **Elastic IP** | 1 static public IP | **$0.00** | Free while attached to a running instance |
| **Data Transfer OUT** | ~5 GB/month | **$0.00** | Free tier: 100 GB/month for 12 months |

### Total Estimated Monthly Cost

| Phase | Monthly Bill | Explanation |
|---|---|---|
| **First 12 months (free tier)** | **~$0.12** | EC2 + EBS = free tier; only S3 storage costs money |
| **After free tier** | **~$7.60-$8.00** | t3.micro + 20 GB EBS + minimal S3 |

**At ~$8/month, your $100 credit lasts approximately 12 months after free tier expires.**

### 1.3 What We Are NOT Using (Cost Avoidance)

| Service | Why We Skipped It | Saves |
|---|---|---|
| RDS MySQL (db.t3.micro) | Runs MySQL inside Docker on EC2 instead | ~$15/month |
| Application Load Balancer | Nginx on EC2 handles routing | ~$16/month |
| NAT Gateway | No private subnets needed for a portfolio project | ~$32/month |
| ElastiCache Redis | No caching layer required | ~$14/month |
| CloudFront CDN | S3 presigned URLs serve assets directly | ~$1-5/month |

> **Total saved vs naive deployment: ~$78/month**

---

## 2. Deployment Architecture (Single EC2 Instance)

```
                          INTERNET
                              |
                         Port 80/443
                              |
                    +---------v--------+
                    |  EC2 t2.micro    |   <- IAM Role (S3 access, no keys stored)
                    |                  |
                    |  Docker Network  |
                    |  +------------+  |
                    |  | Nginx :80  |  |
                    |  +-----+------+  |
                    |  /api/ |  /      |
                    |  +-----v------+  |      +------------------+
                    |  | FastAPI    |--+----->|  Amazon S3       |
                    |  | :8000      |  |      |  (presigned URLs) |
                    |  +-----+------+  |      +------------------+
                    |  +-----v------+  |
                    |  | MySQL      |  |
                    |  | :3306      |  |
                    |  +------------+  |
                    |                  |
                    |  20 GB EBS disk  |
                    +------------------+
```

**Everything runs in Docker on a single t2.micro EC2 instance.**

---

## 3. Pre-Deployment Checklist

Before starting, make sure you have:

- [ ] An AWS account
- [ ] AWS CLI installed on your laptop: `aws --version`
- [ ] AWS CLI configured: `aws configure`
- [ ] An SSH key pair created in AWS Console (EC2 > Key Pairs)
- [ ] Git installed on your laptop

---

## 4. Step-by-Step Deployment

### Step 1 — Create the S3 Bucket

> **Free tier:** 5 GB of S3 Standard storage, 20,000 GET requests, 2,000 PUT requests per month for 12 months.

**1.1 Create the bucket (choose a globally unique name):**

```bash
# Replace "framevault-assets-yourname-2024" with a unique name of your choice
BUCKET_NAME="framevault-assets-yourname-2024"
REGION="us-east-1"

aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION
```

**1.2 Block all public access (assets served via presigned URLs only):**

```bash
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**1.3 Configure S3 CORS (required for direct browser-to-S3 PUT uploads):**

Create a file called `s3-cors.json` on your laptop:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply it:

```bash
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://s3-cors.json
```

---

### Step 2 — Create IAM Role for EC2 (No API Keys Stored on Server)

> **Why:** Instead of putting `AWS_ACCESS_KEY_ID` in an `.env` file (security risk),
> we give the EC2 instance a **role** that grants S3 access automatically. The backend
> code already supports this — `boto3` automatically reads the role credentials.

**2.1 Create a least-privilege S3 policy:**

Create `iam-s3-policy.json` on your laptop (replace the bucket name):

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
        "s3:HeadObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::framevault-assets-yourname-2024",
        "arn:aws:s3:::framevault-assets-yourname-2024/*"
      ]
    }
  ]
}
```

```bash
aws iam create-policy \
  --policy-name FrameVaultS3Policy \
  --policy-document file://iam-s3-policy.json
```

Note the `"Arn"` value returned (looks like `arn:aws:iam::123456789012:policy/FrameVaultS3Policy`).

**2.2 Create EC2 IAM Role:**

Create `ec2-trust.json`:

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

```bash
# Create the role
aws iam create-role \
  --role-name FrameVaultEC2Role \
  --assume-role-policy-document file://ec2-trust.json

# Attach the S3 policy (replace YOUR_ACCOUNT_ID)
aws iam attach-role-policy \
  --role-name FrameVaultEC2Role \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/FrameVaultS3Policy

# Create instance profile and attach role
aws iam create-instance-profile \
  --instance-profile-name FrameVaultInstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name FrameVaultInstanceProfile \
  --role-name FrameVaultEC2Role
```

---

### Step 3 — Create Security Group

```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name framevault-sg \
  --description "FrameVault Web Application" \
  --query 'GroupId' --output text)

echo "Security Group ID: $SG_ID"

# Allow SSH (your IP only - find it at: curl ifconfig.me)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 22 --cidr YOUR.IP.ADDRESS.HERE/32

# Allow HTTP (public)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS (for later SSL setup)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

> **Important:** Do NOT open ports 8000 (FastAPI) or 3306 (MySQL) to the public. Only ports 22 and 80 should be open in your Security Group. All inter-container communication happens over Docker's internal private bridge network.

---

### Step 4 — Launch EC2 Instance (Free Tier)

**In AWS Console → EC2 → Launch Instance:**

| Setting | Value |
|---|---|
| **Name** | `framevault-prod` |
| **AMI** | Ubuntu Server 24.04 LTS (HVM), SSD — 64-bit |
| **Instance Type** | `t2.micro` — **Free tier eligible** (750 hours/month) |
| **Key Pair** | Your existing key pair |
| **Security Group** | `framevault-sg` |
| **Storage** | 20 GB gp3 (Free tier: 30 GB included) |
| **IAM Instance Profile** | `FrameVaultInstanceProfile` |

Click **Launch Instance**. Wait ~1 minute for it to start.

**(Optional but recommended) Allocate an Elastic IP (keeps your IP stable across reboots):**

```bash
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)

INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=framevault-prod" \
  --query "Reservations[0].Instances[0].InstanceId" --output text)

aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $EIP_ALLOC
```

---

### Step 5 — Install Docker on EC2

Connect via SSH:

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

On the EC2 instance, run:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg git

# Add Docker's GPG key and repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

**Add 1 GB Swap — critical for t2.micro with only 1 GB RAM:**

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active
free -h
```

---

### Step 6 — Deploy the Application

**6.1 Clone your repository:**

```bash
git clone https://github.com/YOUR_USERNAME/paradise.git framevault
cd framevault
```

**6.2 Create the production environment file:**

```bash
cp .env.example .env
nano .env
```

Set these values (edit the file to look like this):

```ini
# Application
APP_ENV=production

# Generate with: openssl rand -hex 32
JWT_SECRET=paste_a_64_char_random_hex_string_here

ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
MYSQL_ROOT_PASSWORD=choose_a_root_password_here
MYSQL_DATABASE=framevault
MYSQL_USER=framevault
MYSQL_PASSWORD=choose_a_strong_password_here
DATABASE_URL=mysql+pymysql://framevault:choose_a_strong_password_here@db:3306/framevault

# Storage — switch to S3
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
S3_BUCKET_NAME=framevault-assets-yourname-2024

# Leave blank — EC2 IAM Role provides credentials automatically
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

PRESIGNED_UPLOAD_EXPIRES=900
PRESIGNED_DOWNLOAD_EXPIRES=3600

# CORS — use your actual EC2 public IP
DOMAIN_URL=http://YOUR_EC2_PUBLIC_IP
ALLOWED_ORIGINS=http://YOUR_EC2_PUBLIC_IP
```

**6.3 Build and start production containers:**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> First build takes 3–5 minutes. Watch progress with:
> `docker compose -f docker-compose.prod.yml logs -f`

**6.4 Verify all containers are healthy:**

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                         STATUS
framevault-db-prod           Up (healthy)
framevault-backend-prod      Up (healthy)
framevault-frontend-prod     Up (healthy)
```

---

### Step 7 — Verify the Deployment

From your laptop:

```bash
# Check API health through Nginx
curl http://YOUR_EC2_PUBLIC_IP/api/v1/health

# Expected:
# {"status":"healthy","service":"framevault-api","version":"0.1.0","storage_backend":"s3"}
```

Then open `http://YOUR_EC2_PUBLIC_IP` in your browser:

1. Register an account
2. Create a collection
3. Upload an image
4. Verify the image loads

Confirm the file is in S3:

```bash
aws s3 ls s3://framevault-assets-yourname-2024 --recursive
```

---

## 5. Cost Control Measures

### 5.1 Set Up Billing Alerts FIRST

Do this before anything else. Go to **AWS Console → Billing → Budgets → Create budget**
or use the CLI:

```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "FrameVaultMonthlyLimit",
    "BudgetLimit": {"Amount": "10", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "your-email@example.com"
    }]
  }]'
```

This sends you an email if your bill exceeds $8/month.

### 5.2 Stop the Instance When Not Using It

The biggest cost lever. Stop the instance when you're not actively demonstrating the project:

```bash
# Stop (pauses compute billing; EBS disk continues at ~$1.60/month)
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Start when needed
aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID
```

With an Elastic IP, the app resumes at the same IP address after every start.

### 5.3 S3 Lifecycle Policy (Auto-delete soft-deleted assets after 30 days)

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket framevault-assets-yourname-2024 \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "DeleteTrash",
      "Filter": {"Prefix": "framevault/"},
      "Status": "Enabled",
      "Expiration": {"Days": 90}
    }]
  }'
```

---

## 6. Updating the Application

When you push code changes:

```bash
# SSH into EC2
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP

cd framevault

# Pull latest changes
git pull origin main

# Rebuild and restart (only changed layers rebuild — fast)
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker compose -f docker-compose.prod.yml ps
```

---

## 7. Useful Operations

```bash
# Live logs for all services
docker compose -f docker-compose.prod.yml logs -f

# Backend logs only
docker compose -f docker-compose.prod.yml logs -f backend

# Open shell inside backend container
docker compose -f docker-compose.prod.yml exec backend bash

# Open MySQL shell
docker compose -f docker-compose.prod.yml exec db mysql -u framevault -p framevault

# Restart just the backend (after config change)
docker compose -f docker-compose.prod.yml restart backend

# Stop all containers (preserves data volumes)
docker compose -f docker-compose.prod.yml down

# Stop and wipe all data (WARNING: deletes database)
docker compose -f docker-compose.prod.yml down -v
```

---

## 8. 12-Month Credit Forecast

| Month | Estimated Bill | Credit Remaining (from $100) |
|---|---|---|
| Month 1–12 (free tier) | ~$0.12 | ~$98.56 |
| Month 13 (free tier expired) | ~$8.00 | ~$90.56 |
| Month 14 | ~$8.00 | ~$82.56 |
| Month 25 | ~$8.00 | ~$2.56 |

**Your $100 credit covers ~24 months total** (12 months free tier + 12 months at ~$8/month).

If you stop the instance when not actively demonstrating it, the credit stretches much further.

---

## 9. Quick Reference — Key Values to Record

After deployment, write these down:

```
EC2 Instance ID:        i-xxxxxxxxxxxxxxxxx
EC2 Public IP:          xxx.xxx.xxx.xxx
Elastic IP (static):    xxx.xxx.xxx.xxx
S3 Bucket Name:         framevault-assets-yourname-2024
AWS Region:             us-east-1
IAM Role:               FrameVaultEC2Role
Security Group:         framevault-sg
```

---

## 10. Full Cleanup (Stop All AWS Charges)

When permanently done with the project:

```bash
# 1. Terminate EC2 instance (deletes instance + EBS volume)
aws ec2 terminate-instances --instance-ids YOUR_INSTANCE_ID

# 2. Release Elastic IP (you're billed if allocated but not attached)
aws ec2 release-address --allocation-id YOUR_EIP_ALLOCATION_ID

# 3. Empty and delete S3 bucket
aws s3 rm s3://framevault-assets-yourname-2024 --recursive
aws s3api delete-bucket --bucket framevault-assets-yourname-2024

# 4. Delete Security Group
aws ec2 delete-security-group --group-name framevault-sg

# 5. Clean up IAM
aws iam remove-role-from-instance-profile \
  --instance-profile-name FrameVaultInstanceProfile \
  --role-name FrameVaultEC2Role
aws iam delete-instance-profile \
  --instance-profile-name FrameVaultInstanceProfile
aws iam detach-role-policy \
  --role-name FrameVaultEC2Role \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/FrameVaultS3Policy
aws iam delete-role --role-name FrameVaultEC2Role
aws iam delete-policy \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/FrameVaultS3Policy
```
