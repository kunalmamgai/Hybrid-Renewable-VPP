"""Shared SQLAlchemy declarative base — the single metadata registry for all ORM models."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
