import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';
import { insertUserSchema } from '@/db/schema';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
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
    
    const validatedData = insertUserSchema.parse({
      ...body,
      password: await hashPassword(body.password),
    });
    
    const user = await storage.createUser(validatedData);
    
    const { password, ...userResponse } = user;
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid user data', errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in /api/register:', error);
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
