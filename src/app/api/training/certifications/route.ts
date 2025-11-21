import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertCertificationSchema } from '@/db/schema';

function generateCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const parsed = insertCertificationSchema.safeParse({
      ...body,
      certificateCode: body.certificateCode || generateCode(),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }
    const cert = await storage.issueCertification(parsed.data);
    return NextResponse.json(cert, { status: 201 });
  } catch (error) {
    console.error('Error issuing certification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}