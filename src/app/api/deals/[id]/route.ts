import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await storage.getDeal(parseInt(id));
    if (!deal) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(deal);
  } catch (e) {
    console.error('Error getting deal:', e);
    return NextResponse.json({ message: 'Failed to get deal' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const { id } = await params;
    const dealId = parseInt(id);
    const updated = await storage.updateDeal(dealId, body);
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    try {
      await storage.createActivity({
        userId: parseInt(session.user.id),
        actionType: 'update',
        targetType: 'deal',
        targetId: dealId,
        description: `Updated deal: ${updated.title}`,
      });
    } catch {}
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating deal:', e);
    return NextResponse.json({ message: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;
    const ok = await storage.deleteDeal(parseInt(id));
    return NextResponse.json({ success: ok });
  } catch (e) {
    console.error('Error deleting deal:', e);
    return NextResponse.json({ message: 'Failed to delete deal' }, { status: 500 });
  }
}