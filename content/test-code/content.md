# Code Block Stress Test

This page tests code blocks with all supported Shiki languages and edge cases.

---

## JavaScript

```javascript
// JavaScript example with various features
const greeting = "Hello, World!";
let counter = 0;

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const arrowFunc = (x, y) => x + y;

class Calculator {
  constructor(value = 0) {
    this.value = value;
  }

  add(n) {
    this.value += n;
    return this;
  }

  multiply(n) {
    this.value *= n;
    return this;
  }
}

// Async/await
async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Destructuring and spread
const { name, age } = user;
const newArray = [...oldArray, newItem];
const newObj = { ...oldObj, newProp: value };

// Template literals
const message = `Hello, ${name}! You are ${age} years old.`;

// Array methods
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

---

## TypeScript

```typescript
// TypeScript with type annotations and generics
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

type Status = "pending" | "active" | "inactive";

interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T>;
  delete(id: number): Promise<boolean>;
}

class UserRepository implements Repository<User> {
  private users: Map<number, User> = new Map();
  private nextId = 1;

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async create(entity: Omit<User, "id">): Promise<User> {
    const user: User = { ...entity, id: this.nextId++ };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: number, entity: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");
    const updated = { ...existing, ...entity };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
}

// Utility types
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
type UserWithoutId = Omit<User, "id">;
type UserIdAndName = Pick<User, "id" | "name">;

// Generics with constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Conditional types
type IsString<T> = T extends string ? true : false;
type Result = IsString<"hello">; // true
```

---

## JSX

```jsx
// React JSX component
import React, { useState, useEffect, useCallback } from 'react';

function UserProfile({ userId, onUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onUpdate(user);
  }, [user, onUpdate]);

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!user) return <div className="empty">No user found</div>;

  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p className="email">{user.email}</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={user.name} 
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />
        <button type="submit">Save</button>
      </form>
      {user.posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}

export default UserProfile;
```

---

## TSX

```tsx
// TypeScript React component
import React, { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';

interface Post {
  id: number;
  title: string;
  excerpt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  posts: Post[];
}

interface UserProfileProps {
  userId: number;
  onUpdate: (user: User) => Promise<void>;
  className?: string;
}

const UserProfile: FC<UserProfileProps> = ({ userId, onUpdate, className }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchUser(): Promise<void> {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const data: User = await response.json();
        setUser(data);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
    return () => controller.abort();
  }, [userId]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (user) {
      setUser({ ...user, name: e.target.value });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (user) {
      await onUpdate(user);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <EmptyState />;

  return (
    <div className={`user-profile ${className ?? ''}`}>
      <Avatar src={user.avatar} alt={user.name} size="large" />
      <h1>{user.name}</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={user.name} onChange={handleNameChange} />
        <Button type="submit" variant="primary">Save</Button>
      </form>
    </div>
  );
};

export default UserProfile;
```

---

## JSON

```json
{
  "name": "my-awesome-project",
  "version": "1.0.0",
  "description": "A comprehensive project configuration",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "config": {
    "port": 3000,
    "features": {
      "darkMode": true,
      "i18n": ["en", "es", "fr", "de"],
      "analytics": {
        "enabled": true,
        "provider": "mixpanel",
        "sampleRate": 0.1
      }
    }
  },
  "nested": {
    "deeply": {
      "nested": {
        "value": [1, 2, 3, null, true, false, "string"]
      }
    }
  }
}
```

---

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A sample HTML page for testing">
  <title>HTML Stress Test</title>
  <link rel="stylesheet" href="/styles/main.css">
  <script type="module" src="/scripts/app.js"></script>
  <style>
    body {
      font-family: system-ui, sans-serif;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <header class="site-header">
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="main-content">
    <article>
      <h1>Welcome to Our Site</h1>
      <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      
      <figure>
        <img src="/images/hero.jpg" alt="Hero image" loading="lazy">
        <figcaption>A beautiful hero image</figcaption>
      </figure>

      <form action="/submit" method="POST">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <button type="submit">Subscribe</button>
      </form>
    </article>
  </main>

  <footer>
    <p>&copy; 2024 My Company. All rights reserved.</p>
  </footer>
</body>
</html>
```

---

## CSS

```css
/* CSS with modern features */
:root {
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --color-text: #2c3e50;
  --spacing-unit: 8px;
  --font-family: system-ui, -apple-system, sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  color: var(--color-text);
  line-height: 1.6;
}

.container {
  width: min(90%, 1200px);
  margin-inline: auto;
  padding-block: calc(var(--spacing-unit) * 4);
}

/* Grid layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: calc(var(--spacing-unit) * 3);
}

/* Flexbox */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modern selectors */
.card:has(.featured) {
  border: 2px solid var(--color-primary);
}

.list > :not(:last-child) {
  margin-bottom: var(--spacing-unit);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Media queries */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #ecf0f1;
  }
  body {
    background-color: #1a1a2e;
  }
}

@media (min-width: 768px) {
  .container {
    padding-block: calc(var(--spacing-unit) * 8);
  }
}
```

---

## Markdown

```markdown
# Sample Markdown

This is **bold** and *italic* text.

## Lists

- Item 1
- Item 2
  - Nested item

1. First
2. Second

## Code

Inline `code` and block:

\`\`\`javascript
const x = 42;
\`\`\`

## Links and Images

[Link text](https://example.com)
![Alt text](image.png)

> Blockquote text

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

---

## Bash

```bash
#!/bin/bash

# Variables
PROJECT_NAME="my-project"
BUILD_DIR="./dist"
LOG_FILE="/var/log/${PROJECT_NAME}.log"

# Functions
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
  log "Cleaning up..."
  rm -rf "$BUILD_DIR"
}

build() {
  log "Building $PROJECT_NAME..."
  mkdir -p "$BUILD_DIR"
  
  # Loop through source files
  for file in src/*.ts; do
    if [[ -f "$file" ]]; then
      log "Compiling $file"
      tsc "$file" --outDir "$BUILD_DIR"
    fi
  done
}

# Trap for cleanup
trap cleanup EXIT

# Main execution
if [[ $# -eq 0 ]]; then
  echo "Usage: $0 [build|clean|deploy]"
  exit 1
fi

case "$1" in
  build)
    build
    ;;
  clean)
    cleanup
    ;;
  deploy)
    build && rsync -avz "$BUILD_DIR/" server:/app/
    ;;
  *)
    echo "Unknown command: $1"
    exit 1
    ;;
esac
```

---

## Shell

```shell
# Package installation
npm install react react-dom
yarn add typescript --dev
pnpm add vite

# Git operations
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:user/repo.git
git push -u origin main

# File operations
mkdir -p src/{components,hooks,utils}
touch src/index.ts
cp -r template/* .
mv old-name.ts new-name.ts

# Process management
ps aux | grep node
kill -9 $(lsof -t -i:3000)
nohup node server.js > output.log 2>&1 &

# Environment variables
export NODE_ENV=production
echo $PATH
source ~/.bashrc

# Pipes and redirects
cat file.txt | grep "pattern" | sort | uniq > output.txt
curl -s https://api.example.com/data 2>/dev/null | jq '.items[]'
```

---

## Python

```python
#!/usr/bin/env python3
"""
A comprehensive Python example demonstrating various language features.
"""

from typing import Optional, List, Dict, TypeVar, Generic
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from functools import lru_cache
import asyncio
import json


T = TypeVar('T')


@dataclass
class User:
    """Represents a user in the system."""
    id: int
    name: str
    email: str
    roles: List[str] = field(default_factory=list)
    metadata: Dict[str, any] = field(default_factory=dict)

    def has_role(self, role: str) -> bool:
        return role in self.roles


class Repository(ABC, Generic[T]):
    """Abstract base class for repositories."""
    
    @abstractmethod
    async def find_by_id(self, id: int) -> Optional[T]:
        pass
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        pass


class UserRepository(Repository[User]):
    def __init__(self):
        self._users: Dict[int, User] = {}
    
    async def find_by_id(self, id: int) -> Optional[User]:
        return self._users.get(id)
    
    async def save(self, user: User) -> User:
        self._users[user.id] = user
        return user


@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number with memoization."""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


async def fetch_users(urls: List[str]) -> List[dict]:
    """Fetch user data from multiple URLs concurrently."""
    async def fetch_one(url: str) -> dict:
        # Simulated async HTTP request
        await asyncio.sleep(0.1)
        return {"url": url, "data": "sample"}
    
    tasks = [fetch_one(url) for url in urls]
    return await asyncio.gather(*tasks)


# Context manager example
class DatabaseConnection:
    def __enter__(self):
        print("Opening connection")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Closing connection")
        return False


# Generator example
def generate_squares(n: int):
    for i in range(n):
        yield i ** 2


if __name__ == "__main__":
    # List comprehension
    squares = [x**2 for x in range(10)]
    
    # Dictionary comprehension
    square_dict = {x: x**2 for x in range(10)}
    
    # Lambda and filter
    evens = list(filter(lambda x: x % 2 == 0, range(20)))
    
    # Main async execution
    asyncio.run(fetch_users(["http://example.com/1", "http://example.com/2"]))
```

---

## Rust

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

/// A generic cache implementation with TTL support.
pub struct Cache<K, V> {
    data: Arc<Mutex<HashMap<K, CacheEntry<V>>>>,
    ttl_seconds: u64,
}

struct CacheEntry<V> {
    value: V,
    expires_at: std::time::Instant,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            data: Arc::new(Mutex::new(HashMap::new())),
            ttl_seconds,
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let data = self.data.lock().unwrap();
        data.get(key).and_then(|entry| {
            if entry.expires_at > std::time::Instant::now() {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    pub fn set(&self, key: K, value: V) {
        let mut data = self.data.lock().unwrap();
        let expires_at = std::time::Instant::now()
            + std::time::Duration::from_secs(self.ttl_seconds);
        data.insert(key, CacheEntry { value, expires_at });
    }
}

// Enum with pattern matching
#[derive(Debug)]
enum Message {
    Text(String),
    Number(i64),
    Data { id: u32, payload: Vec<u8> },
}

fn process_message(msg: Message) -> String {
    match msg {
        Message::Text(s) => format!("Text: {}", s),
        Message::Number(n) if n > 0 => format!("Positive: {}", n),
        Message::Number(n) => format!("Non-positive: {}", n),
        Message::Data { id, payload } => {
            format!("Data #{}: {} bytes", id, payload.len())
        }
    }
}

// Async example with tokio
async fn handle_connection(
    mut rx: mpsc::Receiver<Message>,
    tx: mpsc::Sender<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    while let Some(msg) = rx.recv().await {
        let response = process_message(msg);
        tx.send(response).await?;
    }
    Ok(())
}

#[tokio::main]
async fn main() {
    let cache: Cache<String, i32> = Cache::new(300);
    cache.set("key".to_string(), 42);
    
    if let Some(value) = cache.get(&"key".to_string()) {
        println!("Found: {}", value);
    }
}
```

---

## Go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// User represents a user in the system
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// UserRepository defines the interface for user storage
type UserRepository interface {
	FindByID(ctx context.Context, id int) (*User, error)
	Save(ctx context.Context, user *User) error
	FindAll(ctx context.Context) ([]*User, error)
}

// InMemoryUserRepository implements UserRepository
type InMemoryUserRepository struct {
	mu    sync.RWMutex
	users map[int]*User
}

func NewInMemoryUserRepository() *InMemoryUserRepository {
	return &InMemoryUserRepository{
		users: make(map[int]*User),
	}
}

func (r *InMemoryUserRepository) FindByID(ctx context.Context, id int) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	if user, ok := r.users[id]; ok {
		return user, nil
	}
	return nil, fmt.Errorf("user not found: %d", id)
}

func (r *InMemoryUserRepository) Save(ctx context.Context, user *User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.users[user.ID] = user
	return nil
}

// Worker pool pattern
func processItems(items []int, workers int) []int {
	jobs := make(chan int, len(items))
	results := make(chan int, len(items))
	
	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				results <- job * 2
			}
		}()
	}
	
	// Send jobs
	for _, item := range items {
		jobs <- item
	}
	close(jobs)
	
	// Wait and collect
	go func() {
		wg.Wait()
		close(results)
	}()
	
	var output []int
	for result := range results {
		output = append(output, result)
	}
	return output
}

func main() {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()
	
	user := &User{
		ID:        1,
		Name:      "John Doe",
		Email:     "john@example.com",
		CreatedAt: time.Now(),
	}
	
	if err := repo.Save(ctx, user); err != nil {
		log.Fatalf("failed to save user: %v", err)
	}
	
	// HTTP handler
	http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		users, _ := repo.FindAll(ctx)
		json.NewEncoder(w).Encode(users)
	})
	
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

---

## SQL

```sql
-- Database schema and queries

-- Create tables with constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE post_tags (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = TRUE;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Complex query with CTEs, joins, and aggregations
WITH active_authors AS (
    SELECT 
        u.id,
        u.name,
        COUNT(p.id) AS post_count
    FROM users u
    LEFT JOIN posts p ON p.user_id = u.id AND p.published = TRUE
    GROUP BY u.id, u.name
    HAVING COUNT(p.id) > 0
),
popular_tags AS (
    SELECT 
        t.id,
        t.name,
        COUNT(pt.post_id) AS usage_count
    FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    GROUP BY t.id, t.name
    ORDER BY usage_count DESC
    LIMIT 10
)
SELECT 
    aa.name AS author_name,
    aa.post_count,
    p.title,
    STRING_AGG(t.name, ', ') AS tags
FROM active_authors aa
JOIN posts p ON p.user_id = aa.id
LEFT JOIN post_tags pt ON pt.post_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
WHERE p.published = TRUE
GROUP BY aa.name, aa.post_count, p.id, p.title
ORDER BY aa.post_count DESC, p.created_at DESC;

-- Stored procedure
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## YAML

```yaml
# Kubernetes deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  labels:
    app: my-app
    version: v1.2.3
    environment: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      serviceAccountName: my-app-sa
      containers:
        - name: my-app
          image: registry.example.com/my-app:v1.2.3
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: database-url
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: my-app-config
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

---

## TOML

```toml
# Cargo.toml for a Rust project
[package]
name = "my-awesome-crate"
version = "0.1.0"
edition = "2021"
authors = ["Developer <dev@example.com>"]
description = "A comprehensive example crate"
license = "MIT OR Apache-2.0"
repository = "https://github.com/example/my-awesome-crate"
documentation = "https://docs.rs/my-awesome-crate"
keywords = ["example", "demo", "test"]
categories = ["development-tools"]

[lib]
name = "my_awesome_crate"
path = "src/lib.rs"

[[bin]]
name = "my-cli"
path = "src/bin/cli.rs"

[features]
default = ["std"]
std = []
async = ["tokio", "async-trait"]
full = ["std", "async", "serde"]

[dependencies]
serde = { version = "1.0", features = ["derive"], optional = true }
tokio = { version = "1.0", features = ["full"], optional = true }
async-trait = { version = "0.1", optional = true }
thiserror = "1.0"
tracing = "0.1"

[dev-dependencies]
criterion = "0.5"
proptest = "1.0"
tokio-test = "0.4"

[build-dependencies]
cc = "1.0"

[[bench]]
name = "benchmarks"
harness = false

[profile.release]
lto = true
codegen-units = 1
panic = "abort"
strip = true

[profile.dev]
opt-level = 0
debug = true

[workspace]
members = ["crates/*"]
resolver = "2"
```

---

## Inline Code Edge Cases

Here are some inline code edge cases:

- Simple: `const x = 1`
- With backticks: `` `backtick` ``
- Triple backticks: ``` `` ` `` ```
- HTML entities: `<div>&amp;&lt;&gt;</div>`
- Special chars: `!@#$%^&*()[]{}|;:'"<>?`
- Long inline: `this is a very long inline code block that should probably wrap at some point because it contains a lot of content that keeps going and going`

---

## Indented Code Block (4 spaces)

    function indented() {
      return "This is an indented code block";
    }
    
    const result = indented();
    console.log(result);

---

## Very Long Code Block

```typescript
// This is a very long code block to test scrolling and performance
// Line 1
// Line 2
// Line 3
// Line 4
// Line 5
// Line 6
// Line 7
// Line 8
// Line 9
// Line 10
interface VeryLongInterface {
  property1: string;
  property2: number;
  property3: boolean;
  property4: Date;
  property5: unknown;
  property6: never;
  property7: void;
  property8: null;
  property9: undefined;
  property10: symbol;
  property11: bigint;
  property12: object;
  property13: string[];
  property14: number[];
  property15: Map<string, number>;
  property16: Set<string>;
  property17: WeakMap<object, string>;
  property18: WeakSet<object>;
  property19: Promise<void>;
  property20: () => void;
}
// Line 33
// Line 34
// Line 35
class VeryLongClass implements VeryLongInterface {
  property1 = "";
  property2 = 0;
  property3 = false;
  property4 = new Date();
  property5: unknown = null;
  property6!: never;
  property7: void = undefined;
  property8 = null;
  property9 = undefined;
  property10 = Symbol("test");
  property11 = BigInt(9007199254740991);
  property12 = {};
  property13: string[] = [];
  property14: number[] = [];
  property15 = new Map<string, number>();
  property16 = new Set<string>();
  property17 = new WeakMap<object, string>();
  property18 = new WeakSet<object>();
  property19 = Promise.resolve();
  property20 = () => {};
  
  method1() { return this.property1; }
  method2() { return this.property2; }
  method3() { return this.property3; }
  method4() { return this.property4; }
  method5() { return this.property5; }
  method6() { return this.property6; }
  method7() { return this.property7; }
  method8() { return this.property8; }
  method9() { return this.property9; }
  method10() { return this.property10; }
  method11() { return this.property11; }
  method12() { return this.property12; }
  method13() { return this.property13; }
  method14() { return this.property14; }
  method15() { return this.property15; }
  method16() { return this.property16; }
  method17() { return this.property17; }
  method18() { return this.property18; }
  method19() { return this.property19; }
  method20() { return this.property20; }
}
// Line 85
// Line 86
// Line 87
// Line 88
// Line 89
// Line 90
// Line 91
// Line 92
// Line 93
// Line 94
// Line 95
// Line 96
// Line 97
// Line 98
// Line 99
// Line 100
// End of very long code block
```

---

[← Back to home](/)
