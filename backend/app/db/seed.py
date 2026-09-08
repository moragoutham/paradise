import logging
from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.collection import Collection
from app.models.asset import Asset, Tag, asset_tags
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

def seed_database():
    """
    Ensures all tables exist and seeds the default demo credentials,
    collections, and tags if not already present.
    """
    # 1. Ensure all tables are created
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 2. Seed Default Demo User (matching UI auto-fill credentials)
        demo_email = "devops.lead@framevault.io"
        demo_password = "Password123!Secure"

        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            demo_user = User(
                email=demo_email,
                password_hash=get_password_hash(demo_password),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info(f"Seeded demo user: {demo_email}")
            print(f"✓ Seeded demo user: {demo_email}")
        else:
            logger.info(f"Demo user {demo_email} already exists.")

        # 3. Seed Default Collections for Demo User
        existing_collections = db.query(Collection).filter(Collection.user_id == demo_user.id).count()
        if existing_collections == 0:
            sample_collections = [
                Collection(
                    user_id=demo_user.id,
                    name="AWS Cloud Architecture",
                    description="Cloud infrastructure topologies, VPC diagrams, and deployment blueprints.",
                ),
                Collection(
                    user_id=demo_user.id,
                    name="UI / UX Showcase",
                    description="Component prototypes, high-fidelity mockups, and responsive layout designs.",
                ),
                Collection(
                    user_id=demo_user.id,
                    name="Production Releases",
                    description="Release changelogs, staging verification screenshots, and system metrics.",
                ),
            ]
            db.add_all(sample_collections)
            db.commit()
            logger.info(f"Seeded {len(sample_collections)} demo collections.")
            print(f"✓ Seeded {len(sample_collections)} demo collections.")

        # 4. Seed Standard Tags
        standard_tags = ["AWS", "Production", "Architecture", "Design", "DevOps", "Database", "Security"]
        tags_added = 0
        for tag_name in standard_tags:
            if not db.query(Tag).filter(Tag.name == tag_name).first():
                db.add(Tag(name=tag_name))
                tags_added += 1
        if tags_added > 0:
            db.commit()
            logger.info(f"Seeded {tags_added} tags.")
            print(f"✓ Seeded {tags_added} default tags.")

        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seeding: {e}")
        print(f"Error during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
