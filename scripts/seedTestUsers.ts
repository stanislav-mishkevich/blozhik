import * as db from '../server/db.js';
import bcrypt from 'bcryptjs';

const testUsers = [
  {
    username: 'techguru',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    password: 'password123',
    bio: 'Full-stack developer passionate about React, Node.js, and TypeScript. Building the future, one commit at a time. 🚀',
    avatarUrl: 'https://i.pravatar.cc/300?img=12',
  },
  {
    username: 'designqueen',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    password: 'password123',
    bio: 'UI/UX Designer | Creating beautiful and intuitive interfaces | Coffee addict ☕ | Based in San Francisco',
    avatarUrl: 'https://i.pravatar.cc/300?img=47',
  },
  {
    username: 'datascientist',
    name: 'Michael Roberts',
    email: 'michael.roberts@example.com',
    password: 'password123',
    bio: 'Data Scientist | ML Engineer | Python enthusiast | Making sense of data 📊 | PhD in Computer Science',
    avatarUrl: 'https://i.pravatar.cc/300?img=33',
  },
  {
    username: 'анна_иванова',
    name: 'Анна Иванова',
    email: 'anna.ivanova@example.com',
    password: 'password123',
    bio: 'Frontend разработчица из Москвы 🇷🇺 | React & Vue.js | Люблю чистый код и красивый UI | Путешествия и фотография 📸',
    avatarUrl: 'https://i.pravatar.cc/300?img=45',
  },
  {
    username: 'дмитрий_петров',
    name: 'Дмитрий Петров',
    email: 'dmitry.petrov@example.com',
    password: 'password123',
    bio: 'Backend developer | Go & Python | Системное программирование | Открытый код | Санкт-Петербург 🏛️',
    avatarUrl: 'https://i.pravatar.cc/300?img=52',
  },
];

const posts = [
  // Alex Johnson posts
  {
    username: 'techguru',
    posts: [
      {
        title: 'Getting Started with TypeScript in 2025',
        content: `# Getting Started with TypeScript in 2025

TypeScript has become the **de facto standard** for building modern web applications. Here's why you should use it:

## Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Scalability**: Perfect for large codebases

### Basic Example

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
\`\`\`

> TypeScript is JavaScript that scales

![TypeScript Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/512px-Typescript_logo_2020.svg.png)

**Pro tip**: Start with strict mode enabled!`,
        tags: ['typescript', 'javascript', 'programming', 'webdev'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      },
      {
        title: 'React Server Components: A Deep Dive',
        content: `# React Server Components: A Deep Dive

React Server Components (RSC) are revolutionizing how we build web applications.

## What are Server Components?

Server Components are a new type of component that runs *only* on the server.

### Key Benefits

1. **Zero Bundle Size**: No JavaScript sent to client
2. **Direct Database Access**: Query data directly
3. **Better Performance**: Faster initial load

\`\`\`jsx
// app/page.tsx
async function BlogPost({ id }) {
  const post = await db.posts.findById(id);
  return <article>{post.content}</article>;
}
\`\`\`

> The future of React is server-first

![React](https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800)`,
        tags: ['react', 'nextjs', 'webdev', 'javascript'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      },
      {
        title: 'Building RESTful APIs with Node.js',
        content: `# Building RESTful APIs with Node.js

Let's build a production-ready REST API!

## Project Setup

\`\`\`bash
npm init -y
npm install express typescript @types/express
\`\`\`

## Core Concepts

- **Routes**: Define endpoints
- **Middleware**: Handle requests
- **Controllers**: Business logic

### Example Route

\`\`\`typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
\`\`\`

**Best practices:**
- Use proper HTTP status codes
- Validate input data
- Handle errors gracefully

![API Development](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)`,
        tags: ['nodejs', 'api', 'backend', 'express'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      },
    ],
  },
  // Sarah Chen posts
  {
    username: 'designqueen',
    posts: [
      {
        title: 'UI Design Principles Every Developer Should Know',
        content: `# UI Design Principles Every Developer Should Know

Good design is not just about aesthetics - it's about **usability**.

## The 5 Core Principles

### 1. Consistency
Keep UI elements consistent throughout your app.

### 2. Hierarchy
Guide users' attention with *visual hierarchy*.

### 3. White Space
> Less is more - Steve Jobs

### 4. Feedback
Always provide visual feedback for user actions.

### 5. Accessibility
Design for **everyone**, including users with disabilities.

![Design Principles](https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800)

**Remember**: Good design is invisible!`,
        tags: ['design', 'ui', 'ux', 'webdesign'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      },
      {
        title: 'Color Theory for Developers',
        content: `# Color Theory for Developers

Understanding color can transform your applications.

## The Color Wheel

- **Primary Colors**: Red, Blue, Yellow
- **Secondary Colors**: Green, Orange, Purple
- **Tertiary Colors**: Mix of primary and secondary

### Color Schemes

1. **Monochromatic**: Shades of one color
2. **Complementary**: Opposite colors
3. **Analogous**: Adjacent colors

\`\`\`css
:root {
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --accent: #f59e0b;
}
\`\`\`

> Color is a power which directly influences the soul

![Color Palette](https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800)`,
        tags: ['design', 'colors', 'ui', 'css'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
      },
      {
        title: 'Figma Tips & Tricks for 2025',
        content: `# Figma Tips & Tricks for 2025

Become a Figma power user with these tips!

## Auto Layout Magic

Auto Layout is your **best friend** for responsive design.

### Keyboard Shortcuts

- **Shift + A**: Auto Layout
- **Cmd + D**: Duplicate
- **Cmd + G**: Group

## Component Variants

Create *flexible* components with variants:

1. Create base component
2. Add variant properties
3. Define states (hover, active, disabled)

![Figma Design](https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800)

> Design is not just what it looks like. Design is how it works.`,
        tags: ['figma', 'design', 'tools', 'ui'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800',
      },
      {
        title: 'Mobile-First Design Philosophy',
        content: `# Mobile-First Design Philosophy

Design for mobile, then scale up!

## Why Mobile-First?

- **Performance**: Better optimization
- **User Experience**: Most users are on mobile
- **SEO**: Google prioritizes mobile

### Responsive Breakpoints

\`\`\`css
/* Mobile first */
.container { width: 100%; }

/* Tablet */
@media (min-width: 768px) {
  .container { width: 720px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { width: 960px; }
}
\`\`\`

**Remember**: *Touch targets* should be at least 44x44px!

![Mobile Design](https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800)`,
        tags: ['mobile', 'responsive', 'design', 'css'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      },
    ],
  },
  // Michael Roberts posts
  {
    username: 'datascientist',
    posts: [
      {
        title: 'Introduction to Machine Learning with Python',
        content: `# Introduction to Machine Learning with Python

Let's dive into the world of ML!

## What is Machine Learning?

Machine Learning is the science of getting computers to learn **without being explicitly programmed**.

### Types of ML

1. **Supervised Learning**: Labeled data
2. **Unsupervised Learning**: Unlabeled data
3. **Reinforcement Learning**: Learning through rewards

## Simple Example

\`\`\`python
from sklearn.linear_model import LinearRegression

# Create model
model = LinearRegression()

# Train
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)
\`\`\`

> Data is the new oil

![Machine Learning](https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800)`,
        tags: ['python', 'machinelearning', 'ai', 'datascience'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
      },
      {
        title: 'Data Visualization Best Practices',
        content: `# Data Visualization Best Practices

Make your data *speak* to your audience!

## Choosing the Right Chart

- **Line Chart**: Trends over time
- **Bar Chart**: Comparisons
- **Scatter Plot**: Relationships
- **Pie Chart**: Proportions (use sparingly!)

### Python Example

\`\`\`python
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style("whitegrid")
plt.figure(figsize=(10, 6))
sns.lineplot(data=df, x='date', y='value')
plt.title('Sales Over Time')
plt.show()
\`\`\`

> A picture is worth a thousand words

![Data Viz](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)`,
        tags: ['dataviz', 'python', 'analytics', 'datascience'],
        categoryId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      },
      {
        title: 'Deep Learning with TensorFlow 2.0',
        content: `# Deep Learning with TensorFlow 2.0

Neural networks are **changing the world**!

## Building Your First Neural Network

\`\`\`python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(X_train, y_train, epochs=10)
\`\`\`

### Key Concepts

- **Layers**: Building blocks
- **Activation Functions**: Non-linearity
- **Loss Functions**: Measure error

![Neural Network](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800)`,
        tags: ['deeplearning', 'tensorflow', 'ai', 'python'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      },
      {
        title: 'SQL for Data Scientists',
        content: `# SQL for Data Scientists

Master SQL for powerful data analysis!

## Essential Queries

### Aggregation

\`\`\`sql
SELECT 
    category,
    COUNT(*) as total,
    AVG(price) as avg_price,
    MAX(price) as max_price
FROM products
GROUP BY category
HAVING COUNT(*) > 10;
\`\`\`

### Window Functions

\`\`\`sql
SELECT 
    name,
    salary,
    RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;
\`\`\`

> SQL is the lingua franca of data

![Database](https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800)`,
        tags: ['sql', 'database', 'datascience', 'analytics'],
        categoryId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      },
      {
        title: 'Natural Language Processing Basics',
        content: `# Natural Language Processing Basics

Teaching computers to understand *human language*!

## NLP Pipeline

1. **Tokenization**: Split text into words
2. **Cleaning**: Remove stopwords
3. **Vectorization**: Convert to numbers
4. **Modeling**: Train ML model

### Example Code

\`\`\`python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

# Vectorize text
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

# Train classifier
clf = MultinomialNB()
clf.fit(X, labels)
\`\`\`

![NLP](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800)`,
        tags: ['nlp', 'ai', 'python', 'machinelearning'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
      },
    ],
  },
  // Анна Иванова posts
  {
    username: 'анна_иванова',
    posts: [
      {
        title: 'Vue 3 Composition API: полное руководство',
        content: `# Vue 3 Composition API: полное руководство

**Composition API** - это новый способ организации логики в Vue 3.

## Почему Composition API?

- Лучшая организация кода
- Переиспользование логики
- Лучшая типизация с TypeScript

### Пример компонента

\`\`\`javascript
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const double = computed(() => count.value * 2);
    
    onMounted(() => {
      console.log('Компонент смонтирован!');
    });
    
    return { count, double };
  }
}
\`\`\`

> Vue 3 делает разработку проще и приятнее!

![Vue.js](https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800)`,
        tags: ['vue', 'javascript', 'frontend', 'разработка'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      },
      {
        title: 'CSS Grid: современная верстка',
        content: `# CSS Grid: современная верстка

Grid - это *мощный* инструмент для создания сложных макетов.

## Основы Grid

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  grid-column: span 2;
}
\`\`\`

### Практический пример

1. **Создаем сетку**: define grid container
2. **Размещаем элементы**: позиционируем по ячейкам
3. **Адаптивность**: используем media queries

**Совет**: Комбинируйте Grid с Flexbox для максимальной гибкости!

![CSS Grid](https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800)`,
        tags: ['css', 'grid', 'верстка', 'frontend'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800',
      },
      {
        title: 'Анимации в Web: от простого к сложному',
        content: `# Анимации в Web: от простого к сложному

Анимации оживляют ваш сайт!

## CSS Transitions

\`\`\`css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  transform: scale(1.1);
  background: #3b82f6;
}
\`\`\`

## CSS Animations

\`\`\`css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.element {
  animation: fadeIn 1s ease-in;
}
\`\`\`

> Хорошая анимация - незаметная анимация

### JavaScript анимации

Для сложных анимаций используйте **GSAP** или **Framer Motion**.

![Animation](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800)`,
        tags: ['анимация', 'css', 'javascript', 'frontend'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      },
      {
        title: 'Tailwind CSS: утилитарный подход',
        content: `# Tailwind CSS: утилитарный подход

Tailwind изменил мой подход к стилизации!

## Преимущества Tailwind

- **Быстрая разработка**: пишите стили прямо в HTML
- **Консистентность**: единая система дизайна
- **Оптимизация**: PurgeCSS удаляет неиспользуемые стили

### Пример

\`\`\`html
<div class="flex items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
  <div class="bg-white rounded-lg shadow-xl p-8 max-w-md">
    <h1 class="text-3xl font-bold text-gray-800 mb-4">
      Привет, мир!
    </h1>
    <p class="text-gray-600">
      Tailwind делает верстку простой и приятной.
    </p>
  </div>
</div>
\`\`\`

**Совет**: Используйте компоненты для переиспользования!

![Tailwind](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800)`,
        tags: ['tailwind', 'css', 'frontend', 'webdev'],
        categoryId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      },
    ],
  },
  // Дмитрий Петров posts
  {
    username: 'дмитрий_петров',
    posts: [
      {
        title: 'Golang для начинающих: первые шаги',
        content: `# Golang для начинающих: первые шаги

Go - это **простой**, быстрый и надежный язык!

## Почему Go?

- Быстрая компиляция
- Встроенная конкурентность (goroutines)
- Простой синтаксис
- Отличная стандартная библиотека

### Hello World

\`\`\`go
package main

import "fmt"

func main() {
    fmt.Println("Привет, мир!")
}
\`\`\`

### Горутины

\`\`\`go
go func() {
    fmt.Println("Выполняется асинхронно!")
}()
\`\`\`

> Простота - это сложность, доведенная до совершенства

![Golang](https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=800)`,
        tags: ['golang', 'programming', 'backend', 'go'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=800',
      },
      {
        title: 'Микросервисы на Go: архитектура',
        content: `# Микросервисы на Go: архитектура

Создаем масштабируемую систему!

## Принципы микросервисов

1. **Независимость**: каждый сервис - отдельное приложение
2. **API Gateway**: единая точка входа
3. **Service Discovery**: автоматическое обнаружение сервисов
4. **Circuit Breaker**: защита от каскадных сбоев

### Пример сервиса

\`\`\`go
type UserService struct {
    db *sql.DB
}

func (s *UserService) GetUser(id int) (*User, error) {
    var user User
    err := s.db.QueryRow(
        "SELECT * FROM users WHERE id = ?", id,
    ).Scan(&user.ID, &user.Name, &user.Email)
    return &user, err
}
\`\`\`

**Важно**: Используйте *Docker* и *Kubernetes* для оркестрации!

![Microservices](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800)`,
        tags: ['микросервисы', 'golang', 'architecture', 'backend'],
        categoryId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      },
      {
        title: 'Docker: контейнеризация приложений',
        content: `# Docker: контейнеризация приложений

Docker упрощает развертывание приложений!

## Dockerfile

\`\`\`dockerfile
FROM golang:1.21-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main .

EXPOSE 8080

CMD ["./main"]
\`\`\`

## Docker Compose

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
\`\`\`

> Работает на моей машине? Теперь работает везде!

![Docker](https://images.unsplash.com/photo-1605745341075-1a2b2b6aa0e3?w=800)`,
        tags: ['docker', 'devops', 'containers', 'deployment'],
        categoryId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1605745341075-1a2b2b6aa0e3?w=800',
      },
      {
        title: 'Оптимизация производительности баз данных',
        content: `# Оптимизация производительности баз данных

Делаем запросы **быстрыми**!

## Основные техники

### 1. Индексы

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_published ON posts(user_id, published);
\`\`\`

### 2. Денормализация

Иногда дублирование данных оправдано для скорости.

### 3. Кэширование

\`\`\`go
// Redis кэш
func GetUser(id int) (*User, error) {
    // Проверяем кэш
    cached, err := redis.Get(fmt.Sprintf("user:%d", id))
    if err == nil {
        return cached, nil
    }
    
    // Запрос к БД
    user := db.FindUser(id)
    redis.Set(fmt.Sprintf("user:%d", id), user, 10*time.Minute)
    return user, nil
}
\`\`\`

**Правило**: Измеряйте, затем оптимизируйте!

![Database](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)`,
        tags: ['database', 'optimization', 'postgresql', 'performance'],
        categoryId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      },
      {
        title: 'CI/CD: автоматизация развертывания',
        content: `# CI/CD: автоматизация развертывания

Автоматизируйте всё, что можно!

## GitHub Actions

\`\`\`yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build
        run: go build -o app
      
      - name: Test
        run: go test ./...
      
      - name: Deploy
        run: ./deploy.sh
\`\`\`

## Этапы CI/CD

1. **Commit**: отправка кода
2. **Build**: сборка приложения
3. **Test**: запуск тестов
4. **Deploy**: развертывание

> Автоматизация - ключ к продуктивности

![CI/CD](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800)`,
        tags: ['cicd', 'devops', 'automation', 'github'],
        categoryId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800',
      },
    ],
  },
];

async function seedTestUsers() {
  console.log('🌱 Starting to seed test users...');

  try {
    // Create users
    const userIds: Record<string, number> = {};
    
    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.username}`);
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      await db.upsertUser({
        openId: `local-${userData.username}`,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        passwordHash,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        loginMethod: 'local',
        role: 'user',
      });
      
      const user = await db.getUserByUsername(userData.username);
      if (user) {
        userIds[userData.username] = user.id;
        console.log(`✅ Created user: ${userData.username} (ID: ${user.id})`);
      }
    }

    // Create posts
    let totalPosts = 0;
    for (const userPosts of posts) {
      const userId = userIds[userPosts.username];
      console.log(`\nCreating posts for ${userPosts.username}...`);
      
      for (const postData of userPosts.posts) {
        const postId = await db.createPost({
          userId,
          title: postData.title,
          content: postData.content,
          contentType: 'markdown',
          categoryId: postData.categoryId ?? null,
          published: 1, // Integer for SQLite
        });

        // Add tags
        if (postData.tags && postData.tags.length > 0) {
          try {
            const tagIds = await db.getOrCreateTags(postData.tags);
            await db.addTagsToPost(postId, tagIds);
          } catch (tagError) {
            // Tags might already exist, skip
            console.log(`    ⚠️  Tags already exist for this post, skipping...`);
          }
        }

        totalPosts++;
        console.log(`  ✅ Created post: "${postData.title}"`);
      }
    }

    // Create likes (users like each other's posts)
    console.log('\n❤️ Creating likes...');
    const allUsers = Object.values(userIds);
    let totalLikes = 0;

    for (const userId of allUsers) {
      // Get all posts from other users
      const result = await db.getPublishedPosts({ limit: 100, offset: 0 });
      const postsToLike = (result?.posts || [])
        .filter(p => p.userId !== userId)
        .slice(0, 10); // Like up to 10 posts

      for (const post of postsToLike) {
        try {
          await db.likePost(post.id, userId);
          totalLikes++;
        } catch (err) {
          // Post might already be liked
        }
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${testUsers.length}`);
    console.log(`   - Posts created: ${totalPosts}`);
    console.log(`   - Likes created: ${totalLikes}`);
    console.log(`\n🔐 Login credentials (all passwords: password123):`);
    testUsers.forEach(u => {
      console.log(`   - ${u.email} / password123`);
    });

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}

// Run the seeder
seedTestUsers()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { seedTestUsers };
