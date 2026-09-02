# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ Yes    |

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities as public GitHub issues.**

If you discover a security vulnerability in FrameVault, please report it responsibly by emailing:

**security@framevault.example** _(replace with your actual contact)_

### What to Include

Please include as much of the following information as possible to help understand and reproduce the issue:

- Type of vulnerability (e.g., authentication bypass, credential exposure, SSRF)
- Affected component (frontend, backend, Docker configuration, AWS configuration)
- Step-by-step reproduction instructions
- Proof of concept (if available)
- Potential impact assessment
- Suggested fix (optional)

### What to Expect

- **Acknowledgement**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Resolution timeline**: Varies by severity — critical issues will be prioritized

We will coordinate disclosure timing with you and credit you in the release notes (unless you prefer to remain anonymous).

---

## Security Architecture

### Credentials

- AWS credentials are NEVER committed to source control
- `.env` files are excluded by `.gitignore`
- All secrets are injected via environment variables at runtime
- On EC2, AWS permissions are granted via IAM Instance Roles — no access keys needed

### Authentication

- Passwords are hashed using bcrypt (never stored in plaintext)
- JWT tokens are stored in httpOnly cookies (not localStorage)
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days
- All protected endpoints require a valid JWT

### S3 Access

- The S3 bucket blocks all public access
- Images are accessible only via time-limited presigned URLs (max 1 hour)
- Upload presigned URLs expire in 15 minutes
- The frontend never receives AWS credentials
- Object keys are UUIDs — not guessable

### IAM

- The EC2 instance role has the minimum permissions required (S3 read/write on the specific bucket only)
- CI/CD has only ECR push permissions
- No root account access keys are used

### Network

- Database is NOT publicly accessible
- Only ports 80, 443, and 22 (restricted to admin IP) are exposed in security groups
- All API responses use secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)

---

## Known Security Limitations (MVP)

- Single-region S3 deployment (no cross-region replication)
- No rate limiting on authentication endpoints (planned for post-MVP)
- No multi-factor authentication (out of scope for MVP)
- File type validation relies on content inspection — additional validation may be added post-MVP
