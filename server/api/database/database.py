from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

SQLALCHEMY_DATABASE_URL = "sqlite:///./vworld.db"

Base = declarative_base()

#шаблон синглтон
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
        """Initialize database connection if not already initialized."""
        if not self._initialized:
            self._engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                connect_args={"check_same_thread": False},
            )
            #фабрика сессий
            self._session_factory = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine
            )
            self._initialized = True
    
    @property
    def engine(self):
        #возвращает engine
        return self._engine
    
    @property
    def session_factory(self):
        #возвращает фабрику сессий
        return self._session_factory
    
    def get_session(self) -> Generator[Session, None, None]:
        #возвращает генератор сессий
        db = self._session_factory()
        try:
            yield db
        finally:
            db.close()
    
    def init_db(self):
        #создает таблицы в базе данных
        from . import models
        Base.metadata.create_all(bind=self._engine)



_db_instance = Database()


engine = _db_instance.engine
SessionLocal = _db_instance.session_factory


def init_db():
    #создает таблицы в базе данных
    _db_instance.init_db()


def get_db():
    #возвращает генератор сессий
    return _db_instance.get_session()
