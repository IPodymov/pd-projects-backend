# Установка и Запуск

## Требования
- Node.js LTS
- PostgreSQL (локально или хостинг)

## Установка
```bash
npm install
```

## Переменные окружения
Создайте `.env` в корне:
```env
DATABASE_URL=postgres://user:password@host:5432/db
JWT_SECRET=your_secret_key
```

Пример (Railway):
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
```

## Запуск в разработке
```bash
npm run dev
```
Сервер стартует на порту 3000.

## Production
```bash
npm start
```

## Публичные эндпоинты для регистрации
- GET `/schools` — список школ, `?search=`
- GET `/schools/:id` — школа с классами
- GET `/schools/:schoolId/classes` — классы школы, `?search=`

Используйте эти эндпоинты для combobox на фронтенде.