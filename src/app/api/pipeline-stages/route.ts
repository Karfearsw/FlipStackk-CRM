import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function GET() {
  try {
    const stages = await storage.getPipelineStages();
    return NextResponse.json(stages);
  } catch (e) {
    console.error('Error fetching stages:', e);
    return NextResponse.json({ message: 'Failed to fetch stages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const stage = await storage.createPipelineStage({ name: body.name, orderIndex: body.orderIndex ?? 0, isActive: body.isActive ?? true } as any);
    return NextResponse.json(stage, { status: 201 });
  } catch (e) {
    console.error('Error creating stage:', e);
    return NextResponse.json({ message: 'Failed to create stage' }, { status: 500 });
  }
}