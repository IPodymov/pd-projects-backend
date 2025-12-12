# PD Projects Backend — Обзор

Полноценный backend API для платформы регистрации проектной деятельности.

- Стек: Express.js, TypeScript, PostgreSQL, TypeORM
- Функционал: пользователи (RBAC), проекты, команды, чаты, файлы, приглашения, школы/классы
- Архитектура: REST API, JWT аутентификация, ролевые ограничения, файловое хранилище

## Ключевые возможности
- Управление проектами (CRUD, участники, файлы)
- Роли: `student`, `teacher`, `university_staff`, `admin`
- Фильтрация проектов по ролям и связям (школа/класс)
- Регистрация с выбором школы и класса (публичные endpoints)
- Связь профиля с GitHub (OAuth)
- Чаты классов и сообщения

## Структура репозитория
```
src/
  controllers/
  entities/
  middlewares/
  routes/
  utils/
README.md
```

Ссылки:
- Документация API: ./api.md
- Модель данных: ./data-model.md
- Аутентификация и роли: ./auth.md
- Настройка и запуск: ./setup.md
- Развертывание: ./deployment.md
- Тестирование: ./testing.md
- Вклад: ./contributing.md