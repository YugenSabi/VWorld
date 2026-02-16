# Структура API проекта

**Памятка для фронтенда по WebSocket:** [websocket/README.md](websocket/README.md)

## Запуск с консоли из корня проекта


```bash
cd server
pip install -r api/requirements.txt
python -m uvicorn api.main:app --reload
```

После запуска API будет доступен по адресу: `http://localhost:8000`
Документация API: `http://localhost:8000/docs`

## Организация файлов

### `database/` - Работа с базой данных
- `database.py` - подключение к БД и сессии (SQLAlchemy engine, SessionLocal, get_db)
- `models.py` - SQLAlchemy модели (Agent, Memory, Event, Relationship, Environment)
- `crud_agents.py` - CRUD операции для агентов
- `crud_memory.py` - CRUD операции для памяти
- `crud_events.py` - CRUD операции для событий
- `crud_relationships.py` - CRUD операции для отношений
- `crud_mood.py` - CRUD операции для настроения
- `crud_environment.py` - CRUD операции для окружения (погода, скорость времени)

### `models/` - Pydantic модели (схемы для валидации данных)
- `agents.py` - модели для агентов (AgentCreate, AgentUpdate, AgentResponse, AgentProfile)
- `memory.py` - модели для памяти (MemoryCreate, MemoryResponse, MemoryWithSummary)
- `events.py` - модели для событий (EventCreate, EventResponse)
- `relationships.py` - модели для отношений (RelationshipCreate, RelationshipResponse, RelationshipGraph)
- `mood.py` - модели для настроения (MoodUpdate)
- `environment.py` - модели для окружения (WeatherUpdate, TimeSpeedUpdate, EnvironmentResponse)

### `routers/` - API роутеры (эндпоинты)
- `agents.py` - Блок 1: Управление агентами
  - GET /agents - список всех агентов
  - GET /agents/{id} - профиль агента
  - POST /agents - создать агента
  - PATCH /agents/{id} - изменить агента
  - DELETE /agents/{id} - удалить агента
  - GET /agents/{id}/profile - полный профиль
  - GET /agents/{id}/relationships - отношения агента

- `memory.py` - Блок 2: Память и воспоминания
  - POST /agents/{id}/memory - добавить воспоминание
  - GET /agents/{id}/memory - получить все воспоминания
  - GET /agents/{id}/memory/summary - получить суммарию

- `mood.py` - Блок 3: Настроение и эмоции
  - PATCH /agents/{id}/mood - изменить настроение
  - GET /agents/{id}/mood - получить настроение

- `events.py` - Блок 4: События
  - POST /events - создать событие
  - GET /events - список всех событий

- `relationships.py` - Блок 5: Отношения между агентами
  - POST /relationships - создать/обновить отношение
  - GET /relationships - получить все отношения (граф)
  - GET /relationships/agents/{id} - отношения конкретного агента

- `environment.py` - Блок 6: Управление окружением
  - PATCH /environment/weather - изменить погоду
  - POST /environment/event - добавить событие в мир
  - PATCH /environment/speed - изменить скорость времени
  - GET /environment/weather - получить погоду
  - GET /environment/speed - получить скорость времени

- `llm_interaction.py` - Блок 7: Интерактивность LLM (заглушки)
  - POST /agents/{id}/plan - получить план действий
  - POST /agents/{id}/message - отправить сообщение агенту

### `llm/` - LLM интеграция (заглушки)
- `agent_ai.py` - функции для работы с LLM (пока заглушки: summarize_memories, add_memory_llm)

### Корневые файлы
- `main.py` - главный файл FastAPI приложения (инициализация, CORS, регистрация роутеров)
- `utils.py` - утилиты (суммаризация воспоминаний)
- `requirements.txt` - зависимости проекта
- `STRUCTURE.md` - документация структуры проекта

---
