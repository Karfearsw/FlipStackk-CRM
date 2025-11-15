import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const users = await storage.getUsers();
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const teamMember = await storage.getTeamMember(user.id);
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          totalCalls: teamMember?.totalCalls || 0,
          totalLeadsConverted: teamMember?.totalLeadsConverted || 0,
          totalRevenueGenerated: teamMember?.totalRevenueGenerated || "0",
          currentDealsValue: teamMember?.currentDealsValue || "0",
          lastActivityAt: teamMember?.lastActivityAt || null,
        };
      })
    );
    
    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { message: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
