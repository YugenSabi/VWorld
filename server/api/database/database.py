from typing import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./vworld.db"

Base = declarative_base()


def _set_sqlite_pragmas(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA busy_timeout=30000;")
    cursor.close()


class Database:
    _instance = None
    _engine = None
    _session_factory = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                connect_args={"check_same_thread": False, "timeout": 30},
            )
            event.listen(self._engine, "connect", _set_sqlite_pragmas)
            self._session_factory = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine,
            )
            self._initialized = True

    @property
    def engine(self):
        return self._engine

    @property
    def session_factory(self):
        return self._session_factory

    def get_session(self) -> Generator[Session, None, None]:
        db = self._session_factory()
        try:
            yield db
        finally:
            db.close()

    def init_db(self):
        from . import models  # noqa: F401

        Base.metadata.create_all(bind=self._engine)
        self._run_schema_migrations()

    def _run_schema_migrations(self):
        """Apply lightweight runtime migrations for local SQLite databases."""
        with self._engine.begin() as conn:
            table_names = {
                row[0]
                for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            }
            if "agents" not in table_names:
                return

            columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info('agents')"))
            }
            if "point_id" not in columns:
                conn.execute(text("ALTER TABLE agents ADD COLUMN point_id VARCHAR"))
            if "type" not in columns:
                conn.execute(text("ALTER TABLE agents ADD COLUMN type VARCHAR DEFAULT 'agent'"))


_db_instance = Database()

engine = _db_instance.engine
SessionLocal = _db_instance.session_factory


def init_db():
    _db_instance.init_db()


def get_db():
    yield from _db_instance.get_session()
