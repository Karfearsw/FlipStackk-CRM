import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { insertAssessmentSubmissionSchema } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const parsed = insertAssessmentSubmissionSchema.safeParse({
      ...body,
      userId: parseInt(session.user.id),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }
    const sub = await storage.submitAssessment(parsed.data);
    return NextResponse.json(sub, { status: 201 });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}