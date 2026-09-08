# Automatic AWS Deployment

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.
Every push to `main` rebuilds and restarts the existing Docker Compose stack on EC2.
You can also run it manually from the Actions tab with `workflow_dispatch`.

## One-time setup

The EC2 server must already have Docker, Compose, the repository, and the host Nginx reverse proxy configured. The deploy user must be able to run Docker without `sudo`.

Add these GitHub repository secrets under **Settings > Secrets and variables > Actions**:

- `EC2_HOST`: the server public IP or DNS name
- `EC2_USER`: usually `ubuntu`
- `EC2_SSH_KEY`: the complete private key contents, including the `BEGIN` and `END` lines

The server checkout should track `main`:

```bash
cd ~/paradise
git remote -v
git checkout main
git pull --ff-only origin main
```

## Deployment behavior

The workflow connects to `~/paradise`, resets the checkout to `origin/main`, and runs:

```bash
docker compose up -d --build --remove-orphans
docker image prune -f
```

It then checks `http://localhost/health` through the host Nginx proxy. The workflow fails if the build, containers, or health check fails.

## Important

This workflow intentionally uses the default `docker-compose.yml` because the current EC2 setup uses host Nginx on port 80 and the frontend container on port 3000. Do not switch to `docker-compose.prod.yml` without planning the port binding and database-volume migration first.
