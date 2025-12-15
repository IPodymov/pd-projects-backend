# Авторизация и Пользователи

## Роли

В системе предусмотрены следующие роли:
- `ADMIN` - Администратор
- `STUDENT` - Учащийся (выдается по умолчанию при регистрации)
- `UNIVERSITY_STAFF` - Сотрудник вуза

## API Эндпоинты

### Авторизация

#### Регистрация
`POST /auth/registration`

Тело запроса:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Логин
`POST /auth/login`

Тело запроса:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ:
```json
{
  "token": "JWT_TOKEN"
}
```
*Примечание: Токен также устанавливается в HttpOnly Cookie `Authentication`.*

#### Восстановление пароля
`POST /auth/forgot-password`

Тело запроса:
```json
{
  "email": "user@example.com"
}
```

#### Сброс пароля
`POST /auth/reset-password`

Тело запроса:
```json
{
  "token": "RESET_TOKEN",
  "newPassword": "newPassword123"
}
```

### Пользователи

#### Профиль пользователя
`GET /users/profile`
*Требуется авторизация*

Возвращает информацию о текущем пользователе, включая роли и проекты.

#### Получение всех пользователей (TODO)
`GET /users`

#### Создание пользователя (внутренний метод)
Используется сервисом авторизации.
