# Performance Stress Test

This page contains a large amount of content to stress test parsing performance and rendering.

---

## Table of Contents

1. [Section 1: Introduction](#section-1-introduction)
2. [Section 2: Core Concepts](#section-2-core-concepts)
3. [Section 3: Implementation Details](#section-3-implementation-details)
4. [Section 4: Advanced Topics](#section-4-advanced-topics)
5. [Section 5: API Reference](#section-5-api-reference)
6. [Section 6: Best Practices](#section-6-best-practices)
7. [Section 7: Troubleshooting](#section-7-troubleshooting)
8. [Section 8: Performance Optimization](#section-8-performance-optimization)
9. [Section 9: Security Considerations](#section-9-security-considerations)
10. [Section 10: Deployment Guide](#section-10-deployment-guide)

---

## Section 1: Introduction

### 1.1 Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### 1.2 Purpose

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

### 1.3 Scope

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.

### 1.4 Definitions

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| CLI | Command Line Interface |
| SSR | Server-Side Rendering |
| SSG | Static Site Generation |
| CDN | Content Delivery Network |

### 1.5 Background

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

---

## Section 2: Core Concepts

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Browser  │  Mobile App  │  Desktop App  │  CLI Tool        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Rate Limiting  │  Request Routing       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  User Service  │  Content Service  │  Search Service        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis Cache  │  Elasticsearch  │  S3        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Request Reception**: The client sends an HTTP request to the API gateway
2. **Authentication**: The gateway validates the authentication token
3. **Rate Limiting**: Request is checked against rate limiting rules
4. **Routing**: Request is routed to the appropriate service
5. **Processing**: The service processes the request
6. **Data Access**: Required data is fetched from the data layer
7. **Response Formation**: The response is constructed
8. **Caching**: Response is cached if applicable
9. **Delivery**: Response is sent back to the client

### 2.3 Component Interactions

> The system follows a microservices architecture where each service is responsible for a specific domain. Services communicate through a message queue for asynchronous operations and REST APIs for synchronous requests.

### 2.4 State Management

State is managed at multiple levels:

- **Client State**: Managed by the frontend application
- **Session State**: Stored in Redis with TTL
- **Application State**: Maintained by individual services
- **Persistent State**: Stored in PostgreSQL

### 2.5 Configuration Management

```yaml
application:
  name: my-service
  version: 1.0.0
  
server:
  port: 8080
  host: 0.0.0.0
  timeout: 30s
  
database:
  host: localhost
  port: 5432
  name: mydb
  pool_size: 20
  
cache:
  enabled: true
  ttl: 3600
  max_size: 1000
  
logging:
  level: info
  format: json
  output: stdout
```

---

## Section 3: Implementation Details

### 3.1 Module Structure

```
src/
├── index.ts           # Entry point
├── config/
│   ├── index.ts       # Configuration loader
│   ├── database.ts    # Database configuration
│   └── cache.ts       # Cache configuration
├── controllers/
│   ├── user.ts        # User controller
│   ├── content.ts     # Content controller
│   └── search.ts      # Search controller
├── services/
│   ├── user.ts        # User service
│   ├── content.ts     # Content service
│   └── search.ts      # Search service
├── repositories/
│   ├── user.ts        # User repository
│   ├── content.ts     # Content repository
│   └── search.ts      # Search repository
├── models/
│   ├── user.ts        # User model
│   ├── content.ts     # Content model
│   └── search.ts      # Search model
├── middleware/
│   ├── auth.ts        # Authentication middleware
│   ├── logging.ts     # Logging middleware
│   └── error.ts       # Error handling middleware
└── utils/
    ├── validation.ts  # Validation utilities
    ├── encryption.ts  # Encryption utilities
    └── formatting.ts  # Formatting utilities
```

### 3.2 Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE content_tags (
    content_id UUID REFERENCES content(id),
    tag_id UUID REFERENCES tags(id),
    PRIMARY KEY (content_id, tag_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published_at ON content(published_at);
```

### 3.3 Core Classes

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface Content {
  id: string;
  userId: string;
  title: string;
  body: string;
  status: ContentStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}

interface Tag {
  id: string;
  name: string;
}

type UserRole = 'admin' | 'editor' | 'user';
type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
```

### 3.4 Service Implementation

```typescript
class ContentService {
  constructor(
    private readonly contentRepo: ContentRepository,
    private readonly userRepo: UserRepository,
    private readonly cache: CacheService,
    private readonly search: SearchService
  ) {}

  async getById(id: string): Promise<Content | null> {
    // Check cache first
    const cached = await this.cache.get(`content:${id}`);
    if (cached) return cached;

    // Fetch from database
    const content = await this.contentRepo.findById(id);
    if (!content) return null;

    // Cache for future requests
    await this.cache.set(`content:${id}`, content, 3600);

    return content;
  }

  async create(userId: string, data: CreateContentDto): Promise<Content> {
    // Validate user exists
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Create content
    const content = await this.contentRepo.create({
      ...data,
      userId,
      status: 'draft',
    });

    // Index for search
    await this.search.index('content', content);

    return content;
  }

  async publish(id: string, userId: string): Promise<Content> {
    const content = await this.getById(id);
    if (!content) throw new NotFoundError('Content not found');
    if (content.userId !== userId) throw new ForbiddenError('Access denied');

    const updated = await this.contentRepo.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });

    // Invalidate cache
    await this.cache.delete(`content:${id}`);

    // Update search index
    await this.search.update('content', updated);

    return updated;
  }
}
```

### 3.5 Error Handling

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message: string, public readonly errors: FieldError[]) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}
```

---

## Section 4: Advanced Topics

### 4.1 Caching Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Cache-Aside** | Application manages cache population | General purpose |
| **Read-Through** | Cache loads data on miss | Frequently read data |
| **Write-Through** | Write to cache and database | Data consistency |
| **Write-Behind** | Async write to database | High write throughput |
| **Refresh-Ahead** | Proactive cache refresh | Predictable access patterns |

### 4.2 Load Balancing

- **Round Robin**: Distributes requests equally
- **Least Connections**: Routes to server with fewest connections
- **IP Hash**: Routes based on client IP
- **Weighted**: Routes based on server capacity
- **Health Checks**: Removes unhealthy servers

### 4.3 Message Queue Patterns

1. **Point-to-Point**: Direct producer to consumer communication
2. **Publish-Subscribe**: One-to-many message distribution
3. **Request-Reply**: Synchronous-style messaging
4. **Competing Consumers**: Multiple consumers share workload
5. **Message Router**: Content-based routing

### 4.4 Event Sourcing

```typescript
interface Event {
  id: string;
  aggregateId: string;
  type: string;
  data: unknown;
  timestamp: Date;
  version: number;
}

interface EventStore {
  append(aggregateId: string, events: Event[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>;
  getSnapshot(aggregateId: string): Promise<Snapshot | null>;
  saveSnapshot(snapshot: Snapshot): Promise<void>;
}

class ContentAggregate {
  private events: Event[] = [];
  private state: ContentState;

  constructor(id: string, events: Event[]) {
    this.state = { id, title: '', body: '', status: 'draft' };
    for (const event of events) {
      this.apply(event);
    }
  }

  private apply(event: Event): void {
    switch (event.type) {
      case 'ContentCreated':
        this.state.title = event.data.title;
        this.state.body = event.data.body;
        break;
      case 'ContentUpdated':
        Object.assign(this.state, event.data);
        break;
      case 'ContentPublished':
        this.state.status = 'published';
        this.state.publishedAt = event.timestamp;
        break;
    }
  }

  getState(): ContentState {
    return { ...this.state };
  }
}
```

### 4.5 CQRS Pattern

> Command Query Responsibility Segregation (CQRS) separates read and write operations into different models. This allows for independent scaling and optimization of each side.

**Commands** (Write Side):
- CreateUser
- UpdateContent
- PublishContent
- DeleteTag

**Queries** (Read Side):
- GetUserById
- ListContentByUser
- SearchContent
- GetPopularTags

---

## Section 5: API Reference

### 5.1 Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-01-15T12:00:00Z",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### 5.2 Users

#### List Users

```http
GET /api/users?page=1&limit=20&sort=createdAt&order=desc
Authorization: Bearer <token>
```

#### Get User

```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure-password",
  "name": "New User",
  "role": "user"
}
```

#### Update User

```http
PATCH /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

### 5.3 Content

#### List Content

```http
GET /api/content?status=published&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Content

```http
GET /api/content/:id
Authorization: Bearer <token>
```

#### Create Content

```http
POST /api/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My New Post",
  "body": "This is the content...",
  "tags": ["tutorial", "guide"]
}
```

#### Update Content

```http
PUT /api/content/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "Updated content..."
}
```

#### Publish Content

```http
POST /api/content/:id/publish
Authorization: Bearer <token>
```

#### Delete Content

```http
DELETE /api/content/:id
Authorization: Bearer <token>
```

### 5.4 Search

```http
GET /api/search?q=keyword&type=content&page=1&limit=20
Authorization: Bearer <token>
```

### 5.5 Error Responses

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## Section 6: Best Practices

### 6.1 Code Style

- Use meaningful variable and function names
- Keep functions small and focused
- Write self-documenting code
- Add comments only for complex logic
- Follow consistent formatting

### 6.2 Testing

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Measure response times
5. **Security Tests**: Identify vulnerabilities

### 6.3 Documentation

- Document all public APIs
- Include usage examples
- Keep documentation up to date
- Use clear and concise language
- Provide troubleshooting guides

### 6.4 Version Control

```bash
# Feature branch workflow
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request for review
gh pr create --title "Add new feature" --body "Description..."

# After approval, merge
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main
```

### 6.5 Code Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] No unnecessary complexity
- [ ] Error handling is appropriate
- [ ] Logging is adequate

---

## Section 7: Troubleshooting

### 7.1 Common Issues

#### Connection Refused

**Symptom**: `ECONNREFUSED` error when connecting to database

**Causes**:
- Database server is not running
- Incorrect connection parameters
- Firewall blocking connection

**Solutions**:
1. Verify database server is running
2. Check connection string
3. Review firewall rules

#### Out of Memory

**Symptom**: `JavaScript heap out of memory` error

**Causes**:
- Memory leak in application
- Large data processing
- Insufficient system memory

**Solutions**:
1. Profile memory usage
2. Implement streaming for large data
3. Increase Node.js heap size: `--max-old-space-size=4096`

#### Slow Queries

**Symptom**: Database queries taking too long

**Causes**:
- Missing indexes
- Inefficient query design
- Large result sets

**Solutions**:
1. Analyze query execution plan
2. Add appropriate indexes
3. Implement pagination

### 7.2 Debug Mode

```bash
# Enable debug logging
DEBUG=app:* npm start

# Enable specific modules
DEBUG=app:db,app:cache npm start

# Disable debug logging
DEBUG= npm start
```

### 7.3 Health Checks

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    search: await checkSearch(),
  };

  const healthy = Object.values(checks).every(c => c.status === 'healthy');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
});
```

### 7.4 Log Analysis

Common log patterns to watch for:

```
ERROR - Immediate attention required
WARN  - Potential issues
INFO  - Normal operation
DEBUG - Detailed debugging info
TRACE - Very detailed tracing
```

### 7.5 Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Response Time (p95) | 95th percentile latency | > 500ms |
| Error Rate | Percentage of 5xx errors | > 1% |
| CPU Usage | Server CPU utilization | > 80% |
| Memory Usage | Server memory utilization | > 85% |
| Disk I/O | Disk read/write operations | > 90% capacity |
| Connection Pool | Active database connections | > 80% of max |

---

## Section 8: Performance Optimization

### 8.1 Query Optimization

```sql
-- Before: Full table scan
SELECT * FROM content WHERE body LIKE '%keyword%';

-- After: Using full-text search index
SELECT * FROM content 
WHERE to_tsvector('english', body) @@ to_tsquery('keyword');

-- Before: N+1 query problem
SELECT * FROM content WHERE user_id = 1;
-- Then for each content: SELECT * FROM tags WHERE content_id = ?;

-- After: Single query with JOIN
SELECT c.*, t.* 
FROM content c
LEFT JOIN content_tags ct ON c.id = ct.content_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE c.user_id = 1;
```

### 8.2 Caching Implementation

```typescript
class CacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 8.3 Connection Pooling

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 8.4 Compression

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));
```

### 8.5 Lazy Loading

```typescript
// Lazy load modules
const heavyModule = await import('./heavy-module');

// Lazy load components (React)
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Lazy load data
const [data, setData] = useState(null);
useEffect(() => {
  if (isVisible) {
    fetchData().then(setData);
  }
}, [isVisible]);
```

---

## Section 9: Security Considerations

### 9.1 Authentication

- Use secure password hashing (bcrypt, argon2)
- Implement rate limiting on login attempts
- Use secure session management
- Implement MFA where appropriate

### 9.2 Authorization

```typescript
function authorize(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const roleHierarchy = { admin: 3, editor: 2, user: 1 };
    
    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}
```

### 9.3 Input Validation

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'editor', 'user']).optional(),
});

function validateInput<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}
```

### 9.4 SQL Injection Prevention

```typescript
// BAD: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// GOOD: Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

### 9.5 XSS Prevention

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const sanitized = DOMPurify.sanitize(userInput);

// Escape HTML entities
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### 9.6 CSRF Protection

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```

### 9.7 Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## Section 10: Deployment Guide

### 10.1 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### 10.2 Environment Setup

```bash
# Clone repository
git clone https://github.com/example/project.git
cd project

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 10.3 Database Setup

```bash
# Create database
createdb myapp

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 10.4 Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:6-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 10.5 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates installed
- [ ] Health checks configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures in place
- [ ] Log aggregation configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Security headers enabled

---

## Appendix A: Repeated Content for Performance Testing

### A.1 Lorem Ipsum Block 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.2 Lorem Ipsum Block 2

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.3 Lorem Ipsum Block 3

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.4 Lorem Ipsum Block 4

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.5 Lorem Ipsum Block 5

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.6 Lorem Ipsum Block 6

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.7 Lorem Ipsum Block 7

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.8 Lorem Ipsum Block 8

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.9 Lorem Ipsum Block 9

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### A.10 Lorem Ipsum Block 10

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

---

## Appendix B: Large Data Table

| ID | Name | Email | Role | Status | Created | Updated | Score | Level | Region |
|----|------|-------|------|--------|---------|---------|-------|-------|--------|
| 1 | Alice Johnson | alice@example.com | Admin | Active | 2024-01-01 | 2024-01-15 | 95 | 10 | US-East |
| 2 | Bob Smith | bob@example.com | User | Active | 2024-01-02 | 2024-01-14 | 82 | 8 | US-West |
| 3 | Carol White | carol@example.com | Editor | Active | 2024-01-03 | 2024-01-13 | 78 | 7 | EU-West |
| 4 | David Brown | david@example.com | User | Inactive | 2024-01-04 | 2024-01-12 | 65 | 5 | EU-East |
| 5 | Eve Davis | eve@example.com | Admin | Active | 2024-01-05 | 2024-01-11 | 91 | 9 | APAC |
| 6 | Frank Miller | frank@example.com | User | Active | 2024-01-06 | 2024-01-10 | 73 | 6 | US-East |
| 7 | Grace Wilson | grace@example.com | Editor | Active | 2024-01-07 | 2024-01-09 | 88 | 8 | US-West |
| 8 | Henry Moore | henry@example.com | User | Pending | 2024-01-08 | 2024-01-08 | 45 | 3 | EU-West |
| 9 | Iris Taylor | iris@example.com | User | Active | 2024-01-09 | 2024-01-15 | 67 | 5 | EU-East |
| 10 | Jack Anderson | jack@example.com | Admin | Active | 2024-01-10 | 2024-01-14 | 99 | 10 | APAC |
| 11 | Karen Thomas | karen@example.com | User | Active | 2024-01-11 | 2024-01-13 | 71 | 6 | US-East |
| 12 | Leo Jackson | leo@example.com | Editor | Inactive | 2024-01-12 | 2024-01-12 | 58 | 4 | US-West |
| 13 | Maria Garcia | maria@example.com | User | Active | 2024-01-13 | 2024-01-15 | 84 | 8 | EU-West |
| 14 | Nathan Lee | nathan@example.com | User | Active | 2024-01-14 | 2024-01-14 | 76 | 7 | EU-East |
| 15 | Olivia Martin | olivia@example.com | Admin | Active | 2024-01-15 | 2024-01-15 | 93 | 9 | APAC |
| 16 | Peter Clark | peter@example.com | User | Pending | 2024-01-01 | 2024-01-10 | 42 | 3 | US-East |
| 17 | Quinn Lewis | quinn@example.com | Editor | Active | 2024-01-02 | 2024-01-11 | 79 | 7 | US-West |
| 18 | Rachel Hall | rachel@example.com | User | Active | 2024-01-03 | 2024-01-12 | 86 | 8 | EU-West |
| 19 | Samuel Young | samuel@example.com | User | Inactive | 2024-01-04 | 2024-01-13 | 54 | 4 | EU-East |
| 20 | Tina King | tina@example.com | Admin | Active | 2024-01-05 | 2024-01-14 | 97 | 10 | APAC |

---

## Appendix C: Deep Nesting Test

### C.1 Level 1

#### C.1.1 Level 2

##### C.1.1.1 Level 3

###### C.1.1.1.1 Level 4

Level 4 content with **bold**, *italic*, and `code`.

> Level 4 blockquote with nested content
>> Level 5 nested blockquote
>>> Level 6 deeply nested

- Level 4 list
  - Level 5 nested
    - Level 6 deeply nested
      - Level 7 very deeply nested
        - Level 8 extremely nested

###### C.1.1.1.2 Level 4 Second

Another section at level 4.

##### C.1.1.2 Level 3 Second

Back to level 3.

#### C.1.2 Level 2 Second

Back to level 2.

### C.2 Level 1 Second

Another major section.

---

[← Back to home](/)
