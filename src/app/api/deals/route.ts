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
    const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
    const ownerUserId = searchParams.get('ownerUserId') ? parseInt(searchParams.get('ownerUserId')!) : undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const deals = await storage.getDeals({ stageId, ownerUserId, status, search, startDate, endDate });
    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ message: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const createData = {
      title: body.title,
      leadId: body.leadId ? Number(body.leadId) : null,
      ownerUserId: body.ownerUserId ? Number(body.ownerUserId) : parseInt(session.user.id),
      stageId: Number(body.stageId),
      value: body.value ? String(Number(body.value)) : '0',
      probability: body.probability ? Number(body.probability) : 0,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) as any : null,
      status: body.status || 'open',
      notes: body.notes || '',
    };

    const deal = await storage.createDeal(createData as any);

    await storage.createActivity({
      userId: parseInt(session.user.id),
      actionType: 'create',
      targetType: 'deal',
      targetId: deal.id,
      description: `Created deal: ${deal.title}`
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ message: 'Failed to create deal' }, { status: 500 });
  }
}