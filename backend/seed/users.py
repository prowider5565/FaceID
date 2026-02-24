from factory import Faker, fuzzy
from factory.alchemy import SQLAlchemyModelFactory

from config.database import SessionLocal
from users.models import User
from users.types import Role, Shift


class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session = SessionLocal()

    full_name = Faker("name")
    phone_number = Faker("phone_number")
    hourly_rate = Faker("pydecimal", left_digits=2, right_digits=2, positive=True)
    position = Faker("job")
    shift = fuzzy.FuzzyChoice([Shift.DAY, Shift.NIGHT])
    role = fuzzy.FuzzyChoice([Role.EMPLOYEE, Role.MANAGER, Role.ADMIN])
