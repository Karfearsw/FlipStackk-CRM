import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const type = (body.type || 'sms') as 'sms' | 'email' | 'discord';
    const leadId = Number(body.leadId);
    const to = body.to !== undefined ? String(body.to) : '';
    const text = String(body.body || '');
    if (!leadId || !text) {
      return NextResponse.json({ message: 'leadId and body are required' }, { status: 400 });
    }

    let status = 'sent';
    let providerMessageId: string | undefined = undefined;

    if (type === 'sms') {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (sid && token && from) {
        try {
          const client = twilio(sid, token);
          const msg = await client.messages.create({ to, from, body: text });
          providerMessageId = msg.sid;
          status = 'sent';
        } catch (e) {
          status = 'failed';
        }
      } else {
        status = 'failed';
      }
      const comm = await storage.createCommunication({
        leadId,
        type: 'sms',
        direction: 'outbound',
        body: text,
        to,
        from,
        status,
        providerMessageId,
        createdByUserId: Number(session.user.id),
      });
      await storage.createActivity({
        userId: Number(session.user.id),
        actionType: 'sms_send',
        targetType: 'lead',
        targetId: leadId,
        description: status === 'sent' ? `Sent SMS to ${to}` : `Failed to send SMS to ${to}`,
      });
      return NextResponse.json(comm, { status: status === 'sent' ? 201 : 502 });
    }

    if (type === 'discord') {
      const webhook = process.env.DISCORD_WEBHOOK_URL;
      if (webhook) {
        try {
          const res = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
          });
          status = res.ok ? 'sent' : 'failed';
        } catch (e) {
          status = 'failed';
        }
      } else {
        status = 'failed';
      }
      const comm = await storage.createCommunication({
        leadId,
        type: 'discord',
        direction: 'outbound',
        body: text,
        to: 'discord',
        status,
        createdByUserId: Number(session.user.id),
      });
      await storage.createActivity({
        userId: Number(session.user.id),
        actionType: 'discord_send',
        targetType: 'lead',
        targetId: leadId,
        description: status === 'sent' ? 'Sent Discord message' : 'Failed to send Discord message',
      });
      return NextResponse.json(comm, { status: status === 'sent' ? 201 : 502 });
    }

    return NextResponse.json({ message: 'Email sending not implemented' }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to send communication' }, { status: 500 });
  }
}
