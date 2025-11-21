import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await db.execute(sql`BEGIN`);

    const insertResult = await db.execute(sql`
      INSERT INTO archived_users (source_user_id, username, email, password, name, role, created_at, updated_at)
      SELECT id, username, email, password, name, role, created_at, updated_at FROM users
    `);

    const deactivateResult = await db.execute(sql`
      UPDATE users SET active = false, deactivated_at = now()
    `);

    const archivedCountRes = await db.execute(sql`SELECT COUNT(*) AS count FROM archived_users`);
    const inactiveCountRes = await db.execute(sql`SELECT COUNT(*) AS count FROM users WHERE active = false`);

    await db.execute(sql`COMMIT`);

    return NextResponse.json({
      archivedInserted: (insertResult as any)?.rowCount ?? null,
      usersDeactivated: (deactivateResult as any)?.rowCount ?? null,
      archivedTotal: Number((archivedCountRes as any).rows?.[0]?.count ?? 0),
      inactiveUsersTotal: Number((inactiveCountRes as any).rows?.[0]?.count ?? 0),
    });
  } catch (error) {
    await db.execute(sql`ROLLBACK`);
    return NextResponse.json({ message: 'Archival failed' }, { status: 500 });
  }
}