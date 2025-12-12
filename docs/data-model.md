# Модель данных (TypeORM)

## Сущности
- `User`: id, name, email, password, role, githubId?, githubUsername?, schoolId, schoolClassId?
- `Project`: id, title, description, status, githubUrl?, schoolId, schoolClassId?, ownerId, members[], files[]
- `School`: id, number (unique), name, city?, classes[]
- `SchoolClass`: id, name, schoolId
- `Invitation`: id, token (unique), schoolNumber, role, expiresAt, createdAt
- `File`: id, filename, path, type, projectId
- `Chat`/`Message`: чаты классов и сообщения

## Связи
- User — ManyToOne — School/SchoolClass
- Project — ManyToOne — School/SchoolClass/User(owner)
- Project — ManyToMany — User(members) с `@JoinTable()` на стороне Project
- SchoolClass — ManyToOne — School

## Замечания
- `synchronize: true` используется для разработки, не для production
- Валидация уникальности `School.number`
- Удаление SchoolClass ведет к каскадному удалению зависимых Chat (посредством onDelete)