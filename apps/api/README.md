# LMS Portal API — NestJS Backend

## 📁 Structure

```
apps/api/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health check endpoints
│   ├── app.service.ts
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts        # Passport JWT strategy
│   │   ├── jwt-auth.guard.ts      # Route protection
│   │   └── dto/
│   │       ├── sign-up.dto.ts
│   │       └── sign-in.dto.ts
│   │
│   ├── courses/                   # Courses management
│   │   ├── courses.module.ts
│   │   ├── courses.service.ts
│   │   └── courses.controller.ts
│   │
│   ├── users/                     # User profiles & progress
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   │
│   ├── admin/                     # Admin operations
│   │   ├── admin.module.ts
│   │   ├── admin.service.ts
│   │   └── admin.controller.ts
│   │
│   └── prisma/                    # Database ORM
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Copy `.env.example` to `.env` and configure PostgreSQL connection:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/lms_db
DIRECT_URL=postgresql://user:password@localhost:5432/lms_db
JWT_SECRET=your-secret-key
```

### 3. Run Migrations

```bash
npm run db:migrate:dev
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://0.0.0.0:3001`

---

## 📚 API Endpoints

### Authentication

- `POST /auth/signup` — Register new user
- `POST /auth/signin` — Login with email/password
- `POST /auth/me` — Get current user profile (requires JWT)

### Courses

- `GET /courses` — List published courses (paginated)
- `GET /courses/categories` — List all course categories
- `GET /courses/search?q=keyword` — Search courses by title/description
- `GET /courses/:id` — Get course details by ID
- `GET /courses/slug/:slug` — Get course details by slug

### Users

- `GET /users/profile` — Get user profile (requires JWT)
- `GET /users/enrollments` — Get user's enrolled courses (requires JWT)
- `GET /users/progress` — Get learning progress stats (requires JWT)

### Admin

- `GET /admin/dashboard` — Dashboard statistics (admin only)
- `GET /admin/refunds` — List pending refund requests (admin only)

### Health Check

- `GET /health` — API health status
- `GET /` — API info

---

## 🔐 Authentication

All protected endpoints require a Bearer token:

```bash
Authorization: Bearer <jwt_token>
```

JWT is issued on successful signup/signin and valid for 7 days.

---

## 📦 Core Features

- **Authentication:** Email/password signup & signin with JWT
- **Courses:** Full course catalog with categories, search, and details
- **Users:** Profile management, enrollment tracking, progress monitoring
- **Admin:** Dashboard stats, refund request management (more features coming)
- **Database:** Prisma ORM with PostgreSQL

---

## 🛠 Next Steps

### Phase 1: Payment Integration

- [ ] Razorpay integration endpoints
- [ ] Enrollment payment flow
- [ ] Payment webhook handling

### Phase 2: Course Management (Admin)

- [ ] Course CRUD operations
- [ ] Lesson management (upload, update, delete)
- [ ] Category management
- [ ] Course publishing

### Phase 3: Enhanced Features

- [ ] Video upload & streaming (AWS S3)
- [ ] Refund processing workflow
- [ ] Email notifications
- [ ] Role-based access control (RBAC)
- [ ] CMS page management
- [ ] Reviews & ratings

### Phase 4: Advanced

- [ ] Progress tracking & certificates
- [ ] Leaderboards & gamification
- [ ] Analytics & reporting
- [ ] Performance optimization

---

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# API
NODE_ENV=development
PORT=3001

# Frontend URLs
FRONTEND_URL=http://localhost:3000
MOBILE_FRONTEND_URL=http://10.0.2.2:3000

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# AWS S3
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

---

## 🐛 Troubleshooting

**Port already in use:**

```bash
# Change PORT in .env
PORT=3002 npm run dev
```

**Database connection error:**

- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists

**JWT errors:**

- Verify JWT_SECRET is set
- Check token hasn't expired
- Ensure Authorization header is correct

---

## 📖 Documentation

Full API documentation available at `/` endpoint when server is running.

---
