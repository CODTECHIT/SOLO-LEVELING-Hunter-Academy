# Product Requirements Document (PRD)
## LMS Portal — Web + Mobile Application

**Version:** 1.0 (Draft for review)
**Prepared for:** codetechitsolutions — Client LMS Project
**Platforms:** Web (React + Next.js), Mobile (React Native — Android & iOS)

---

## 1. Overview

A Learning Management System (LMS) with three user roles — **Admin**, **Instructor** (content added by Admin, not self-service creator role in this scope — see note in Section 4), and **Student**. The system will run as a responsive web application and a native mobile app (Android/iOS) sharing the same backend and business logic.

This scope is intentionally lean compared to typical marketplace-style LMS products — **no multi-instructor marketplace mechanics** (no commissions, no instructor payouts, no revenue split). This is closer to a single-organization training/course platform than an Udemy-style marketplace.

---

## 2. User Roles

| Role | Description |
|---|---|
| **Admin** | Full control — manages courses, users, roles, payments, refunds, CMS, site config |
| **Sub-Admin / Role-based staff** | Custom roles created by Admin with scoped permissions (e.g., a "Content Manager" who can only manage courses, not financials) |
| **Student** | Registers, browses/enrolls in courses, learns, tracks progress, requests refunds, reviews |

> **Note on "Instructor":** Based on your description, courses are added *by the Admin* (upload videos, set title/description, lessons, categories) rather than instructors self-registering and managing their own courses/earnings. So functionally, there is no separate "Instructor portal" with login — course creation/CRUD is an **Admin capability**. If you do want a distinct Instructor login later (without earnings/commission), that would be a Phase 2 addition. Flagging this since it changes the role model from the reference screenshots you shared.

---

## 3. Admin Panel — Feature Scope

| # | Feature | Details |
|---|---|---|
| 1 | **Dashboard & Analytics** | Real-time overview: enrollments, active users, course-wise stats |
| 2 | **Course Management (CRUD)** | Create/Read/Update/Delete courses; add categories/subjects; upload multiple lessons/videos per course; title & description per course and per lesson |
| 3 | **User Management** | Manage Students and Admin/staff users |
| 4 | **Role-Based Access Control (RBAC)** | Admin can create custom roles (e.g., "Content Editor," "Support Staff") and assign granular permissions/access per role |
| 5 | **Financial Reports** | Reports on courses purchased by students — revenue per course, enrollment counts, transaction history. *(No commission/instructor-earning logic — single-seller model)* |
| 6 | **Payment Gateway** | Razorpay integration only |
| 7 | **Refund System** | Admin can view, approve/reject, and process student refund requests |
| 8 | **CMS** | Manage Blog, static Pages, FAQ, homepage sliders/banners |
| 9 | **Site Configuration** | Logo, colors/branding, SEO meta settings — no-code editable |
| 10 | **Frontend Manager** | Edit Home / About / Contact / Policy pages content directly from admin panel |

### Explicitly excluded from Admin scope
- ❌ AI Configuration (no AI provider management)
- ❌ Separate Authentication/OTP module, SMTP config screen (standard auth is still needed for login — see Section 6 — but no OTP-based 2FA/verification flow or admin-configurable SMTP panel)
- ❌ Revenue Distribution / commission splitting
- ❌ Withdrawal Settings (no payouts, since no instructor marketplace)
- ❌ Recaptcha & Security settings panel, account-deletion request management

---

## 4. Instructor-Side Capabilities (folded into Admin, per Section 2 note)

| Capability | Details |
|---|---|
| Course CRUD | Create, edit, delete courses |
| Category management | Assign subject/category to each course |
| Video upload | Upload single or multiple videos per course |
| Lesson structuring | Multiple lessons per course, each with its own video, title, description |
| No AI-based course generation | Content is manually authored/uploaded, not AI-generated |

---

## 5. Student-Facing Web/App — UI & Feature Scope

### 5.1 Public (Pre-login) Pages

- **Header:** Logo, Courses (browsable by category), Login, Sign Up
- **Landing Page:**
  - Hero section
  - Featured Courses section
  - "Why Choose Us" section
  - "Our Mission" section
  - Call-to-action ("Ready to start learning")
- **Footer:** Standard footer (links, contact, social, policies)

### 5.2 Post-Login (Student Dashboard)

| Feature | Details |
|---|---|
| Greeting | Personalized "Hello, [Name]" welcome message |
| Course listing | All available/enrolled courses shown |
| Enroll Now | Enroll button on each course card (pre-purchase) |
| Course Timeline / Progress | Visual progress through lessons — track completion |
| Course player | Watch enrolled course videos, resume progress |
| FAQ section | Static or per-course FAQ |
| Support option | Contact/help access |
| Reviews & Ratings | Students can rate and review courses |
| WhatsApp popup button | Floating WhatsApp chat/call button — site-wide |

### 5.3 Cross-cutting UI requirements
- Clean, modern landing page (comparable to standard SaaS/course-platform landing pages)
- Fully responsive (web) + native parity (mobile app)
- Floating WhatsApp contact widget on all pages

---

## 6. Baseline Requirements (implied, not explicitly excluded)

Even though OTP/2FA-as-an-admin-configurable-module is excluded, the platform still needs standard functionality to operate. Confirm/refine these with the client:

- Basic email/password (or mobile number) login & signup for students — **without OTP verification flow**, unless you want a simple one-time email verification link (not OTP)
- Session/token-based auth (JWT) — needed regardless of "no auth module in admin panel"
- Password reset flow
- Course search
- Basic SEO handling (even without an "AI/SEO config panel" — pages still need meta tags)

*(These aren't in your notes but are typically assumed baseline — flagging so nothing silently breaks later.)*

---

## 7. Explicitly Out of Scope (Confirmed Cuts)

- AI Configuration / AI-based course creation / AI Teacher Assistant / AI Learning Path Generator
- Multi-gateway payments (Stripe/PayPal/Flutterwave/Mollie) — **Razorpay only**
- Revenue Distribution / commission engine
- Withdrawal Settings / instructor payouts
- Recaptcha & Security admin panel
- OTP-based authentication module
- SMTP configuration panel
- Course Bundle Addon (not mentioned — confirm if needed)
- Live Classes/Workshops module (not mentioned — confirm if needed)
- Coupon & Discount system (not mentioned — confirm if needed)
- Pomodoro Timer, Wishlist & Cart (not mentioned — confirm if needed)
- Certificates with QR validation (not mentioned — confirm if needed)

---

## 8. Proposed Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | React + Next.js |
| Mobile app | React Native (Android + iOS) |
| Backend | Node.js (NestJS recommended, matches your existing stack pattern) |
| Database | PostgreSQL / MongoDB (to be finalized based on data model complexity) |
| Payments | Razorpay |
| Video hosting/streaming | To be decided — options: Cloudflare Stream, Mux, Bunny.net, or self-hosted (S3 + HLS) |
| Media storage | Cloudinary / S3 / Cloudflare R2 |
| Auth | JWT-based session auth |

---

## 9. Open Questions for Client (need answers before finalizing PRD)

1. Do you want a distinct **Instructor login/portal** later (Phase 2), even without earnings/commission — e.g., instructors managing their own course content but Admin still oversees everything?
2. Video hosting: any preference/budget for streaming provider, or should we recommend one?
3. Should students be able to pay per-course only, or do you want course bundles/subscriptions?
4. Certificates on course completion — needed or not?
5. Live classes — needed now or future phase?
6. Any requirement for a mobile app in Phase 1, or can mobile be Phase 2 after web MVP?
7. Confirm auth flow: plain email/password only, or do you want email verification link (without OTP)?

---

## 10. Next Steps

1. Finalize answers to Section 9 open questions
2. Lock the **MVP scope** based on this document
3. Produce **System Architecture Document** (API design, DB schema, folder structure, third-party integration list)
4. Produce **Design Guide** (design tokens, component library plan shared between Next.js web and React Native app)
5. Break down into Epics → User Stories → Sprint plan