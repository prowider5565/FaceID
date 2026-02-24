from config.database import SessionLocal
from seed.users import UserFactory


def run_seed(count: int = 20) -> None:
    session = SessionLocal()

    try:
        UserFactory._meta.sqlalchemy_session = session
        for _ in range(count):
            UserFactory.create()
        session.commit()
        print(f"Seeded {count} users")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_seed()
