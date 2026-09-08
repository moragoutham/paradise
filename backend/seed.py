"""
Database seeding entry point for FrameVault.
Usage:
    python seed.py
    or inside Docker:
    docker compose -f docker-compose.prod.yml exec backend python seed.py
"""
import sys
from app.db.seed import seed_database

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        print(f"Failed to seed database: {e}")
        sys.exit(1)
