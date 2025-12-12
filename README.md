# PD Projects Backend

Полноценный backend API для платформы регистрации проектной деятельности. Стек: Express.js, TypeScript, PostgreSQL, TypeORM.

## Коротко
- Роли: Student, Teacher, University Staff, Admin (RBAC)
- Проекты: CRUD, участники, файлы, статус (`pending|approved|rejected`)
- Фильтрация проектов по ролям и связям (школа/класс)
- Регистрация с выбором школы и класса (публичные endpoints)
- Чаты классов и сообщения
- Автоматическое создание 3 классов для каждой школы

Полная документация в папке docs:
- Обзор: docs/overview.md
- API: docs/api.md
- Аутентификация и роли: docs/auth.md
- Модель данных: docs/data-model.md
- Установка и запуск: docs/setup.md
- Развертывание: docs/deployment.md
- Тестирование: docs/testing.md
- Вклад: docs/contributing.md

## Быстрый старт

1. Клонирование и установка

```bash
git clone https://github.com/IPodymov/pd-projects-backend.git
cd pd-projects-backend
npm install
```

2. Переменные окружения

Создайте `.env` в корне:

```env
DATABASE_URL=postgres://user:password@host:5432/db
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3001
```

3. Запуск

```bash
npm run dev
```
Сервер стартует на порту 3000.

## Публичные эндпоинты для регистрации
- GET /schools — список школ, `?search=`
- GET /schools/:id — школа с классами
- GET /schools/:schoolId/classes — классы школы, `?search=`

**Автоматическое создание классов**: При регистрации пользователя или создании школы автоматически создаются 3 класса: "9 класс", "10 класс", "11 класс".

## Структура проекта
```
src/
  controllers/
  entities/
  middlewares/
  routes/
  utils/
README.md
docs/
```

## Примечания
- TypeORM `synchronize: true` включён для разработки
- Для production рекомендуются миграции (см. docs/deployment.md)
- Каждая школа автоматически получает 3 уникальных класса при создании
