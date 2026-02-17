#модели для базы данных

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from .database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    personality = Column(String, default="")
    mood = Column(String, default="neutral")
    current_plan = Column(String, default="")
    point_id = Column(String, ForeignKey("points.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    point = relationship("Point", lazy="joined")
    memories = relationship("Memory", back_populates="agent", cascade="all, delete-orphan")
    relationships_from = relationship(
        "Relationship",
        foreign_keys="Relationship.agent_from_id",
        back_populates="agent_from",
        cascade="all, delete-orphan",
    )
    relationships_to = relationship(
        "Relationship",
        foreign_keys="Relationship.agent_to_id",
        back_populates="agent_to",
        cascade="all, delete-orphan",
    )


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="memories")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    agent_from_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    agent_to_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    sympathy = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("sympathy >= -10 AND sympathy <= 10", name="check_sympathy_range"),
    )

    agent_from = relationship("Agent", foreign_keys=[agent_from_id], back_populates="relationships_from")
    agent_to = relationship("Agent", foreign_keys=[agent_to_id], back_populates="relationships_to")


class Environment(Base):
    """Singleton table: one row (id=1) stores current world state."""
    __tablename__ = "environment"

    id = Column(Integer, primary_key=True, index=True, default=1)
    weather = Column(String, default="sunny", nullable=False)
    time_speed = Column(Float, default=1.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Point(Base):
    """Модель для хранения точек на canvas."""
    __tablename__ = "points"

    id = Column(String, primary_key=True, index=True)  # point_id типа "point_0", "point_1"
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    target_x = Column(Float, nullable=False)
    target_y = Column(Float, nullable=False)
    speed = Column(Float, default=1.5, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
