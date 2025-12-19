# PD Projects Backend

Backend для системы управления проектами.

### Что нового

- Добавлено кеширование проектов через `@nestjs/cache-manager` (TTL 5 минут). Кешируются списки с учетом фильтров и отдельные проекты; инвалидация происходит при создании/обновлении/удалении/присоединении и загрузке файлов. Подробности: [docs/caching.md](docs/caching.md).

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
- Cache: `@nestjs/cache-manager` (in-memory по умолчанию; можно подключить Redis)

## Тестовые данные (Seeding)

Для заполнения базы данных тестовыми данными используйте команду:

```bash
npm run seed
```

Создаются роли: ADMIN, UNIVERSITY_STAFF, STUDENT, SCHOOL_STUDENT.

Создаются пользователи:

- **Админ**: `admin@example.com` / `password123`
- **Сотрудник вуза**: `staff@example.com` / `password123`
- **Студент (вуз)**: `student@example.com` / `password123`
- **Школьник**: `school_student@example.com` / `password123`

Также создаются тестовые учреждения (вуз и школа), группы, и по одному проекту от студента и школьника.
