# PD Projects Backend

Backend для системы управления проектами.

## Документация

Вся документация находится в папке `docs`.

- [Установка и запуск](docs/installation.md)
- [Авторизация и Пользователи](docs/auth.md)
- [Проекты](docs/projects.md)
- [Учебные заведения и Группы](docs/institutions.md)
- [База данных](docs/database.md)

## Стек технологий

- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication

## Тестовые данные (Seeding)

При запуске приложения автоматически создаются следующие пользователи:

- **Admin**: `admin@example.com` / `password123`
- **Сотрудник**: `staff@example.com` / `password123`
- **Студент**: `student@example.com` / `password123`

А также тестовый вуз, группа и проекты.
