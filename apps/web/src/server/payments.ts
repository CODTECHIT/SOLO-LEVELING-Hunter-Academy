import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

export const createOrderFn = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    // Scaffold for Razorpay order
    return { orderId: 'stub_id' }
  })
