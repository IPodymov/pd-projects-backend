# Project Activity Registration Backend

Backend for the "Project Activity Registration" web application.

## Features

- **User Roles**: Student, Teacher, University Staff, Admin.
- **Project Management**: Propose, Approve, Reject projects.
- **Team Management**: Max 3 students per project.
- **File Uploads**: Documents and Presentations.
- **Auth**: JWT-based authentication with Role-Based Access Control (RBAC).

## Tech Stack

- Node.js
- Express
- TypeScript
- TypeORM
- PostgreSQL

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL=postgres://postgres:postgres@localhost:5432/pd_projects
    JWT_SECRET=your_secret_key
    ```

3.  Run the server:
    ```bash
    npm run dev
    ```

## API Endpoints

### Auth
- `POST /auth/register` - Register a new user (Student by default).
- `POST /auth/login` - Login and get JWT.

### Projects
- `GET /projects` - List all projects.
- `GET /projects/:id` - Get project details.
- `POST /projects` - Create a project (Student only).
- `POST /projects/:id/join` - Join a project (Student only).
- `POST /projects/:id/upload` - Upload file (Owner/Member).
- `PATCH /projects/:id/status` - Approve/Reject (Teacher/Staff/Admin).

### Users (Admin)
- `GET /users` - List all users.
- `POST /users` - Create a user with specific role.
- `DELETE /users/:id` - Delete a user.
- `PATCH /users/:id/role` - Change user role.
