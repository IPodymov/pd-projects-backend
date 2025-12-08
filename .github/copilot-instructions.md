# PD Projects Backend - Development Guide

## Project Summary

Complete backend API for "Project Activity Registration" platform with Express.js, TypeScript, PostgreSQL, and TypeORM.

**Features**: User management with RBAC, project CRUD, team collaboration, file uploads, GitHub OAuth, invitation system, school/class organization.

## Database Schema

### Core Entities
- **User**: id, name, email, password, role, githubId, githubUsername, schoolId (FK), schoolClassId (FK)
- **Project**: id, title, description, githubUrl, status, schoolId (FK), schoolClassId (FK), ownerId (FK)
- **School**: id, number, name, city
- **SchoolClass**: id, name, schoolId (FK)
- **File**: id, originalName, storagePath, fileType, projectId (FK)
- **Invitation**: id, token, schoolNumber, createdBy, createdAt

### Key Relations
- User ManyToOne School/SchoolClass
- Project ManyToOne School/SchoolClass/User(owner)
- Project ManyToMany User(members)
- SchoolClass ManyToOne School

## API Endpoints

### Auth (`/auth`)
- `POST /register` - Register (schoolId/schoolClassId or token)
- `POST /login` - Login
- `POST /invite` - Create invitation (Admin/Staff only)

### Projects (`/projects`)
- `GET /` - List projects (filtered by school/class)
- `GET /:id` - Get details
- `POST /` - Create (schoolId required)
- `PATCH /:id` - Update
- `PATCH /:id/status` - Change status (Teacher/Staff/Admin)
- `POST /:id/join` - Join team (Student)
- `POST /:id/upload` - Upload files
- `DELETE /:id` - Delete (Admin only)

### Users (`/users`)
- `GET /` - List (Admin only)
- `GET /search` - Search by email (Admin/Staff)
- `POST /` - Create (Admin only)
- `PATCH /:id` - Update profile
- `PATCH /:id/role` - Change role (Admin only)
- `POST /github/link` - Link GitHub
- `DELETE /:id` - Delete (Admin only)

## Recent Refactoring

**Schema normalized from strings to foreign keys**:
- schoolNumber → schoolId (FK to School)
- classNumber → schoolClassId (FK to SchoolClass)

**Updated Controllers**:
- AuthController: register() now accepts schoolId/schoolClassId
- ProjectController: listAll() and createProject() use FK relationships
- UserController: All methods use new FK structure

## Development Notes

1. **Eager loading**: Include relations in queries for nested data
2. **Role-based filtering**: Applied at query level for performance
3. **File storage**: Multer with local filesystem
4. **Auth**: JWT (1 hour) + bcryptjs (8 salt rounds)
5. **Invitations**: Secure tokens with schoolNumber mapping

## Running the Project

```bash
npm install
npm run dev          # Development server (port 3000)
npm run build        # TypeScript build
npm start            # Production server
```

## Environment Variables

```env
DATABASE_URL=postgres://user:password@host:5432/db
JWT_SECRET=your_secret_key
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## Tasks

- [ ] Data migration system (string → FK)
- [ ] Seed School/SchoolClass tables
- [ ] OpenAPI/Swagger documentation
- [ ] Unit/integration tests
- [ ] Rate limiting
- [ ] Email notifications
- [ ] Input validation/sanitization
