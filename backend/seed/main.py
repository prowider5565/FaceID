from config.database import SessionLocal
from seed.users import UserFactory

session = SessionLocal()

for _ in range(20):
    UserFactory.create()

session.commit()
