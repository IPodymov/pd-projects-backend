# Примеры использования API для Frontend

## Получение данных для формы регистрации

### 1. Получение списка всех школ

**Запрос:**
```http
GET /schools
```

**Ответ:**
```json
[
  {
    "id": 1,
    "number": "001",
    "name": "Гимназия №1",
    "city": "Москва"
  },
  {
    "id": 2,
    "number": "042",
    "name": "Школа №42",
    "city": "Санкт-Петербург"
  }
]
```

**Использование в React:**
```typescript
// Загрузка школ для combobox
const [schools, setSchools] = useState([]);

useEffect(() => {
  fetch('http://localhost:3000/schools')
    .then(res => res.json())
    .then(data => setSchools(data))
    .catch(err => console.error(err));
}, []);

// В компоненте
<select name="schoolId" required>
  <option value="">Выберите школу</option>
  {schools.map(school => (
    <option key={school.id} value={school.id}>
      {school.number} - {school.name} ({school.city})
    </option>
  ))}
</select>
```

---

### 2. Поиск школы по названию/номеру/городу

**Запрос:**
```http
GET /schools?search=гимназия
```

**Ответ:**
```json
[
  {
    "id": 1,
    "number": "001",
    "name": "Гимназия №1",
    "city": "Москва"
  },
  {
    "id": 5,
    "number": "015",
    "name": "Гимназия №15",
    "city": "Казань"
  }
]
```

**Использование с поиском:**
```typescript
const [schools, setSchools] = useState([]);
const [searchTerm, setSearchTerm] = useState('');

const searchSchools = async (term: string) => {
  const url = term 
    ? `http://localhost:3000/schools?search=${encodeURIComponent(term)}`
    : 'http://localhost:3000/schools';
  
  const response = await fetch(url);
  const data = await response.json();
  setSchools(data);
};

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    searchSchools(searchTerm);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchTerm]);
```

---

### 3. Получение классов для выбранной школы

**Запрос:**
```http
GET /schools/1/classes
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "9А",
    "schoolId": 1,
    "school": {
      "id": 1,
      "number": "001",
      "name": "Гимназия №1",
      "city": "Москва"
    }
  },
  {
    "id": 2,
    "name": "9Б",
    "schoolId": 1,
    "school": {
      "id": 1,
      "number": "001",
      "name": "Гимназия №1",
      "city": "Москва"
    }
  },
  {
    "id": 3,
    "name": "10А",
    "schoolId": 1,
    "school": {
      "id": 1,
      "number": "001",
      "name": "Гимназия №1",
      "city": "Москва"
    }
  }
]
```

**Использование в React:**
```typescript
const [selectedSchoolId, setSelectedSchoolId] = useState(null);
const [classes, setClasses] = useState([]);

// Загрузка классов при выборе школы
useEffect(() => {
  if (selectedSchoolId) {
    fetch(`http://localhost:3000/schools/${selectedSchoolId}/classes`)
      .then(res => res.json())
      .then(data => setClasses(data))
      .catch(err => console.error(err));
  } else {
    setClasses([]);
  }
}, [selectedSchoolId]);

// В компоненте
<select 
  name="schoolId" 
  onChange={(e) => setSelectedSchoolId(e.target.value)}
  required
>
  <option value="">Выберите школу</option>
  {schools.map(school => (
    <option key={school.id} value={school.id}>
      {school.number} - {school.name}
    </option>
  ))}
</select>

<select name="schoolClassId" disabled={!selectedSchoolId}>
  <option value="">Выберите класс (опционально)</option>
  {classes.map(cls => (
    <option key={cls.id} value={cls.id}>
      {cls.name}
    </option>
  ))}
</select>
```

---

### 4. Поиск классов для школы

**Запрос:**
```http
GET /schools/1/classes?search=9
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "9А",
    "schoolId": 1
  },
  {
    "id": 2,
    "name": "9Б",
    "schoolId": 1
  }
]
```

---

### 5. Полный пример формы регистрации

```typescript
import React, { useState, useEffect } from 'react';

const RegistrationForm = () => {
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolId: '',
    schoolClassId: ''
  });
  const [schoolSearch, setSchoolSearch] = useState('');

  // Загрузка школ с поиском
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = schoolSearch 
        ? `http://localhost:3000/schools?search=${encodeURIComponent(schoolSearch)}`
        : 'http://localhost:3000/schools';
      
      fetch(url)
        .then(res => res.json())
        .then(data => setSchools(data))
        .catch(err => console.error(err));
    }, 300);

    return () => clearTimeout(timer);
  }, [schoolSearch]);

  // Загрузка классов при выборе школы
  useEffect(() => {
    if (formData.schoolId) {
      fetch(`http://localhost:3000/schools/${formData.schoolId}/classes`)
        .then(res => res.json())
        .then(data => setClasses(data))
        .catch(err => console.error(err));
    } else {
      setClasses([]);
    }
  }, [formData.schoolId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        schoolId: parseInt(formData.schoolId),
        schoolClassId: formData.schoolClassId ? parseInt(formData.schoolClassId) : undefined
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Сохранить токен и перенаправить пользователя
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Имя:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Пароль:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Поиск школы:</label>
        <input
          type="text"
          placeholder="Введите номер, название или город"
          value={schoolSearch}
          onChange={(e) => setSchoolSearch(e.target.value)}
        />
      </div>

      <div>
        <label>Школа:</label>
        <select
          value={formData.schoolId}
          onChange={(e) => setFormData({
            ...formData, 
            schoolId: e.target.value,
            schoolClassId: '' // Сбросить класс при смене школы
          })}
          required
        >
          <option value="">Выберите школу</option>
          {schools.map(school => (
            <option key={school.id} value={school.id}>
              {school.number} - {school.name} {school.city && `(${school.city})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Класс (опционально):</label>
        <select
          value={formData.schoolClassId}
          onChange={(e) => setFormData({...formData, schoolClassId: e.target.value})}
          disabled={!formData.schoolId}
        >
          <option value="">Выберите класс</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
};

export default RegistrationForm;
```

---

## Важные замечания

1. **Публичный доступ**: Эндпоинты для получения школ и классов доступны без авторизации, что позволяет использовать их в форме регистрации.

2. **Поиск**: Поиск работает с параметром `?search=...` и ищет по частичному совпадению (case-insensitive).

3. **Сортировка**: Школы сортируются по номеру, классы - по названию.

4. **Опциональность класса**: При регистрации `schoolClassId` может быть не указан.

5. **ID или номер**: В API используются `id` (числовые идентификаторы), а не строковые номера школ.
