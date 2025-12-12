# Аутентификация и Роли

## JWT
- Заголовок: `Authorization: Bearer <token>`
- Проверка: middleware `checkJwt` кладет payload в `res.locals.jwtPayload`

## Роли (`UserRole`)
- `student` — ученик
- `teacher` — учитель школы
- `university_staff` — сотрудник вуза
- `admin` — администратор

## Доступ
- Проекты: статус может менять `teacher`, `university_staff`, `admin`
- Список пользователей: только `admin`
- Поиск пользователей: `admin`, `university_staff`
- Удаление/создание пользователей: `admin`
- Управление школами и классами: `admin`, `university_staff`
- Создание приглашений: `admin`, `university_staff`

## Приглашения
- Админ или сотрудник вуза создает приглашение: `{ schoolNumber }`
- Токен действует 7 дней, роль задается как `teacher`
- Регистрация по токену: роль и школа присваиваются автоматически
- Возвращается полная ссылка для регистрации: `invitationLink`
- Можно настроить URL фронтенда через `FRONTEND_URL` в .env

## GitHub OAuth
Функционал OAuth через GitHub удалён.