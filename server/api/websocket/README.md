# Памятка: WebSocket `/ws/points` (VWorld API)

## Подключение

**URL:** `ws://<хост>/ws/points` или `wss://<хост>/ws/points` (для HTTPS).

Формирование URL в коде:

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/api/ws/points`;
const ws = new WebSocket(wsUrl);
```

Если бэкенд за прокси с префиксом (например `/api`), то:  
`${protocol}//${window.location.host}/api/ws/points`.

---

## События WebSocket

| Событие    | Когда использовать |
|-----------|---------------------|
| `onopen`  | Подключение установлено |
| `onmessage` | Пришло сообщение от сервера |
| `onerror` | Ошибка соединения |
| `onclose` | Соединение закрыто |

Перед любой отправкой проверять: `ws.readyState === WebSocket.OPEN` (или `=== 1`).

---

## Что шлёт сервер (входящие сообщения)

Все сообщения — JSON. Основной тип:

**`points_update`** — рассылка состояния всех точек (~60 раз в секунду).

Пример тела:

```json
{
  "type": "points_update",
  "points": [
    {
      "id": "point_0",
      "x": 100.5,
      "y": 200.3
    }
  ]
}
```

Обработка на фронте:

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'points_update') {
    // msg.points — массив объектов { id, x, y }
    updatePoints(msg.points);
  }
};
```

## Что шлёт фронт (исходящие сообщения)

Все сообщения — JSON-строки: `ws.send(JSON.stringify({ ... }))`.

### 1. Добавить точку

Точка создаётся в центре переданного «экрана».

```json
{
  "type": "add_point",
  "screen_width": 800,
  "screen_height": 600
}
```

Пример:

```javascript
ws.send(JSON.stringify({
  type: 'add_point',
  screen_width: 800,
  screen_height: 600
}));
```

### 2. Переместить точку (задать цель)

Отправлять после выбора точки (по клику/тапу и т.п.).

```json
{
  "type": "move_point",
  "point_id": "point_0",
  "x": 120,
  "y": 250
}
```

Пример:

```javascript
ws.send(JSON.stringify({
  type: 'move_point',
  point_id: point.id,  // id из points_update
  x: x,
  y: y
}));
```

---
