# База данных

Проект использует PostgreSQL и TypeORM.

## Схема БД

### Таблицы

#### `users`
- `id`: PK
- `email`: Unique
- `password`: Hash
- `banned`: Boolean
- `banReason`: String
- `roles`: ManyToMany -> `roles`

#### `roles`
- `id`: PK
- `value`: Unique (ADMIN, STUDENT, UNIVERSITY_STAFF)
- `description`: String

#### `projects`
- `id`: PK
- `title`: String
- `description`: String
- `status`: Enum (PENDING, APPROVED, REJECTED)
- `author`: ManyToOne -> `users`
- `createdAt`: Date
- `updatedAt`: Date

#### `project_links`
- `id`: PK
- `url`: String
- `description`: String
- `project`: ManyToOne -> `projects`

#### `project_history`
- `id`: PK
- `project`: ManyToOne -> `projects`
- `changedBy`: ManyToOne -> `users`
- `changes`: JSONB
- `createdAt`: Date

## Конфигурация
Подключение настраивается через переменные окружения в `.env` файле (см. [Установка](installation.md)).

