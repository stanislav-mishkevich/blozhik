import { getDb } from '../server/db';
import { users, posts, comments, likes, tags, postTags } from '../drizzle/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const USERS_DATA = [
  {
    username: 'alex_tech',
    email: 'alex@example.com',
    name: 'Alex Thompson',
    bio: 'Software engineer passionate about web development and open source. Love coding in TypeScript!',
    password: 'User123!',
  },
  {
    username: 'maria_design',
    email: 'maria@example.com',
    name: 'Maria Garcia',
    bio: 'UI/UX Designer | Creating beautiful and intuitive interfaces | Coffee addict ☕',
    password: 'User123!',
  },
  {
    username: 'john_writes',
    email: 'john@example.com',
    name: 'John Smith',
    bio: 'Tech writer and blogger. Explaining complex topics in simple words.',
    password: 'User123!',
  },
  {
    username: 'sara_data',
    email: 'sara@example.com',
    name: 'Sara Chen',
    bio: 'Data scientist exploring AI and machine learning. Python enthusiast 🐍',
    password: 'User123!',
  },
  {
    username: 'mike_devops',
    email: 'mike@example.com',
    name: 'Mike Johnson',
    bio: 'DevOps engineer | Kubernetes | Docker | CI/CD pipelines | Cloud infrastructure',
    password: 'User123!',
  },
];

const POSTS_DATA = [
  // Alex's posts
  {
    username: 'alex_tech',
    posts: [
      {
        title: 'Building a Type-Safe API with tRPC',
        content: `# Why tRPC is a Game Changer

If you're building a TypeScript full-stack application, you need to check out tRPC. It's an amazing library that gives you end-to-end type safety without code generation.

## What makes tRPC special?

- **No code generation**: Unlike GraphQL, you don't need to run any build steps
- **Type inference**: Your frontend automatically knows what your backend returns
- **Small bundle size**: Only ~10kb minified
- **Easy integration**: Works great with Next.js, Express, and more

## Quick Example

\`\`\`typescript
const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return db.users.findById(input.id);
    }),
});
\`\`\`

The types flow automatically from backend to frontend. No more runtime errors from API changes!

## Conclusion

If you're using TypeScript, tRPC should be in your toolkit. It's made my development so much faster and safer.`,
        tags: ['typescript', 'trpc', 'webdev', 'api'],
      },
      {
        title: 'My Favorite VS Code Extensions for 2025',
        content: `# VS Code Extensions That Boost My Productivity

After years of coding, these are the extensions I can't live without:

## 1. GitHub Copilot
AI-powered code completion that actually understands context. It's like having a pair programming partner.

## 2. Error Lens
Shows errors inline in your code. No more hunting through the problems panel!

## 3. Pretty TypeScript Errors
Makes TypeScript errors human-readable. This one is a lifesaver for complex types.

## 4. Thunder Client
Lightweight REST client built into VS Code. No need for Postman anymore.

## 5. GitLens
Deep Git integration. See who wrote what line and when, all inline.

What are your must-have extensions? Drop them in the comments!`,
        tags: ['vscode', 'productivity', 'tools', 'development'],
      },
      {
        title: 'Understanding React 19 Server Components',
        content: `# React Server Components Explained

React 19 brought Server Components to the stable release, and they're changing how we build React apps.

## What are Server Components?

They're React components that run only on the server. They can:
- Access databases directly
- Read from the filesystem
- Use server-only libraries
- Never send JavaScript to the client

## Example

\`\`\`jsx
// This runs on the server!
async function BlogPost({ id }) {
  const post = await db.posts.findById(id);
  return <article>{post.content}</article>;
}
\`\`\`

## Benefits

1. **Smaller bundles**: Server-only code doesn't ship to the client
2. **Better performance**: No waterfalls, data fetches on the server
3. **Security**: Keep API keys and secrets on the server

React 19 is a huge step forward for web development!`,
        tags: ['react', 'javascript', 'servercomponents', 'react19'],
      },
    ],
  },
  // Maria's posts
  {
    username: 'maria_design',
    posts: [
      {
        title: 'Color Theory for Developers',
        content: `# Understanding Color Theory

As a designer working with developers, I've noticed many struggle with choosing colors. Here's a practical guide!

## The Color Wheel

The color wheel helps you create harmonious color schemes:

- **Complementary**: Colors opposite each other (blue/orange)
- **Analogous**: Colors next to each other (blue/green/cyan)
- **Triadic**: Three colors evenly spaced (red/yellow/blue)

## Practical Tips

1. Start with one main color
2. Use 60-30-10 rule (60% primary, 30% secondary, 10% accent)
3. Consider accessibility - check contrast ratios
4. Use tools like Coolors or Adobe Color

## For Dark Mode

- Don't just invert colors!
- Use slightly desaturated colors
- Lower contrast for backgrounds
- Test in real lighting conditions

Color is powerful. Use it wisely! 🎨`,
        tags: ['design', 'colortheory', 'ui', 'webdesign'],
      },
      {
        title: 'Designing Better Forms: UX Best Practices',
        content: `# Form Design That Doesn't Suck

Forms are everywhere, but most are terrible. Here's how to make them better:

## Clear Labels

- Always label your inputs
- Labels above fields, not inside
- Keep labels short and clear

## Input Validation

- Validate as users type
- Show helpful error messages
- Use green checkmarks for valid inputs
- Don't validate on blur for short fields

## Mobile First

- Large touch targets (min 44x44px)
- Use the right keyboard type
- One column layout
- Group related fields

## Progressive Disclosure

Don't show everything at once:
1. Start with essential fields
2. Use steps for long forms
3. Save progress automatically
4. Show completion percentage

## Accessibility

- Proper ARIA labels
- Keyboard navigation
- Error announcements
- Clear focus indicators

Good forms = happy users = more conversions!`,
        tags: ['ux', 'forms', 'design', 'accessibility'],
      },
      {
        title: 'Figma Tips for Developers',
        content: `# Figma Tricks Every Developer Should Know

Working with Figma designs? These tips will make your life easier:

## Inspect Mode

Press Shift+I to enter inspect mode. You'll see:
- Exact CSS properties
- Measurements and spacing
- Color values in your preferred format
- Font specifications

## Dev Mode (Pro Feature)

Figma's Dev Mode is amazing:
- Compare designs to production
- See Git branch info
- Get code snippets
- Track implementation status

## Keyboard Shortcuts

- **Z**: Zoom to fit
- **Shift+2**: Zoom to selection
- **Alt+drag**: Measure distance
- **Cmd/Ctrl+G**: Group selection

## Export Settings

- Use SVG for icons
- PNG for photos/complex graphics
- Export @2x and @3x for mobile
- Use constraints for responsive designs

## Component Properties

Understand how components work in Figma to better implement them in code. Variants = props!

Bridge the designer-developer gap! 🌉`,
        tags: ['figma', 'design', 'tools', 'workflow'],
      },
      {
        title: 'The Psychology of Micro-interactions',
        content: `# Why Small Details Matter

Micro-interactions are the tiny moments that make or break user experience.

## What Are Micro-interactions?

Those small animations and feedback moments:
- Button hover states
- Loading spinners
- Success checkmarks
- Pull-to-refresh
- Like button animations

## The Four Parts

1. **Trigger**: What initiates it
2. **Rules**: What happens
3. **Feedback**: What the user sees
4. **Loops/Modes**: How it repeats or changes

## Best Practices

- Keep them subtle (100-300ms duration)
- Match your brand personality
- Don't overdo it
- Consider reduced motion preferences
- Test on real devices

## Examples That Work

- Stripe's payment success animation
- Twitter's heart animation
- iOS's satisfying toggle switches
- Slack's loading messages

Details create delight! ✨`,
        tags: ['ux', 'microinteractions', 'animation', 'design'],
      },
    ],
  },
  // John's posts
  {
    username: 'john_writes',
    posts: [
      {
        title: 'How to Write Technical Documentation That People Actually Read',
        content: `# Documentation That Doesn't Suck

I've been writing tech docs for 8 years. Here's what I've learned:

## Start With Why

Don't jump into how. Explain:
- What problem does this solve?
- Who is this for?
- What will you learn?

## Structure Matters

Good docs follow this pattern:
1. Quick start (get running in 5 minutes)
2. Core concepts
3. API reference
4. Advanced topics
5. Troubleshooting

## Write for Scanning

- Use headings liberally
- Bold important terms
- Keep paragraphs short (3-4 lines max)
- Add code examples
- Include visual aids

## Code Examples

\`\`\`typescript
// Bad: No context
auth.login(user);

// Good: Full example with context
const user = { email: 'user@example.com', password: 'secret' };
const result = await auth.login(user);
if (result.success) {
  console.log('Logged in!');
}
\`\`\`

## Maintain It

Dead docs are worse than no docs:
- Review quarterly
- Accept pull requests
- Add changelog
- Version your docs

Great documentation is a product feature!`,
        tags: ['documentation', 'writing', 'technical-writing'],
      },
      {
        title: 'Markdown: The Only Formatting Language You Need',
        content: `# Why Markdown Wins

Markdown is simple, portable, and everywhere. Here's why it's perfect:

## Easy to Learn

Learn the basics in 5 minutes:

\`\`\`markdown
# Heading 1
## Heading 2

**bold** and *italic*

- bullet points
1. numbered lists

[links](https://example.com)
![images](image.jpg)
\`\`\`

## Plain Text = Future Proof

- No proprietary formats
- Works in any text editor
- Git-friendly
- Easy to search
- Converts to HTML, PDF, etc.

## Where to Use It

- README files
- Blog posts
- Notes
- Documentation
- Comments on GitHub
- This very post!

## Advanced Features

With extensions, you get:
- Tables
- Footnotes
- Task lists
- Math equations
- Diagrams (Mermaid)

## Tools I Use

- **Obsidian**: For notes
- **Typora**: For writing
- **mdBook**: For docs
- **GitHub**: For README files

Keep it simple, use Markdown! 📝`,
        tags: ['markdown', 'writing', 'tools', 'productivity'],
      },
      {
        title: 'The Art of Code Reviews',
        content: `# How to Review Code Like a Pro

Code reviews are crucial but often done poorly. Here's my framework:

## Before You Start

- Understand the context
- Read the PR description
- Check the issue/ticket
- Look at the CI results

## What to Look For

### Architecture & Design
- Does it fit the existing patterns?
- Is it over-engineered?
- Could it be simpler?

### Code Quality
- Readable variable names
- Small, focused functions
- Proper error handling
- Edge cases covered

### Tests
- Do tests exist?
- Do they test the right things?
- Are they maintainable?

## How to Comment

**Bad**: "This is wrong"
**Good**: "Consider using a Map here instead of an Object for better performance with frequent lookups"

**Bad**: "Why did you do it this way?"
**Good**: "I'm curious about this approach - could you explain the reasoning?"

## The Human Side

- Approve good work quickly
- Assume good intent
- Ask questions, don't demand
- Praise good solutions
- Review promptly (same day)

## When to Approve

Not when it's perfect, but when:
- It solves the problem
- It's maintainable
- Tests pass
- No major issues

Perfect is the enemy of shipped! ✅`,
        tags: ['codereview', 'bestpractices', 'development', 'teamwork'],
      },
    ],
  },
  // Sara's posts
  {
    username: 'sara_data',
    posts: [
      {
        title: 'Machine Learning Basics for Web Developers',
        content: `# ML 101 for Web Devs

You don't need a PhD to use machine learning. Here's what you need to know:

## What is Machine Learning?

Teaching computers to learn from data instead of explicit programming.

## Types of ML

**Supervised Learning**: You have labeled data
- Classification (spam/not spam)
- Regression (predict prices)

**Unsupervised Learning**: No labels
- Clustering (group similar items)
- Dimensionality reduction

**Reinforcement Learning**: Learn from rewards
- Game AI
- Robotics

## Getting Started with Python

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y)

# Train model
model = LogisticRegression()
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)
\`\`\`

## Tools for Web Developers

- **TensorFlow.js**: ML in the browser
- **Hugging Face**: Pre-trained models
- **OpenAI API**: GPT models
- **Replicate**: Easy API for models

## Practical Applications

- Sentiment analysis on comments
- Image classification
- Recommendation systems
- Chatbots
- Anomaly detection

Start small, learn as you go! 🤖`,
        tags: ['machinelearning', 'python', 'ai', 'datascience'],
      },
      {
        title: 'Data Visualization with Python: A Quick Guide',
        content: `# Making Data Beautiful

Good visualizations tell stories. Here's how to create them:

## Choosing the Right Chart

- **Line**: Trends over time
- **Bar**: Compare categories
- **Scatter**: Relationships
- **Pie**: Parts of a whole (use sparingly!)
- **Heatmap**: Patterns in matrices

## My Favorite Libraries

### Matplotlib (The Classic)
\`\`\`python
import matplotlib.pyplot as plt

plt.plot(x, y)
plt.title('My Chart')
plt.xlabel('X Axis')
plt.ylabel('Y Axis')
plt.show()
\`\`\`

### Seaborn (Beautiful Defaults)
\`\`\`python
import seaborn as sns

sns.lineplot(data=df, x='date', y='value')
\`\`\`

### Plotly (Interactive)
Best for web dashboards!

## Design Principles

1. Remove chartjunk
2. Use color purposefully
3. Label directly on chart
4. Start y-axis at zero (usually)
5. Order data logically

## Colorblind Friendly

Use palettes that work for everyone:
- Avoid red/green only distinctions
- Use patterns + colors
- Test with simulators

## For the Web

- D3.js for custom interactivity
- Chart.js for simple charts
- Plotly for dashboards
- Observable for exploration

Make your data speak! 📊`,
        tags: ['datavisualization', 'python', 'matplotlib', 'analytics'],
      },
      {
        title: 'SQL Tips Every Developer Should Know',
        content: `# SQL Tricks That Will Save You Time

After years of writing queries, these are my go-to patterns:

## Window Functions

Game changers for analytics:

\`\`\`sql
-- Running total
SELECT 
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) as running_total
FROM sales;

-- Rank within groups
SELECT
  category,
  product,
  sales,
  RANK() OVER (PARTITION BY category ORDER BY sales DESC) as rank
FROM products;
\`\`\`

## CTEs for Readability

\`\`\`sql
WITH active_users AS (
  SELECT user_id
  FROM logins
  WHERE login_date > NOW() - INTERVAL '30 days'
)
SELECT u.name, u.email
FROM users u
JOIN active_users au ON u.id = au.user_id;
\`\`\`

## JSON Functions (PostgreSQL)

\`\`\`sql
-- Query JSON columns
SELECT 
  data->>'name' as name,
  data->'address'->>'city' as city
FROM users;
\`\`\`

## Performance Tips

1. Index frequently queried columns
2. Use EXPLAIN to analyze queries
3. Avoid SELECT *
4. Use LIMIT for exploration
5. Batch inserts for bulk data

## Date Math

\`\`\`sql
-- PostgreSQL
SELECT NOW() - INTERVAL '7 days';

-- MySQL
SELECT DATE_SUB(NOW(), INTERVAL 7 DAY);
\`\`\`

## Debugging

- Start simple, add complexity
- Test each join separately
- Use smaller datasets first
- Print intermediate results

Master SQL, master data! 💾`,
        tags: ['sql', 'database', 'postgresql', 'queries'],
      },
      {
        title: 'Building a Real-Time Analytics Dashboard',
        content: `# Real-Time Analytics with WebSockets

I built a live dashboard for monitoring user activity. Here's what I learned:

## The Stack

- **Backend**: Node.js + WebSocket
- **Database**: PostgreSQL + Redis
- **Frontend**: React + Chart.js
- **Deployment**: Docker

## Architecture

\`\`\`
Users → API → Redis (queue) → Worker → PostgreSQL
                    ↓
              WebSocket Server → Frontend
\`\`\`

## Why Redis?

- Fast in-memory storage
- Pub/Sub for real-time updates
- Sorted sets for leaderboards
- TTL for temporary data

## WebSocket Implementation

\`\`\`javascript
// Server
io.on('connection', (socket) => {
  socket.on('subscribe', (channel) => {
    socket.join(channel);
  });
});

// Emit updates
io.to('analytics').emit('update', data);
\`\`\`

## Handling Scale

- Aggregate data (don't send raw events)
- Throttle updates (max 1/second)
- Use delta updates, not full snapshots
- Implement reconnection logic

## Monitoring

Track these metrics:
- Active connections
- Message throughput
- Latency
- Error rates

## Performance

- Keep payloads small (<1KB)
- Compress data (gzip)
- Use binary formats for large data
- Implement backpressure

Real-time data is addictive to build! ⚡`,
        tags: ['websockets', 'realtime', 'analytics', 'nodejs'],
      },
      {
        title: 'Introduction to Pandas for Data Analysis',
        content: `# Pandas: Your Data Swiss Army Knife

Pandas makes data manipulation in Python easy and powerful.

## Reading Data

\`\`\`python
import pandas as pd

# From CSV
df = pd.read_csv('data.csv')

# From JSON
df = pd.read_json('data.json')

# From SQL
df = pd.read_sql('SELECT * FROM users', conn)
\`\`\`

## Basic Operations

\`\`\`python
# View data
df.head()
df.info()
df.describe()

# Filter rows
active_users = df[df['status'] == 'active']

# Select columns
df[['name', 'email']]

# Sort
df.sort_values('age', ascending=False)
\`\`\`

## Grouping and Aggregation

\`\`\`python
# Group by category
df.groupby('category')['sales'].sum()

# Multiple aggregations
df.groupby('category').agg({
    'sales': ['sum', 'mean'],
    'quantity': 'count'
})
\`\`\`

## Handling Missing Data

\`\`\`python
# Drop missing
df.dropna()

# Fill missing
df.fillna(0)
df['age'].fillna(df['age'].mean())
\`\`\`

## DateTime Operations

\`\`\`python
df['date'] = pd.to_datetime(df['date'])
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
\`\`\`

## Merging DataFrames

\`\`\`python
# Like SQL JOIN
merged = pd.merge(df1, df2, on='user_id', how='left')
\`\`\`

## Export Results

\`\`\`python
df.to_csv('output.csv', index=False)
df.to_excel('output.xlsx')
df.to_json('output.json')
\`\`\`

Pandas = SQL + Excel in Python! 🐼`,
        tags: ['pandas', 'python', 'dataanalysis', 'datascience'],
      },
    ],
  },
  // Mike's posts
  {
    username: 'mike_devops',
    posts: [
      {
        title: 'Docker Best Practices for Production',
        content: `# Docker in Production: Lessons Learned

After deploying hundreds of containers, here's what actually matters:

## Dockerfile Optimization

\`\`\`dockerfile
# Use specific versions
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files first (caching!)
COPY package*.json ./
RUN npm ci --only=production

# Then copy app
COPY --chown=nextjs:nodejs . .

# Switch to non-root
USER nextjs

# Use exec form for signals
CMD ["node", "server.js"]
\`\`\`

## Multi-Stage Builds

\`\`\`dockerfile
# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
\`\`\`

## Image Size Matters

- Use Alpine base images
- Multi-stage builds
- .dockerignore file
- Clean up in same RUN layer

## Security

1. Run as non-root user
2. Scan images (docker scan)
3. Use official base images
4. Keep images updated
5. Minimal attack surface

## Health Checks

\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
\`\`\`

## Don't Store Secrets

- Use environment variables
- Or secret managers
- Never in the image!

Ship it! 🚢`,
        tags: ['docker', 'devops', 'containers', 'bestpractices'],
      },
      {
        title: 'Kubernetes for Beginners: What You Need to Know',
        content: `# K8s 101: Container Orchestration Made Simple

Kubernetes seems scary but the concepts are straightforward.

## What Problems Does K8s Solve?

- Auto-scaling
- Self-healing
- Load balancing
- Rolling updates
- Service discovery

## Core Concepts

### Pods
Smallest unit - one or more containers that share network/storage

### Deployments
Manages pods - handles replicas, updates, rollbacks

### Services
Stable endpoint to access pods (they come and go)

### ConfigMaps & Secrets
Configuration and sensitive data

## Basic Deployment

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.0
        ports:
        - containerPort: 3000
\`\`\`

## Service Definition

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
\`\`\`

## Essential kubectl Commands

\`\`\`bash
# Get resources
kubectl get pods
kubectl get deployments
kubectl get services

# Logs
kubectl logs pod-name

# Describe
kubectl describe pod pod-name

# Apply config
kubectl apply -f deployment.yaml

# Delete
kubectl delete pod pod-name
\`\`\`

## Local Development

- **minikube**: Full K8s locally
- **k3s**: Lightweight K8s
- **kind**: K8s in Docker

## When to Use K8s?

✅ Multiple microservices
✅ Need auto-scaling
✅ High availability required
✅ Complex deployment patterns

❌ Simple single app
❌ Just starting out
❌ Small team

Start simple, scale when needed! ☸️`,
        tags: ['kubernetes', 'k8s', 'devops', 'orchestration'],
      },
    ],
  },
];

const COMMENTS_DATA = [
  // Comments on Alex's tRPC post
  { username: 'maria_design', postIndex: 0, content: 'This is great! I love how tRPC makes the developer experience so smooth. Have you tried it with React Query?' },
  { username: 'sara_data', postIndex: 0, content: 'The type safety is amazing. Coming from Python, this is exactly what I needed for my TypeScript projects.' },
  { username: 'john_writes', postIndex: 0, content: 'Clear explanation! I\'m adding this to my documentation resources. The code example really helps.' },
  
  // Comments on Alex's VS Code post
  { username: 'mike_devops', postIndex: 1, content: 'GitLens is a must-have! I also recommend Docker extension if you work with containers.' },
  { username: 'maria_design', postIndex: 1, content: 'Thunder Client is so good! I switched from Postman and never looked back. Way faster!' },
  { username: 'john_writes', postIndex: 1, content: 'I\'d add Better Comments to this list. Makes TODO comments stand out beautifully.' },
  
  // Comments on Alex's React 19 post
  { username: 'sara_data', postIndex: 2, content: 'Server components are perfect for data-heavy apps. No more loading spinners everywhere!' },
  { username: 'mike_devops', postIndex: 2, content: 'How do you handle caching with server components? Is it similar to Next.js caching?' },
  { username: 'alex_tech', postIndex: 2, content: '@mike_devops Yes! React has a cache() function. Next.js extends it with more options.' },
  
  // Comments on Maria's color theory post
  { username: 'alex_tech', postIndex: 3, content: 'As a developer, this helps so much! I always struggled with choosing colors. The 60-30-10 rule is brilliant.' },
  { username: 'john_writes', postIndex: 3, content: 'I use Coolors all the time! Great recommendation. The contrast checker is super helpful too.' },
  { username: 'sara_data', postIndex: 3, content: 'Accessibility is so important. I always check contrast ratios now. WebAIM has a great tool for this.' },
  
  // Comments on Maria's forms post
  { username: 'mike_devops', postIndex: 4, content: 'Progressive disclosure! This is why checkout flows feel so much better now. One step at a time.' },
  { username: 'alex_tech', postIndex: 4, content: 'The validation tips are gold. I hate forms that yell at me before I finish typing 😅' },
  { username: 'john_writes', postIndex: 4, content: 'Writing good form labels is harder than it looks. Clear and concise is the way!' },
  
  // Comments on Maria's Figma post
  { username: 'alex_tech', postIndex: 5, content: 'Inspect mode saves so much time! No more guessing spacing and colors.' },
  { username: 'sara_data', postIndex: 5, content: 'The keyboard shortcuts are super useful. Shift+2 to zoom to selection is my favorite.' },
  { username: 'mike_devops', postIndex: 5, content: 'Dev Mode is worth the upgrade. The code snippets for CSS are really accurate.' },
  
  // Comments on Maria's micro-interactions post
  { username: 'john_writes', postIndex: 6, content: 'Details DO create delight! The little things make users feel like the app cares.' },
  { username: 'alex_tech', postIndex: 6, content: 'Reduced motion preferences are so important. Not everyone wants animations!' },
  { username: 'sara_data', postIndex: 6, content: 'Twitter\'s heart animation is iconic. Simple but effective!' },
  
  // Comments on John's documentation post
  { username: 'maria_design', postIndex: 7, content: 'YES! Start with why! Too many docs jump straight to the how without context.' },
  { username: 'alex_tech', postIndex: 7, content: 'The code example comparison is perfect. Context matters so much in examples.' },
  { username: 'mike_devops', postIndex: 7, content: 'Dead docs are the worst. We do quarterly reviews now and it helps a lot.' },
  
  // Comments on John's Markdown post
  { username: 'sara_data', postIndex: 8, content: 'Markdown is perfect for Jupyter notebooks too! Mix code and documentation seamlessly.' },
  { username: 'alex_tech', postIndex: 8, content: 'Obsidian is amazing for notes. The graph view shows connections between ideas!' },
  { username: 'maria_design', postIndex: 8, content: 'I use Notion which supports Markdown. Best of both worlds!' },
  
  // Comments on John's code review post
  { username: 'mike_devops', postIndex: 9, content: 'The human side is so important. Be kind in reviews, we\'re all learning!' },
  { username: 'alex_tech', postIndex: 9, content: '"Perfect is the enemy of shipped" - this should be on every PR template!' },
  { username: 'sara_data', postIndex: 9, content: 'I always ask questions instead of demanding changes. Creates better discussions.' },
  
  // Comments on Sara's ML post
  { username: 'alex_tech', postIndex: 10, content: 'TensorFlow.js is incredible! Running ML models in the browser opens so many possibilities.' },
  { username: 'john_writes', postIndex: 10, content: 'Great intro to ML! The supervised vs unsupervised explanation is very clear.' },
  { username: 'mike_devops', postIndex: 10, content: 'We use Hugging Face models in production. The API is really well designed.' },
  
  // Comments on Sara's data viz post
  { username: 'maria_design', postIndex: 11, content: 'Yes! Remove chartjunk! Less is more in data visualization.' },
  { username: 'alex_tech', postIndex: 11, content: 'Plotly is great for web dashboards. The interactivity is smooth and the API is nice.' },
  { username: 'john_writes', postIndex: 11, content: 'Colorblind friendly palettes should be default everywhere. Great reminder!' },
  
  // Comments on Sara's SQL post
  { username: 'mike_devops', postIndex: 12, content: 'Window functions are magic! Took me a while to understand but now I use them everywhere.' },
  { username: 'alex_tech', postIndex: 12, content: 'CTEs make complex queries so much more readable. Nested subqueries are nightmares.' },
  { username: 'john_writes', postIndex: 12, content: 'EXPLAIN is my best friend. Always check the query plan!' },
  
  // Comments on Sara's real-time post
  { username: 'alex_tech', postIndex: 13, content: 'Redis pub/sub is perfect for this! We use it for real-time notifications too.' },
  { username: 'mike_devops', postIndex: 13, content: 'The backpressure point is crucial. Don\'t overwhelm the clients!' },
  { username: 'maria_design', postIndex: 13, content: 'Real-time dashboards are so satisfying to watch. The UX feels magical!' },
  
  // Comments on Sara's Pandas post
  { username: 'john_writes', postIndex: 14, content: 'Pandas is like SQL and Excel had a baby. Love this comparison!' },
  { username: 'alex_tech', postIndex: 14, content: 'The groupby operations are so powerful. Great for analytics!' },
  { username: 'mike_devops', postIndex: 14, content: 'We use Pandas for log analysis. Reading from JSON logs and aggregating is super easy.' },
  
  // Comments on Mike's Docker post
  { username: 'alex_tech', postIndex: 15, content: 'Multi-stage builds changed my life! Images went from 1GB to 100MB.' },
  { username: 'sara_data', postIndex: 15, content: 'The non-root user tip is gold. Security should always be a priority!' },
  { username: 'john_writes', postIndex: 15, content: 'Health checks are underrated. Makes deployments so much more reliable.' },
  
  // Comments on Mike's K8s post
  { username: 'alex_tech', postIndex: 16, content: 'K8s seemed overwhelming at first but you explained it really well!' },
  { username: 'sara_data', postIndex: 16, content: 'We use k3s for edge computing. Lightweight and perfect for smaller deployments.' },
  { username: 'maria_design', postIndex: 16, content: 'The "when to use K8s" section is important. Not every project needs it!' },
  { username: 'john_writes', postIndex: 16, content: 'minikube is great for learning. Broke and fixed things many times 😄' },
];

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const db = await getDb();
  if (!db) {
    throw new Error('Failed to connect to database');
  }

  try {
    // Create users
    console.log('👥 Creating users...');
    const createdUsers: any[] = [];
    
    for (const userData of USERS_DATA) {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`  ⚠ User ${userData.username} already exists, skipping...`);
        createdUsers.push(existingUser[0]);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const [user] = await db
        .insert(users)
        .values({
          username: userData.username,
          email: userData.email,
          name: userData.name,
          bio: userData.bio,
          passwordHash: hashedPassword,
          role: 'user',
          openId: `local-${userData.username}`,
        })
        .returning();
      
      createdUsers.push(user);
      console.log(`  ✓ Created user: ${userData.username}`);
    }

    // Create posts with tags
    console.log('\n📝 Creating posts...');
    const createdPosts: any[] = [];
    const allTags = new Map<string, number>();
    let postIndex = 0;

    for (const authorData of POSTS_DATA) {
      const author = createdUsers.find(u => u.username === authorData.username);
      if (!author) continue;

      for (const postData of authorData.posts) {
        const [post] = await db
          .insert(posts)
          .values({
            title: postData.title,
            content: postData.content,
            userId: author.id,
            published: 1,
            contentType: 'markdown',
          })
          .returning();

        createdPosts.push({ ...post, tags: postData.tags });
        console.log(`  ✓ Created post: "${postData.title}" by ${authorData.username}`);

        // Create tags for this post
        if (postData.tags && postData.tags.length > 0) {
          for (const tagName of postData.tags) {
            let tagId = allTags.get(tagName);
            
            if (!tagId) {
              // Create new tag
              const [newTag] = await db
                .insert(tags)
                .values({ name: tagName })
                .returning();
              tagId = newTag.id;
              allTags.set(tagName, tagId);
            }

            // Link tag to post
            await db.insert(postTags).values({
              postId: post.id,
              tagId: tagId,
            });
          }
        }
      }
    }

    console.log(`  ✓ Created ${allTags.size} unique tags`);

    // Create comments
    console.log('\n💬 Creating comments...');
    for (const commentData of COMMENTS_DATA) {
      const commenter = createdUsers.find(u => u.username === commentData.username);
      const post = createdPosts[commentData.postIndex];
      
      if (!commenter || !post) continue;

      await db.insert(comments).values({
        content: commentData.content,
        userId: commenter.id,
        postId: post.id,
      });

      console.log(`  ✓ ${commentData.username} commented on post #${commentData.postIndex + 1}`);
    }

    // Create likes (each user likes several posts)
    console.log('\n❤️  Creating likes...');
    let likeCount = 0;

    for (const user of createdUsers) {
      // Each user likes 8-12 random posts (not their own)
      const numLikes = Math.floor(Math.random() * 5) + 8;
      const postsToLike = createdPosts
        .filter(p => p.authorId !== user.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, numLikes);

      for (const post of postsToLike) {
        await db.insert(likes).values({
          userId: user.id,
          postId: post.id,
        });
        likeCount++;
      }
    }

    console.log(`  ✓ Created ${likeCount} likes`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Users: ${createdUsers.length}`);
    console.log(`  - Posts: ${createdPosts.length}`);
    console.log(`  - Tags: ${allTags.size}`);
    console.log(`  - Comments: ${COMMENTS_DATA.length}`);
    console.log(`  - Likes: ${likeCount}`);
    
    console.log('\n🔑 Test accounts (all passwords: User123!):');
    for (const userData of USERS_DATA) {
      console.log(`  - ${userData.username} (${userData.email})`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('\n👋 Seeding script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
