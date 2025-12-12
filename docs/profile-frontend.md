# Работа с профилем пользователя на фронтенде

## Получение профиля текущего пользователя

### Endpoint
```http
GET /users/profile
Authorization: Bearer <jwt_token>
```

### Ответ
```json
{
  "id": 5,
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "role": "student",
  "schoolId": 3,
  "schoolClassId": 7,
  "school": {
    "id": 3,
    "number": "042",
    "name": "Гимназия №42",
    "city": "Москва"
  },
  "schoolClass": {
    "id": 7,
    "name": "10 класс",
    "schoolId": 3
  }
}
```

---

## Обновление профиля

### Endpoint
```http
PATCH /users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Тело запроса
Все поля опциональны - отправляйте только те, которые нужно обновить:

```json
{
  "name": "Иван Петров",
  "email": "new.email@example.com",
  "password": "newpassword123",
  "schoolId": 5,
  "schoolClassId": 12
}
```

### Ответ
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 5,
    "name": "Иван Петров",
    "email": "new.email@example.com",
    "role": "student",
    "schoolId": 5,
    "schoolClassId": 12,
    "school": {
      "id": 5,
      "number": "015",
      "name": "Лицей №15",
      "city": "Москва"
    },
    "schoolClass": {
      "id": 12,
      "name": "11 класс",
      "schoolId": 5
    }
  }
}
```

---

## Правила обновления полей

### Общие поля (все роли)
- **name**: минимум 1 символ после trim
- **email**: должен быть уникальным, автоматически приводится к lowercase
- **password**: минимум 6 символов (необязательно, если не нужно менять пароль)

### Для роли Student (Студент)
Может обновлять:
- `name` - имя
- `email` - электронная почта
- `password` - пароль
- **НЕ может менять школу и класс**

### Для роли Teacher (Учитель)
Может обновлять:
- `name` - имя
- `email` - электронная почта
- `password` - пароль
- `schoolId` - смена школы
- **НЕ может менять класс**

### Для роли University Staff (Сотрудник вуза) и Admin (Администратор)
Может обновлять **ВСЕ поля**:
- `name` - имя
- `email` - электронная почта
- `password` - пароль
- `schoolId` - смена школы
- `schoolClassId` - смена класса

---

## Коды ошибок

| Код | Сообщение | Причина |
|-----|-----------|---------|
| 400 | Password must be at least 6 characters | Пароль короче 6 символов |
| 404 | User not found | Пользователь не найден (некорректный token) |
| 409 | Email already in use | Email занят другим пользователем |
| 500 | Error updating profile | Ошибка базы данных |

---

## Примеры использования (React)

### 1. Получение профиля при загрузке страницы

```typescript
import { useEffect, useState } from 'react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId: number;
  schoolClassId?: number;
  school?: {
    id: number;
    number: string;
    name: string;
    city: string;
  };
  schoolClass?: {
    id: number;
    name: string;
    schoolId: number;
  };
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!profile) return <div>Профиль не найден</div>;

  return (
    <div>
      <h1>Профиль</h1>
      <p>Имя: {profile.name}</p>
      <p>Email: {profile.email}</p>
      <p>Роль: {profile.role}</p>
      {profile.school && (
        <p>Школа: {profile.school.name} ({profile.school.city})</p>
      )}
      {profile.schoolClass && (
        <p>Класс: {profile.schoolClass.name}</p>
      )}
    </div>
  );
}
```

---

### 2. Форма редактирования профиля

```typescript
import { useState, useEffect } from 'react';

function EditProfileForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolId: '',
    schoolClassId: ''
  });
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Загрузить текущий профиль
    fetchProfile();
    // Загрузить список школ
    fetchSchools();
  }, []);

  useEffect(() => {
    // Загрузить классы при выборе школы
    if (formData.schoolId) {
      fetchClasses(formData.schoolId);
    }
  }, [formData.schoolId]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/users/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setFormData({
        name: data.name,
        email: data.email,
        password: '',
        schoolId: data.schoolId || '',
        schoolClassId: data.schoolClassId || ''
      });
    }
  };

  const fetchSchools = async () => {
    const response = await fetch('http://localhost:3000/schools');
    if (response.ok) {
      const data = await response.json();
      setSchools(data);
    }
  };

  const fetchClasses = async (schoolId: string) => {
    const response = await fetch(`http://localhost:3000/schools/${schoolId}/classes`);
    if (response.ok) {
      const data = await response.json();
      setClasses(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Отправляем только измененные поля
      const updates: any = {};
      if (formData.name.trim()) updates.name = formData.name;
      if (formData.email.trim()) updates.email = formData.email;
      if (formData.password.trim()) updates.password = formData.password;
      if (formData.schoolId) updates.schoolId = parseInt(formData.schoolId);
      if (formData.schoolClassId) updates.schoolClassId = parseInt(formData.schoolClassId);

      const response = await fetch('http://localhost:3000/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Профиль успешно обновлён!');
        // Очистить поле пароля
        setFormData(prev => ({ ...prev, password: '' }));
        // Обновить данные в локальном состоянии
        console.log('Updated user:', data.user);
      } else {
        setError(data.message || 'Ошибка при обновлении профиля');
      }
    } catch (err) {
      setError('Произошла ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Редактировать профиль</h2>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}

      <div>
        <label>
          Имя:
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Email:
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Новый пароль (оставьте пустым, если не хотите менять):
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Минимум 6 символов"
          />
        </label>
      </div>

      <div>
        <label>
          Школа:
          <select
            value={formData.schoolId}
            onChange={(e) => setFormData({ 
              ...formData, 
              schoolId: e.target.value,
              schoolClassId: '' // Сбросить класс при смене школы
            })}
          >
            <option value="">Выберите школу</option>
            {schools.map((school: any) => (
              <option key={school.id} value={school.id}>
                {school.number} - {school.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Класс:
          <select
            value={formData.schoolClassId}
            onChange={(e) => setFormData({ ...formData, schoolClassId: e.target.value })}
            disabled={!formData.schoolId}
          >
            <option value="">Выберите класс</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </form>
  );
}

export default EditProfileForm;
```

---

### 3. Упрощенная версия (только имя и email)

```typescript
function SimpleProfileEdit() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Загрузить данные
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setName(data.name);
      setEmail(data.email);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    
    const res = await fetch('http://localhost:3000/users/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email })
    });

    if (res.ok) {
      alert('Профиль обновлён!');
    } else {
      const error = await res.json();
      alert(error.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя"
      />
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}
```

---

## Валидация на фронтенде

Рекомендуется проверять данные перед отправкой:

```typescript
const validateProfile = (data: any) => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Имя обязательно для заполнения');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Некорректный email');
  }

  if (data.password && data.password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов');
  }

  return errors;
};
```

---

## Советы по UX

1. **Не требуйте пароль для обновления других полей** - пароль должен быть опциональным
2. **Показывайте текущие значения** в форме редактирования
3. **Подтверждение изменений** - показывайте уведомление об успешном сохранении
4. **Обработка ошибок** - четко объясняйте причину ошибки пользователю
5. **Дизейбл кнопки** - блокируйте кнопку "Сохранить" во время отправки
6. **Валидация в реальном времени** - проверяйте email и длину пароля сразу

---

## Безопасность

- Всегда отправляйте JWT токен в заголовке `Authorization`
- Храните токен в `localStorage` или `sessionStorage`
- Не храните пароль в состоянии компонента дольше необходимого
- Используйте HTTPS в production
- Валидируйте данные как на фронтенде, так и на бэкенде
