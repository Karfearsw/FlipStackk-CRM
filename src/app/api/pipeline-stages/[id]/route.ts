import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { id } = await params;
    const updated = await storage.updatePipelineStage(parseInt(id), body);
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating stage:', e);
    return NextResponse.json({ message: 'Failed to update stage' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const ok = await storage.deletePipelineStage(parseInt(id));
    return NextResponse.json({ success: ok });
  } catch (e) {
    console.error('Error deleting stage:', e);
    return NextResponse.json({ message: 'Failed to delete stage' }, { status: 500 });
  }
}