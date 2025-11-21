import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { leads } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

function normalize(s: string | null | undefined) {
  return s ? s.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const rows = await db.select().from(leads);
    const byKey: Record<string, any[]> = {};
    for (const row of rows) {
      const addr = normalize(row.propertyAddress);
      const email = normalize(row.ownerEmail);
      const phone = normalize(row.ownerPhone);
      const key1 = addr;
      const key2 = email ? `email:${email}` : '';
      const key3 = phone ? `phone:${phone}` : '';
      for (const k of [key1, key2, key3].filter(Boolean)) {
        byKey[k] = byKey[k] || [];
        byKey[k].push(row);
      }
    }
    const groups = Object.values(byKey).filter(g => g.length > 1);
    const duplicates = groups.map(g => ({
      count: g.length,
      leadIds: g.map(x => x.id),
      sample: g.slice(0, 3),
    }));
    return NextResponse.json(duplicates);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to compute duplicates' }, { status: 500 });
  }
}
