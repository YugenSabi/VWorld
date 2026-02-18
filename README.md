# VWorld

- **Презентация**: [`Presentation_pdf.pdf`](Presentation_pdf.pdf)
- **Демонстрация**: []()

VWorld — веб-приложение с мультиагентной симуляцией.  
В мире одновременно живут несколько автономных агентов: у них есть личность, настроение, память, планы и отношения между собой.  
Пользователь наблюдает за миром в реальном времени и может вмешиваться через UI.

## Что реализовано

- Симуляция мира в реальном времени (FastAPI + WebSocket).
- Агенты и мобы на карте с движением и репликами.
- Память агентов:
  - текстовая память в SQLite;
  - векторная память в локальной БД (`vector_memory.db`);
  - суммаризация старых воспоминаний.
- Эмоции и отношения:
  - текущее настроение агента;
  - симпатия/антипатия между агентами;
  - граф отношений.
- Лайв-интерфейс:
  - viewport карты;
  - world log;
  - live dialogues;
  - панели entities/mobs/weather/time speed;
  - инспектор агента поверх карты.

## Архитектура

### Backend (`server/api`)

- `main.py` — вход в FastAPI, lifespan, роутеры, запуск фоновых задач.
- `routers/api/*` — REST-эндпоинты (agents, events, relationships, environment, memory).
- `routers/ws/*` — WebSocket-эндпоинты (`/ws/agents`, `/ws/points`).
- `llm/*` — логика агента, промпты, эмоции, симуляция.
- `database/*` — SQLAlchemy модели и CRUD.
- `websocket/*` — менеджеры рассылки событий.

Основные данные:
- `server/vworld.db` — основная SQLite БД.
- `server/api/vector_memory.db` — векторная память.

### Frontend (`client/dashboard/identity`)

- Next.js 14 + React.
- UI-фрагменты игры в `fragments/game/src`.
- API-слой в `api/services/*`.
- Realtime-хуки в `hooks/*`.
- Компоненты:
  - `viewport` (карта, оверлеи, инспектор),
  - `toolbar` (управление сущностями/мобами/погодой/скоростью),
  - `characters-list`,
  - `dialogue-panel`,
  - `event-log`,
  - `relationships-graph`,
  - `communications-graph`.

## Как работает LLM

LLM используется в backend через `server/api/llm/config.py`.

- Провайдер: GenAPI (настраивается через `GENAPI_*` переменные).
- Основные сценарии:
  - генерация ответов в диалогах;
  - реакция на события;
  - генерация/обновление планов;
  - суммаризация памяти.
- Для устойчивости есть retry/timeout и fallback-поведение при ошибках модели.

Важно: если `GENAPI_API_KEY` не задан, часть диалоговых сценариев будет работать с деградацией качества.

## REST и WebSocket

### REST (backend)

Базовый URL: `http://localhost:8000`

Ключевые группы:
- `GET/POST/PATCH/DELETE /agents`
- `GET /agents/presets`
- `POST /agents/presets/spawn`
- `GET /agents/mobs/presets`
- `POST /agents/mobs/spawn`
- `GET/POST /events`
- `GET/POST /relationships`
- `PATCH /environment/weather`
- `PATCH /environment/speed`

Документация OpenAPI: `http://localhost:8000/docs`

### WebSocket

- `ws://localhost:8000/ws/agents`
- `ws://localhost:8000/ws/points`

События включают:
- `agents_update`, `agent_created`, `agent_deleted`, `agent_moved`,
- `agent_mood_changed`, `agent_dialogue`, `agent_thought`,
- `points_update`.

## Локальный запуск

### Backend

```bash
cd server
pip install -r api/requirements.txt
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd client
yarn install
yarn workspace @dashboard/identity dev
```

Приложение:
- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`

## Docker запуск

Из корня репозитория:

```bash
docker compose up --build -d
```

Остановить:

```bash
docker compose down
```

## Переменные окружения

### Backend (`server/.env`)

Обязательная:
- `GENAPI_API_KEY=...`

Опциональные:
- `GENAPI_MODEL=gemini-3-flash`
- `GENAPI_BASE_URL=https://api.gen-api.ru/api/v1`
- `VWORLD_AUTO_START_SIMULATION=1`
- `VWORLD_POINTS_TICK_SECONDS=0.05`
- `VWORLD_LLM_EMOTION_ANALYSIS=0`
- `VWORLD_LLM_SYMPATHY_ANALYSIS=0`

### Frontend (`client/dashboard/identity/.env.local`)

- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_WS_URL=ws://localhost:8000`
- `NEXT_PUBLIC_USE_MOCK_DATA=false`

## Текущее состояние и ограничения

- Бэкенд использует SQLite, поэтому под высокой нагрузкой возможны задержки на записи.
- Часть запросов и обновлений в UI сейчас поллинг + websocket одновременно.
- В коде есть fallback-ветки на случай ошибки LLM; это сделано для стабильности демо.

## Технологии

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn.
- Frontend: Next.js, React, TypeScript.
- Realtime: WebSocket.
- LLM: GenAPI.
- Векторная память: локальное хранилище (`vector_memory.db`) + embedding-пайплайн.
