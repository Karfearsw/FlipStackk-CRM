import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WebhookConfig } from '@/lib/marketing-automation/types';
import { z } from 'zod';

const webhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Valid URL is required'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().min(1).max(5),
    backoffStrategy: z.enum(['linear', 'exponential', 'fixed']),
    initialDelay: z.number().min(1000),
    maxDelay: z.number().min(1000)
  })
});

// Store webhooks in memory for MVP (replace with database in production)
const webhooks = new Map<string, WebhookConfig>();

// GET /api/marketing-automation/webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookArray = Array.from(webhooks.values());
    
    return NextResponse.json({
      success: true,
      data: webhookArray
    });

  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch webhooks' 
    }, { status: 500 });
  }
}

// POST /api/marketing-automation/webhooks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}`,
      ...validatedData,
      secret: validatedData.secret || '',
      headers: validatedData.headers || {},
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    webhooks.set(webhook.id, webhook);

    return NextResponse.json({
      success: true,
      data: webhook
    });

  } catch (error) {
    console.error('Webhook POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to create webhook' 
    }, { status: 500 });
  }
}

// PUT /api/marketing-automation/webhooks/[id]
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Webhook ID is required' 
      }, { status: 400 });
    }

    const existingWebhook = webhooks.get(id);
    if (!existingWebhook) {
      return NextResponse.json({ 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    const updatedWebhook: WebhookConfig = {
      ...existingWebhook,
      ...validatedData,
      headers: validatedData.headers || {},
      updatedAt: new Date()
    };

    webhooks.set(id, updatedWebhook);

    return NextResponse.json({
      success: true,
      data: updatedWebhook
    });

  } catch (error) {
    console.error('Webhook PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to update webhook' 
    }, { status: 500 });
  }
}

// DELETE /api/marketing-automation/webhooks/[id]
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Webhook ID is required' 
      }, { status: 400 });
    }

    const existingWebhook = webhooks.get(id);
    if (!existingWebhook) {
      return NextResponse.json({ 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    webhooks.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    console.error('Webhook DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete webhook' 
    }, { status: 500 });
  }
}

// POST /api/marketing-automation/webhooks/test - Test webhook
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Webhook ID is required' 
      }, { status: 400 });
    }

    const webhook = webhooks.get(id);
    if (!webhook) {
      return NextResponse.json({ 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Test webhook delivery
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery'
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`Webhook test failed: ${response.statusText}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook test successful',
        response: {
          status: response.status,
          statusText: response.statusText
        }
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Webhook test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test webhook' 
    }, { status: 500 });
  }
}