# PD Projects Backend

Backend API для платформы регистрации проектной деятельности учащихся.

## Возможности

- **Роли пользователей**: Школьник (Student), Учитель (Teacher), Сотрудник вуза (University Staff), Администратор (Admin)
- **Управление проектами**: Предложение, одобрение и отклонение проектов
- **Командная работа**: До 3 учеников в одной команде
- **Загрузка файлов**: Документы и презентации для проектов
- **Аутентификация**: JWT с контролем доступа на основе ролей (RBAC)
- **Школы и классы**: Привязка пользователей и проектов к конкретным школам и классам
- **Интеграция с GitHub**: Связывание профилей с GitHub
- **Система приглашений**: Создание инвайт-ссылок для регистрации преподавателей
- **Поиск пользователей**: Поиск по email (для админов и сотрудников вуза)

## Технологический стек

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Password Hashing**: bcryptjs

## Установка и запуск

1.  Клонируйте репозиторий:
    ```bash
    git clone https://github.com/IPodymov/pd-projects-backend.git
    cd pd-projects-backend
    ```

2.  Установите зависимости:
    ```bash
    npm install
    ```

3.  Настройте переменные окружения:
    Создайте файл `.env` в корневой директории:
    ```env
    DATABASE_URL=postgres://user:password@host:5432/database_name
    JWT_SECRET=your_secret_key_here
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    ```

4.  Запустите сервер разработки:
    ```bash
    npm run dev
    ```

5.  Или запустите в production режиме:
    ```bash
    npm start
    ```

Сервер запустится на порту 3000.

## API Endpoints

### Аутентификация (`/auth`)

#### Регистрация
- **POST** `/auth/register`
  - Body: `{ name, email, password, schoolId?, schoolClassId?, token? }`
  - Регистрирует нового пользователя (по умолчанию роль Student)
  - Если передан `token`, использует приглашение для определения роли и школы
  - Возвращает JWT токен и данные пользователя

#### Вход
- **POST** `/auth/login`
  - Body: `{ email, password }`
  - Возвращает JWT токен и данные пользователя

#### Создание приглашения (Admin)
- **POST** `/auth/invitation`
  - Body: `{ schoolNumber }`
  - Создает инвайт-ссылку для регистрации учителя

### Проекты (`/projects`)

#### Получение списка проектов
- **GET** `/projects`
  - Требует авторизации
  - Фильтрация по школе/классу в зависимости от роли
  - Ученики видят проекты своей школы и класса (или без указания класса)

#### Получение проекта
- **GET** `/projects/:id`
  - Требует авторизации
  - Возвращает детали проекта

#### Создание проекта
- **POST** `/projects`
  - Требует авторизации
  - Body: `{ title, description, githubUrl?, schoolId, schoolClassId? }`
  - Доступно: Student, Teacher, University Staff, Admin
  - Проекты от Admin/Teacher/Staff автоматически одобряются

#### Обновление проекта
- **PATCH** `/projects/:id`
  - Требует авторизации
  - Body: `{ title?, description?, githubUrl?, status? }`
  - Владелец может обновить название, описание, GitHub URL
  - Admin/Teacher/Staff могут обновить статус

#### Изменение статуса проекта
- **PATCH** `/projects/:id/status`
  - Требует роли: Teacher, University Staff, Admin
  - Body: `{ status: 'approved' | 'rejected' }`

#### Присоединение к проекту
- **POST** `/projects/:id/join`
  - Требует роли: Student
  - Добавляет ученика в команду проекта (макс. 3 участника)

#### Загрузка файлов
- **POST** `/projects/:id/upload`
  - Требует авторизации
  - Multipart/form-data с полями: `file`, `type` (document | presentation)

#### Удаление проекта (Admin)
- **DELETE** `/projects/:id`
  - Требует роли: Admin
  - Удаляет проект

### Пользователи (`/users`)

#### Список пользователей (Admin)
- **GET** `/users`
  - Требует роли: Admin
  - Возвращает список всех пользователей

#### Поиск пользователей
- **GET** `/users/search?email=...`
  - Требует роли: Admin, University Staff
  - Поиск по email (регистронезависимый, частичное совпадение)

#### Создание пользователя (Admin)
- **POST** `/users`
  - Требует роли: Admin
  - Body: `{ name, email, password, role, schoolId? }`

#### Обновление профиля
- **PATCH** `/users/:id`
  - Требует авторизации
  - Body: `{ name?, email?, password?, schoolId?, schoolClassId? }`
  - Пользователь может обновить свой профиль, Admin — любой

#### Изменение роли (Admin)
- **PATCH** `/users/:id/role`
  - Требует роли: Admin
  - Body: `{ role }`

#### Связывание с GitHub
- **POST** `/users/github/link`
  - Требует авторизации
  - Body: `{ code }` (OAuth код от GitHub)

#### Удаление пользователя (Admin)
- **DELETE** `/users/:id`
  - Требует роли: Admin

## Структура проекта

```
src/
├── controllers/        # Контроллеры для обработки запросов
│   ├── AuthController.ts
│   ├── ProjectController.ts
│   └── UserController.ts
├── entities/          # TypeORM сущности (модели)
│   ├── User.ts
│   ├── Project.ts
│   ├── School.ts
│   ├── SchoolClass.ts
│   ├── File.ts
│   └── Invitation.ts
├── middlewares/       # Middleware для аутентификации и авторизации
│   └── authMiddleware.ts
├── routes/            # Маршруты API
│   ├── index.ts
│   ├── authRoutes.ts
│   ├── projectRoutes.ts
│   ├── schoolRoutes.ts
│   └── userRoutes.ts
├── utils/             # Утилиты (загрузка файлов и т.д.)
│   └── fileUpload.ts
├── data-source.ts     # Конфигурация TypeORM
└── index.ts           # Точка входа приложения
```

## Роли и права доступа

| Роль              | Возможности                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| **Student**       | Создание проектов, присоединение к командам, загрузка файлов               |
| **Teacher**       | Все возможности Student + одобрение/отклонение проектов своей школы        |
| **University Staff** | Все возможности Teacher (может работать с любыми школами)              |
| **Admin**         | Полный доступ ко всем функциям, управление пользователями и проектами      |

## Примечания

- Проекты от учителей и администраторов автоматически получают статус "Одобрен"
- Ученики могут видеть проекты своей школы и класса, а также общешкольные проекты (без указания класса)
- Все пароли хешируются с помощью bcrypt
- JWT токены имеют срок действия 1 час
- При регистрации/входе информация о пользователе сохраняется в куки
- Профиль автоматически обновляется при изменении данных пользователя
