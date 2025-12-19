# Кеширование проектов

## Описание

Реализовано встроенное кеширование проектов с использованием `@nestjs/cache-manager` для улучшения производительности и удобства работы на фронте.

## Установленные пакеты

- `@nestjs/cache-manager` - встроенный модуль NestJS для кеширования
- `cache-manager` - базовая библиотека для управления кешем (по умолчанию использует memory storage)

## Архитектура кеширования

### Стратегия кеширования

1. **Кеширование списка проектов (`findAll`)**
   - Кеш-ключи формируются на основе: `userId`, `search`, `institutionId`
   - TTL: 5 минут
   - Отслеживаются активные ключи для инвалидации

2. **Кеширование отдельного проекта (`findOne`)**
   - Кеш-ключ: `project:{id}`
   - TTL: 5 минут

### Инвалидация кеша

Кеш инвалидируется при следующих операциях:

- **Создание проекта** - очищаются все кеши списков проектов
- **Обновление проекта** - очищаются кеш конкретного проекта и все списки
- **Удаление проекта** - очищаются кеш конкретного проекта и все списки
- **Присоединение участника** - очищаются оба типа кешей
- **Создание приглашения** - очищается кеш проекта
- **Загрузка файлов** - очищается кеш проекта

## Использование

### Фронт-енд

Благодаря кешированию:

1. **Быстрые повторные запросы** - список проектов будет возвращён из кеша за ~1-5ms вместо запроса к БД
2. **Уменьшенная нагрузка на БД** - количество запросов к базе существенно снижается
3. **Предсказуемые TTL** - данные в кеше свежие, с максимальной задержкой 5 минут

### Примеры запросов

```bash
# Получение списка проектов (закешировано)
GET /projects

# Получение проектов с поиском (отдельный кеш-ключ)
GET /projects?search=machine%20learning

# Получение проектов по учреждению (отдельный кеш-ключ)
GET /projects?institutionId=1

# Получение конкретного проекта (закешировано)
GET /projects/1
```

## Конфигурация

### app.module.ts

```typescript
CacheModule.register({
  isGlobal: true,
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
})
```

### projects.module.ts

```typescript
imports: [
  ...
  CacheModule.register(),
  ...
]
```

## Расширение функциональности

### Использование Redis в продакшене

Для масштабируемого продакшена рекомендуется использовать Redis:

```bash
npm install cache-manager-redis-store
```

```typescript
// app.module.ts
import * as redisStore from 'cache-manager-redis-store';

CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: 'localhost', // default value
  port: 6379, // default value
  ttl: 5 * 60 * 1000,
})
```

### Кастомная TTL для разных типов

```typescript
// В конкретном методе сервиса
await this.cacheManager.set(cacheKey, data, 10 * 60 * 1000); // 10 минут
```

## Мониторинг

Для отладки кеширования можно добавить логирование:

```typescript
async findAll(user?: User, search?: string, institutionId?: number) {
  const cacheKey = this.getCacheKey(...);
  
  const cachedProjects = await this.cacheManager.get<Project[]>(cacheKey);
  if (cachedProjects) {
    console.log('✅ Cache hit:', cacheKey);
    return cachedProjects;
  }
  
  console.log('❌ Cache miss:', cacheKey);
  // ... fetch from DB
}
```

## Заметки

- При развёртывании на нескольких инстансах рекомендуется использовать Redis для обмена кешем между инстансами
- Текущая реализация использует в памяти хранилище, подходящее для разработки и малых приложений
- Для очистки кеша в production используйте: `await this.cacheManager.reset()`
