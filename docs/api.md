# API Документация

Базовый URL: `http://localhost:3000`

## Аутентификация (`/auth`)
- POST `/auth/register` — регистрация (по `schoolId`/`schoolClassId` или по `token` приглашения)
- POST `/auth/login` — вход, возвращает JWT и пользователя
- POST `/auth/invitation` — создание приглашения (Admin), body: `{ schoolNumber }`

## Пользователи (`/users`)
- GET `/users` — список (Admin)
- GET `/users/search?email=...` — поиск (Admin, University Staff)
- POST `/users` — создать (Admin)
- PATCH `/users/:id` — обновить профиль (сам/админ)
- PATCH `/users/:id/role` — сменить роль (Admin)
- DELETE `/users/:id` — удалить (Admin)
  

## Проекты (`/projects`)
- GET `/projects` — список с фильтрацией по ролям
  - Admin: все
  - Student: школа + класс (или без класса)
  - Teacher: школа
  - University Staff: все
- GET `/projects/:id` — детали проекта
- POST `/projects` — создать (все роли), `schoolId` обязателен; Admin/Teacher/Staff — авто `approved`
- PATCH `/projects/:id` — обновить (владелец может править поля; Admin/Teacher/Staff — статус)
- PATCH `/projects/:id/status` — смена статуса (Teacher/Staff/Admin)
- POST `/projects/:id/join` — вступить (Student, макс 3 участника)
- POST `/projects/:id/upload` — загрузить файл (multipart: `file`, `type`)
- DELETE `/projects/:id` — удалить (Admin)

## Школы и классы (`/schools`) — публичные для регистрации
- GET `/schools` — все школы, поиск `?search=` по номеру/названию/городу
- GET `/schools/:id` — школа с классами
- GET `/schools/:schoolId/classes` — классы школы, поиск `?search=` по названию
- GET `/schools/classes/all?schoolId=&search=` — все классы (поиск/фильтр)

## Чаты (`/chats`)
- (Примеры) создание/получение сообщений класса; удаление собственных сообщений или админом.

## Форматы сущностей (сокр.)
- User: `{ id, name, email, role, schoolId, schoolClassId? }`
- Project: `{ id, title, description, status, githubUrl?, schoolId, schoolClassId?, ownerId, members[], files[] }`
- School: `{ id, number, name, city?, classes[] }`
- SchoolClass: `{ id, name, schoolId }`
- Invitation: `{ id, token, schoolNumber, role, expiresAt }`
- File: `{ id, filename, path, type, projectId }`

## Коды ответов
- 200/201 — OK/Created
- 204 — No Content
- 400 — Bad Request
- 401 — Unauthorized
- 403 — Forbidden
- 404 — Not Found
- 409 — Conflict
- 500 — Server Error