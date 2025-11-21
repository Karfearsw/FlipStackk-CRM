import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const items = await storage.getCommunications({ leadId: leadId ? Number(leadId) : undefined });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch communications' }, { status: 500 });
  }
}
