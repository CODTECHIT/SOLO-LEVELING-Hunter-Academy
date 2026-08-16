# Issue #3: Frontend API Integration Guide

## Overview

The web and mobile apps currently have routes scaffolded but need to be connected to the NestJS API backend. This guide provides step-by-step instructions for integrating each app with the API.

---

## Part 1: Web App Integration (`apps/web`)

### 1.1 Create API Client Service

Create `apps/web/src/lib/api.ts`:

```typescript
import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:3001";

let authToken: string | null = null;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem("authToken", token);
}

export function getAuthToken() {
  if (!authToken) {
    authToken = localStorage.getItem("authToken");
  }
  return authToken;
}

export function clearAuth() {
  authToken = null;
  localStorage.removeItem("authToken");
}

export async function loadAuthTokenFromStorage() {
  const token = localStorage.getItem("authToken");
  if (token) {
    setAuthToken(token);
  }
}
```

### 1.2 Update Server Functions (Migration Path)

The web app currently uses TanStack React Start server functions with embedded Prisma. Here's how to migrate to API calls:

**Current Approach (Embedded):**

```typescript
// apps/web/src/server/auth.ts (OLD)
import { prisma } from "./db";
export const loginUserFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // ...
  },
);
```

**New Approach (API):**

```typescript
// apps/web/src/lib/api-auth.ts (NEW)
import { api, setAuthToken } from "./api";

export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
) {
  const response = await api.post("/auth/signup", {
    email,
    password,
    name,
    phone,
  });
  setAuthToken(response.data.token);
  return response.data;
}

export async function signIn(email: string, password: string) {
  const response = await api.post("/auth/signin", { email, password });
  setAuthToken(response.data.token);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.post("/auth/me");
  return response.data;
}
```

### 1.3 Update Login Route

Update `apps/web/src/routes/login.tsx`:

```typescript
import { handleSignIn } from "@/lib/api-auth";

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    await handleSignIn(email, password);
    await router.navigate({ to: "/dashboard" });
  } catch (err: any) {
    setError(err.response?.data?.message || "Login failed");
  } finally {
    setIsLoading(false);
  }
}
```

### 1.4 Create Courses API Service

Create `apps/web/src/lib/api-courses.ts`:

```typescript
import { api } from "./api";

export async function getAllCourses(skip = 0, take = 10) {
  const response = await api.get("/courses", {
    params: { skip, take },
  });
  return response.data;
}

export async function getCourseById(id: string) {
  const response = await api.get(`/courses/${id}`);
  return response.data;
}

export async function getCourseBySlug(slug: string) {
  const response = await api.get(`/courses/slug/${slug}`);
  return response.data;
}

export async function searchCourses(query: string) {
  const response = await api.get("/courses/search", {
    params: { q: query },
  });
  return response.data;
}

export async function getCategories() {
  const response = await api.get("/courses/categories");
  return response.data;
}
```

### 1.5 Create Users API Service

Create `apps/web/src/lib/api-users.ts`:

```typescript
import { api } from "./api";

export async function getUserProfile() {
  const response = await api.get("/users/profile");
  return response.data;
}

export async function getUserEnrollments() {
  const response = await api.get("/users/enrollments");
  return response.data;
}

export async function getUserProgress() {
  const response = await api.get("/users/progress");
  return response.data;
}
```

### 1.6 Create Admin API Service

Create `apps/web/src/lib/api-admin.ts`:

```typescript
import { api } from "./api";

export async function getAdminDashboard() {
  const response = await api.get("/admin/dashboard");
  return response.data;
}

export async function listRefundRequests() {
  const response = await api.get("/admin/refunds");
  return response.data;
}
```

### 1.7 Update Environment Config

Create `.env.local` in web root:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Frontend URLs
VITE_FRONTEND_URL=http://localhost:3000
```

---

## Part 2: Mobile App Integration (`apps/mobile`)

### 2.1 Update API Configuration

Already done in Issue #1 (`apps/mobile/.env`):

```env
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For physical device - replace with your machine LAN IP
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

**Wait!** This should point to the **API server** (port 3001), not the web server:

```env
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001

# For physical device
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3001
```

### 2.2 Update Mobile API Client

Update `apps/mobile/lib/api.ts`:

```typescript
import axios from "axios";
import { getToken, saveToken } from "./auth";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearToken();
      // Navigation will be handled by auth check in app
    }
    return Promise.reject(error);
  },
);

export async function clearToken() {
  // Clear from secure store
}
```

### 2.3 Create Mobile Auth Service

Update `apps/mobile/lib/auth.ts`:

```typescript
import * as SecureStore from "expo-secure-store";
import { api } from "./api";

const TOKEN_KEY = "authToken";

export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
) {
  const response = await api.post("/auth/signup", {
    email,
    password,
    name,
    phone,
  });

  await saveToken(response.data.token);
  return response.data;
}

export async function signIn(email: string, password: string) {
  const response = await api.post("/auth/signin", {
    email,
    password,
  });

  await saveToken(response.data.token);
  return response.data;
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getCurrentUser() {
  const response = await api.post("/auth/me");
  return response.data;
}
```

---

## Part 3: Running Everything Together

### Prerequisites

- PostgreSQL running with LMS database
- API running: `cd apps/api && npm run dev`
- Web app running: `cd apps/web && npm run dev -- --host 0.0.0.0`
- Mobile running: `cd apps/mobile && npx expo start --clear`

### Testing Flow

**1. Create a new account (Mobile):**

```
Tap "Sign Up" → Enter email/password/name → Submit
```

**2. Login (Web):**

```
Navigate to /login → Enter same credentials → See dashboard
```

**3. Browse courses (Web & Mobile):**

```
Both apps should show the same course list from API
```

**4. Check admin (Web):**

```
Admin user can access /admin/dashboard and see stats
```

---

## Part 4: Key Files to Update

| File                              | Current    | Action                      |
| --------------------------------- | ---------- | --------------------------- |
| `apps/web/src/lib/api.ts`         | ❌ Missing | Create API client           |
| `apps/web/src/lib/api-auth.ts`    | ❌ Missing | Create auth service         |
| `apps/web/src/lib/api-courses.ts` | ❌ Missing | Create courses service      |
| `apps/web/src/lib/api-users.ts`   | ❌ Missing | Create users service        |
| `apps/web/src/routes/login.tsx`   | ✅ Exists  | Update to use API           |
| `apps/web/src/routes/signup.tsx`  | ✅ Exists  | Update to use API           |
| `apps/mobile/.env`                | ⚠️ Partial | Update API URL to port 3001 |
| `apps/mobile/lib/api.ts`          | ✅ Exists  | Update for JWT handling     |
| `apps/mobile/lib/auth.ts`         | ⚠️ Partial | Update to call API          |
| `.env.local` (web root)           | ❌ Missing | Create env config           |

---

## Part 5: Next Implementation Steps

1. **Create all API service files** in `apps/web/src/lib/`
2. **Update all route handlers** to use API services instead of Prisma
3. **Update mobile auth.ts** to use new API endpoints
4. **Test signup/signin flow** on both platforms
5. **Implement course browsing** on web & mobile
6. **Add enrollment flow** with payment integration (Phase 2)
7. **Implement progress tracking** (Phase 3)

---

## Troubleshooting

### Mobile can't reach backend

- Verify backend is listening on `0.0.0.0:3001`
- Check `.env` has correct IP: `10.0.2.2` for emulator
- Test with: `adb shell ping 10.0.2.2`

### 401 Unauthorized errors

- Token might be expired (7 day TTL)
- Check localStorage/SecureStore for valid token
- Ensure `Authorization: Bearer <token>` is sent

### CORS errors

- Backend must have CORS enabled for frontend URL
- Check `apps/api/src/main.ts` CORS configuration

---
