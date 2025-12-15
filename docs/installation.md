# Установка и запуск

## Требования

- Node.js (v16+)
- PostgreSQL
- npm

## Установка зависимостей

```bash
npm install
```

## Настройка окружения

Создайте файл `.env` в корне проекта и укажите следующие переменные:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pd_projects_db
PORT=3000
SECRET_KEY=YOUR_SECRET_KEY
```

## Запуск приложения

### Режим разработки

```bash
npm run start:dev
```

### Продакшн режим

```bash
npm run build
npm run start:prod
```

