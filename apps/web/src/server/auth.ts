import { createServerFn } from '@tanstack/react-start'
import { setCookie, getCookie } from '@tanstack/react-start/server'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'solo-leveling-secret-key-123')

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function parseZod<T>(res: z.SafeParseReturnType<any, T>): T {
  if (!res.success) {
    const issue = res.error.issues[0];
    const field = issue.path.join('.') || 'input';
    const msg = issue.message;
    throw new Error(msg === 'Required' ? `${field} is required` : msg);
  }
  return res.data;
}

export const loginUserFn = createServerFn({ method: 'POST' })
  .validator((data) => parseZod(loginSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isValid = await bcrypt.compare(data.password, user.password)
    if (!isValid) {
      throw new Error("Invalid credentials")
    }

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    setCookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { success: true }
  })

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export const registerUserFn = createServerFn({ method: 'POST' })
  .validator((data) => parseZod(registerSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new Error("Email already registered")
    }

    const passwordHash = await bcrypt.hash(data.password, 10)
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: "STUDENT",
      }
    })

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    setCookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { success: true }
  })

export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = getCookie('auth_token')
    if (!token) return null

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (!payload.userId) return null
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: { id: true, name: true, email: true, role: true, phone: true }
      })
      
      return user
    } catch (e) {
      return null
    }
  })

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
})

export const updateProfileFn = createServerFn({ method: 'POST' })
  .validator((data) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error("Not logged in")

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
      }
    })

    return { success: true }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    setCookie('auth_token', '', { maxAge: 0, path: '/' })
    return { success: true }
  })
