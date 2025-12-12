# Примеры использования административных функций

## Управление школами и классами (Admin и University Staff)

### 1. Создание школы

**Запрос:**
```http
POST /schools
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "number": "042",
  "name": "Гимназия №42",
  "city": "Москва"
}
```

**Ответ:**
```json
{
  "id": 5,
  "number": "042",
  "name": "Гимназия №42",
  "city": "Москва",
  "classes": [
    {
      "id": 15,
      "name": "9 класс",
      "schoolId": 5
    },
    {
      "id": 16,
      "name": "10 класс",
      "schoolId": 5
    },
    {
      "id": 17,
      "name": "11 класс",
      "schoolId": 5
    }
  ]
}
```

**Автоматически создаются 3 класса** для новой школы.

---

### 2. Добавление класса в существующую школу

**Запрос:**
```http
POST /schools/5/classes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "8 класс"
}
```

**Ответ:**
```json
{
  "id": 18,
  "name": "8 класс",
  "schoolId": 5
}
```

---

### 3. Обновление информации о школе

**Запрос:**
```http
PATCH /schools/5
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Лицей №42",
  "city": "Санкт-Петербург"
}
```

**Ответ:**
```json
{
  "id": 5,
  "number": "042",
  "name": "Лицей №42",
  "city": "Санкт-Петербург"
}
```

---

### 4. Обновление класса

**Запрос:**
```http
PATCH /schools/classes/18
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "8А класс"
}
```

**Ответ:**
```json
{
  "id": 18,
  "name": "8А класс",
  "schoolId": 5
}
```

---

### 5. Удаление класса

**Запрос:**
```http
DELETE /schools/classes/18
Authorization: Bearer <jwt_token>
```

**Ответ:** `204 No Content`

---

### 6. Удаление школы

**Запрос:**
```http
DELETE /schools/5
Authorization: Bearer <jwt_token>
```

**Ответ:** `204 No Content`

**⚠️ Внимание**: Удаление школы удалит все связанные классы (каскадное удаление).

---

## Система приглашений учителей (Admin и University Staff)

### 7. Создание приглашения для учителя

**Запрос:**
```http
POST /auth/invitation
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "schoolNumber": "042"
}
```

**Ответ:**
```json
{
  "message": "Invitation created successfully",
  "invitation": {
    "id": 12,
    "token": "a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8",
    "schoolNumber": "042",
    "role": "teacher",
    "expiresAt": "2025-12-19T10:30:00.000Z",
    "link": "http://localhost:3001/auth/register?token=a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8"
  },
  "invitationLink": "http://localhost:3001/auth/register?token=a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8"
}
```

**Детали:**
- `invitationLink` - готовая ссылка для отправки учителю
- Ссылка действует 7 дней
- При регистрации по ссылке пользователь автоматически получает роль `teacher` и привязывается к школе с номером `042`

---

### 8. Настройка фронтенд URL

В `.env` файле:
```env
FRONTEND_URL=https://yourfrontend.com
```

Если не задан, используется адрес backend (`http://localhost:3000`).

**Пример с кастомным frontend:**
```json
{
  "invitationLink": "https://myschool.ru/register?token=a3b4c5d6e7f8..."
}
```

---

## Права доступа

| Действие | Admin | University Staff | Teacher | Student |
|----------|-------|------------------|---------|---------|
| Создание школы | ✅ | ✅ | ❌ | ❌ |
| Обновление школы | ✅ | ✅ | ❌ | ❌ |
| Удаление школы | ✅ | ✅ | ❌ | ❌ |
| Создание класса | ✅ | ✅ | ❌ | ❌ |
| Обновление класса | ✅ | ✅ | ❌ | ❌ |
| Удаление класса | ✅ | ✅ | ❌ | ❌ |
| Создание приглашения | ✅ | ✅ | ❌ | ❌ |
| Просмотр школ/классов | ✅ | ✅ | ✅ | ✅ (публично) |

---

## Использование в JavaScript/TypeScript

```typescript
// Создание школы
async function createSchool(token: string) {
  const response = await fetch('http://localhost:3000/schools', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: '042',
      name: 'Гимназия №42',
      city: 'Москва'
    })
  });
  
  const school = await response.json();
  console.log('Создана школа с классами:', school);
  return school;
}

// Создание приглашения
async function createInvitation(token: string, schoolNumber: string) {
  const response = await fetch('http://localhost:3000/auth/invitation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ schoolNumber })
  });
  
  const result = await response.json();
  console.log('Ссылка для приглашения:', result.invitationLink);
  
  // Скопировать в буфер обмена
  navigator.clipboard.writeText(result.invitationLink);
  
  return result;
}

// Добавление класса
async function addClass(token: string, schoolId: number, className: string) {
  const response = await fetch(`http://localhost:3000/schools/${schoolId}/classes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: className })
  });
  
  return await response.json();
}
```

---

## Workflow: Настройка новой школы

1. **Admin/University Staff создаёт школу**
   - POST /schools
   - Автоматически создаются 3 класса

2. **При необходимости добавляет дополнительные классы**
   - POST /schools/:schoolId/classes

3. **Создаёт приглашения для учителей**
   - POST /auth/invitation
   - Отправляет `invitationLink` учителям по email

4. **Учителя регистрируются по ссылке**
   - Автоматически получают роль `teacher`
   - Привязываются к школе

5. **Ученики регистрируются через публичную форму**
   - Выбирают школу из списка (GET /schools)
   - Выбирают класс (GET /schools/:schoolId/classes)
