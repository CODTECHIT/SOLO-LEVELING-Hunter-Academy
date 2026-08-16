# Project Structure — LMS Portal
## Web (Next.js) + Mobile (React Native) + Backend (NestJS)

**Version:** 1.0
**Project:** cyber tech — LMS Platform
**Stack:** TanStack Start | React Native (Expo) | NestJS | PostgreSQL | Razorpay

---

## 1. Monorepo Root

```text
lms-portal/
├── apps/
│   ├── web/          ← TanStack Start — student + admin frontend
│   ├── mobile/       ← React Native (Expo) — student app
│   └── api/          ← NestJS — shared backend
├── packages/
│   ├── ui/           ← Shared UI tokens (colors, spacing, types) used by web + mobile
│   ├── types/        ← Shared TypeScript types/interfaces (DTOs etc.)
│   └── config/       ← Shared ESLint, Prettier, TS configs
├── .env.example
├── .gitignore
├── package.json      ← Workspace root (npm/pnpm/bun workspaces)
└── turbo.json        ← Turborepo config (optional but recommended)
```

---

## 2. Web App — apps/web/

### Full Structure

```text
apps/web/
├── public/
│   ├── logo.svg
│   ├── og-image.jpg
│   └── favicon.ico
├── src/
│   ├── routes/                       ← TanStack Start file-based routing
│   │   ├── __root.tsx                ← Root layout and providers
│   │   ├── index.tsx                 ← Landing page (public home)
│   │   ├── login.tsx                 ← Auth routes
│   │   ├── signup.tsx
│   │   ├── _student.tsx              ← Student layout wrapper
│   │   ├── _student.dashboard.tsx    ← Student dashboard
│   │   ├── _student.learn.$courseId.tsx
│   │   ├── _admin.tsx                ← Admin layout wrapper
│   │   └── _admin.admin.academy/     ← Admin routes
│   │
│   ├── components/
│   │   ├── ui/                       ← Base design system components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── table.tsx
│   │   │   └── avatar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            ← Public navbar
│   │   │   ├── Footer.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminTopbar.tsx
│   │   │   └── StudentLayout.tsx
│   │   │
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── FeaturedCourses.tsx
│   │   │   ├── WhyChooseUs.tsx
│   │   │   ├── MissionSection.tsx
│   │   │   └── CtaBanner.tsx
│   │   │
│   │   ├── courses/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseGrid.tsx
│   │   │   ├── CourseFilters.tsx
│   │   │   ├── CourseDetailHero.tsx
│   │   │   ├── LessonAccordion.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── ReviewSection.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── GreetingBanner.tsx
│   │   │   ├── ContinueLearningCard.tsx
│   │   │   ├── CourseProgressCard.tsx
│   │   │   └── StatsCard.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── EnrollmentChart.tsx
│   │   │   ├── RecentEnrollmentsTable.tsx
│   │   │   ├── CourseForm.tsx
│   │   │   ├── LessonManager.tsx
│   │   │   ├── UserTable.tsx
│   │   │   ├── RoleEditor.tsx
│   │   │   └── RefundTable.tsx
│   │   │
│   │   └── shared/
│   │       ├── WhatsAppWidget.tsx    ← Floating WhatsApp button (all pages)
│   │       ├── SearchBar.tsx
│   │       ├── StarRating.tsx
│   │       ├── PriceTag.tsx
│   │       ├── CategoryBadge.tsx
│   │       └── PageLoader.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCourses.ts
│   │   ├── useProgress.ts
│   │   ├── useEnrollment.ts
│   │   └── useAdmin.ts
│   │
│   ├── lib/
│   │   ├── api.ts                    ← Axios/fetch client with interceptors
│   │   ├── auth.ts                   ← JWT helpers (set/get/clear token)
│   │   ├── razorpay.ts               ← Razorpay client integration
│   │   └── utils.ts                  ← cn(), formatCurrency(), formatDate()
│   │
│   ├── store/
│   │   ├── authStore.ts              ← Zustand: user session
│   │   ├── cartStore.ts              ← Zustand: enrollment cart (if needed)
│   │   └── uiStore.ts                ← Zustand: sidebar open, toast queue
│   │
│   ├── styles/
│   │   └── globals.css               ← Design tokens, Tailwind base, neon utilities
│   │
│   └── types/
│       ├── course.ts
│       ├── user.ts
│       ├── payment.ts
│       └── api.ts
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Mobile App — apps/mobile/

### Full Structure

```text
apps/mobile/
├── assets/
│   ├── fonts/                        ← Orbitron, Rajdhani, Inter (local fallback)
│   ├── images/
│   │   ├── splash.png
│   │   └── icon.png
│   └── icons/
│
├── app/                              ← Expo Router (file-based routing)
│   ├── _layout.tsx                   ← Root layout (fonts, auth provider)
│   ├── index.tsx                     ← Redirect to (tabs) or (auth)
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   │
│   └── (tabs)/                       ← Bottom tab navigator
│       ├── _layout.tsx               ← Tab bar config (4 tabs)
│       ├── index.tsx                 ← Home / Landing
│       ├── courses/
│       │   ├── index.tsx             ← Course catalog
│       │   └── [slug].tsx            ← Course detail
│       ├── my-learning/
│       │   ├── index.tsx             ← My enrolled courses
│       │   └── [courseId].tsx        ← Video player
│       └── profile.tsx
│
├── components/
│   ├── ui/                           ← Basic UI elements
│   ├── layout/
│   ├── courses/
│   ├── home/
│   ├── dashboard/
│   └── shared/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCourses.ts
│   └── useProgress.ts
│
├── lib/
│   ├── api.ts                        ← Axios/fetch client with interceptors
│   ├── auth.ts                       ← SecureStore JWT management
│   ├── razorpay.ts                   ← react-native-razorpay integration
│   └── utils.ts
│
├── store/
│   ├── authStore.ts                  ← Zustand
│   └── uiStore.ts
│
├── theme/
│   ├── colors.ts                     ← Hex tokens (matches web OKLCH values)
│   ├── typography.ts                 ← Font families + scale
│   ├── spacing.ts
│   └── shadows.ts
│
├── app.json                          ← Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Backend API — apps/api/

### Full Structure

```
apps/api/
├── src/
│   ├── main.ts                       ← NestJS bootstrap, CORS, Swagger
│   ├── app.module.ts                 ← Root module
│   │
│   ├── config/
│   │   ├── configuration.ts          ← env validation (Joi)
│   │   └── database.config.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── auth/                         ← JWT auth module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts        ← /auth/login, /auth/signup, /auth/refresh
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── signup.dto.ts
│   │
│   ├── users/                        ← User management
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── roles/                        ← RBAC role management
│   │   ├── roles.module.ts
│   │   ├── roles.controller.ts
│   │   ├── roles.service.ts
│   │   └── dto/
│   │       └── create-role.dto.ts
│   │
│   ├── courses/                      ← Course CRUD
│   │   ├── courses.module.ts
│   │   ├── courses.controller.ts
│   │   ├── courses.service.ts
│   │   └── dto/
│   │       ├── create-course.dto.ts
│   │       └── update-course.dto.ts
│   │
│   ├── lessons/                      ← Lesson management per course
│   │   ├── lessons.module.ts
│   │   ├── lessons.controller.ts
│   │   ├── lessons.service.ts
│   │   └── dto/
│   │       └── create-lesson.dto.ts
│   │
│   ├── categories/                   ← Course categories
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   └── categories.service.ts
│   │
│   ├── enrollments/                  ← Student enrollments
│   │   ├── enrollments.module.ts
│   │   ├── enrollments.controller.ts
│   │   └── enrollments.service.ts
│   │
│   ├── progress/                     ← Lesson progress tracking
│   │   ├── progress.module.ts
│   │   ├── progress.controller.ts
│   │   └── progress.service.ts
│   │
│   ├── payments/                     ← Razorpay integration
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts    ← /payments/order, /payments/verify, /payments/webhook
│   │   ├── payments.service.ts
│   │   └── dto/
│   │       └── create-order.dto.ts
│   │
│   ├── refunds/                      ← Refund requests
│   │   ├── refunds.module.ts
│   │   ├── refunds.controller.ts
│   │   └── refunds.service.ts
│   │
│   ├── reviews/                      ← Course ratings & reviews
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   └── reviews.service.ts
│   │
│   ├── cms/                          ← Blog, Pages, FAQ, Banners
│   │   ├── cms.module.ts
│   │   ├── blog/
│   │   │   ├── blog.controller.ts
│   │   │   └── blog.service.ts
│   │   ├── pages/
│   │   │   ├── pages.controller.ts
│   │   │   └── pages.service.ts
│   │   ├── faq/
│   │   │   ├── faq.controller.ts
│   │   │   └── faq.service.ts
│   │   └── banners/
│   │       ├── banners.controller.ts
│   │       └── banners.service.ts
│   │
│   ├── settings/                     ← Site config (logo, SEO, branding)
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   └── settings.service.ts
│   │
│   ├── analytics/                    ← Dashboard stats for admin
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   └── analytics.service.ts
│   │
│   ├── uploads/                      ← File upload (videos, images)
│   │   ├── uploads.module.ts
│   │   ├── uploads.controller.ts
│   │   └── uploads.service.ts        ← Cloudinary/S3 integration
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── schema.prisma             ← DB schema
│
├── test/
│   └── app.e2e-spec.ts
├── .env
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 5. Shared Packages — packages/

```
packages/
├── types/                            ← Shared TypeScript interfaces
│   ├── src/
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── lesson.ts
│   │   ├── enrollment.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── ui/                               ← Design tokens shared between web+mobile
│   ├── src/
│   │   ├── colors.ts                 ← Color constants
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── config/                           ← Shared tooling configs
    ├── eslint-preset.js
    ├── prettier.config.js
    └── tsconfig.base.json
```

---

## 6. Database Schema (PostgreSQL via Prisma)

### Key Models

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  name        String
  role        Role     @default(STUDENT)
  customRoleId String?
  customRole  CustomRole? @relation(fields: [customRoleId], references: [id])
  enrollments Enrollment[]
  reviews     Review[]
  refunds     Refund[]
  progress    LessonProgress[]
  createdAt   DateTime @default(now())
}

model CustomRole {
  id          String   @id @default(cuid())
  name        String   @unique
  permissions Json                    // { courses: true, users: false, payments: false, ... }
  users       User[]
}

model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String
  thumbnail   String?
  price       Float
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  lessons     Lesson[]
  enrollments Enrollment[]
  reviews     Review[]
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])
  title       String
  description String?
  videoUrl    String
  order       Int
  duration    Int?     // seconds
  progress    LessonProgress[]
}

model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  user        User     @relation(fields: [userId], references: [id])
  course      Course   @relation(fields: [courseId], references: [id])
  paymentId   String?
  enrolledAt  DateTime @default(now())
  @@unique([userId, courseId])
}

model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  lessonId    String
  user        User     @relation(fields: [userId], references: [id])
  lesson      Lesson   @relation(fields: [lessonId], references: [id])
  completed   Boolean  @default(false)
  completedAt DateTime?
  @@unique([userId, lessonId])
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  courseId        String
  razorpayOrderId String   @unique
  razorpayPaymentId String? @unique
  amount          Float
  currency        String   @default("INR")
  status          PaymentStatus @default(PENDING)
  createdAt       DateTime @default(now())
}

model Refund {
  id          String   @id @default(cuid())
  userId      String
  paymentId   String
  user        User     @relation(fields: [userId], references: [id])
  reason      String
  status      RefundStatus @default(PENDING)
  createdAt   DateTime @default(now())
}

model Review {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  user        User     @relation(fields: [userId], references: [id])
  course      Course   @relation(fields: [courseId], references: [id])
  rating      Int      // 1–5
  comment     String?
  createdAt   DateTime @default(now())
  @@unique([userId, courseId])
}

model Category {
  id      String   @id @default(cuid())
  name    String   @unique
  slug    String   @unique
  courses Course[]
}

enum Role { ADMIN SUB_ADMIN STUDENT }
enum PaymentStatus { PENDING PAID FAILED }
enum RefundStatus { PENDING APPROVED REJECTED }
```

---

## 7. API Routes Overview

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Student registration |
| POST | `/auth/login` | Login → JWT |
| POST | `/auth/refresh` | Refresh JWT |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |

### Courses (Public + Admin)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/courses` | Public | List/search courses |
| GET | `/courses/:slug` | Public | Course detail |
| POST | `/courses` | Admin | Create course |
| PATCH | `/courses/:id` | Admin | Update course |
| DELETE | `/courses/:id` | Admin | Delete course |
| POST | `/courses/:id/lessons` | Admin | Add lesson |
| PATCH | `/lessons/:id` | Admin | Update lesson |
| DELETE | `/lessons/:id` | Admin | Delete lesson |

### Enrollments & Progress
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/enrollments/my` | Student | My enrolled courses |
| POST | `/enrollments` | Student | Enroll (post-payment) |
| POST | `/progress/:lessonId/complete` | Student | Mark lesson complete |
| GET | `/progress/:courseId` | Student | Course progress % |

### Payments
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/payments/order` | Student | Create Razorpay order |
| POST | `/payments/verify` | Student | Verify & confirm payment |
| POST | `/payments/webhook` | - | Razorpay webhook |
| GET | `/payments` | Admin | All transactions |

### Refunds
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/refunds` | Student | Request refund |
| GET | `/refunds` | Admin | All refund requests |
| PATCH | `/refunds/:id` | Admin | Approve/Reject |

### Reviews
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/reviews` | Student | Submit review |
| GET | `/reviews/course/:id` | Public | Course reviews |

### CMS
| Method | Route | Auth | Description |
|---|---|---|---|
| GET/PATCH | `/cms/pages/:slug` | Admin | Edit static pages |
| GET | `/cms/pages/:slug` | Public | Render page |
| CRUD | `/cms/blog` | Admin | Blog management |
| CRUD | `/cms/faq` | Admin | FAQ management |
| CRUD | `/cms/banners` | Admin | Banner management |

### Admin
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Admin | KPIs + chart data |
| CRUD | `/users` | Admin | User management |
| CRUD | `/roles` | Admin | Custom role management |
| GET/PATCH | `/settings` | Admin | Site configuration |

---

## 8. Environment Variables

```env
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lms_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx

# Media Storage (pick one)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# OR
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=

# Email (for password reset)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
```

---

## 9. Key Dependencies

### Web (apps/web)
| Package | Purpose |
|---|---|
| @tanstack/react-start | React framework |
| @tanstack/react-router | Routing |
| react, react-dom | UI runtime |
| tailwindcss | Styling |
| lucide-react | Icons |
| zustand | State management |
| axios | HTTP client |
| react-player | Video playback |
| recharts | Admin charts |
| @radix-ui/* | Headless UI primitives |
| react-hook-form + zod | Forms + validation |

### Mobile (apps/mobile)
| Package | Purpose |
|---|---|
| expo | SDK |
| expo-router | File-based navigation |
| react-native-reanimated | Animations |
| expo-av | Video player |
| expo-secure-store | JWT storage |
| zustand | State management |
| axios | HTTP client |
| react-native-razorpay | Razorpay payments |
| @expo-google-fonts/* | Orbitron, Rajdhani, Inter |

### API (apps/api)
| Package | Purpose |
|---|---|
| @nestjs/core | Framework |
| @prisma/client | ORM |
| prisma | DB migrations |
| @nestjs/jwt + passport | Auth |
| razorpay | Payment SDK |
| cloudinary or @aws-sdk/client-s3 | Media storage |
| class-validator + class-transformer | DTO validation |
| @nestjs/swagger | API docs |

---

## 10. Development Workflow

```bash
# Install all deps from monorepo root
npm install

# Run all apps simultaneously (turborepo)
npx turbo dev

# Or run individually:
npm run dev --workspace=apps/web      # Next.js on :3000
npm run dev --workspace=apps/api      # NestJS on :3001
npm run dev --workspace=apps/mobile   # Expo on :8081

# DB migrations
cd apps/api && npx prisma migrate dev
cd apps/api && npx prisma studio      # DB GUI
```
