import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const docs = await storage.getDocuments(q, tag, limit, offset);
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}