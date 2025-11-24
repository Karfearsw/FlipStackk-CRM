import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';
import { insertUserSchema } from '@/db/schema';
import { z } from 'zod';
import { logError, logInfo } from '@/lib/logger';

const rateLimit = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 20;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (!entry || now - entry.ts > WINDOW_MS) {
      rateLimit.set(ip, { count: 1, ts: now });
    } else {
      entry.count += 1;
      if (entry.count > MAX_REQ) {
        return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
      }
    }
    
    if (!body.username || !body.password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const existingUser = await storage.getUserByUsername(body.username);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }

    if (body.email) {
      const existingEmailUser = await storage.getUserByEmail(body.email);
      if (existingEmailUser) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 400 }
        );
      }
    }
    
    const validatedData = insertUserSchema.parse({
      ...body,
      password: await hashPassword(body.password),
    });
    
    const user = await storage.createUser(validatedData);
    logInfo('user_registered', { userId: user.id, username: user.username, email: user.email });
    
    const { password, ...userResponse } = user;
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid user data', errors: error.issues },
        { status: 400 }
      );
    }
    
    const err: any = error as any;
    if (err && err.code === '23505') {
      const detail = typeof err.detail === 'string' ? err.detail : '';
      const isEmailDup = detail.includes('email');
      const isUsernameDup = detail.includes('username');
      const message = isEmailDup
        ? 'Email already exists'
        : isUsernameDup
        ? 'Username already exists'
        : 'Duplicate value';
      return NextResponse.json(
        { message },
        { status: 409 }
      );
    }
    
    logError('register_failed', {
      name: err?.name,
      code: err?.code,
      detail: err?.detail,
      message: err?.message,
      stack: err?.stack,
    });
    
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
