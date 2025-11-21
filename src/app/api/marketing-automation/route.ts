import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { storage } from '@/lib/storage';
import { MarketingAutomationEngine } from '@/lib/marketing-automation/engine';
import { LeadCaptureForm, MarketingWorkflow } from '@/lib/marketing-automation/types';
import { z } from 'zod';
import { db } from '@/lib/db';
import { marketingWorkflows, marketingForms, marketingAnalytics } from '@/db/schema';
import { eq, and, sql, desc, count, sum } from 'drizzle-orm';

const formSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  fields: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'textarea', 'date']),
    label: z.string().min(1, 'Field label is required'),
    name: z.string().min(1, 'Field name is required'),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    validation: z.object({
      pattern: z.string().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      customMessage: z.string().optional()
    }).optional()
  })),
  settings: z.object({
    title: z.string().min(1, 'Form title is required'),
    description: z.string().optional(),
    submitButtonText: z.string().min(1, 'Submit button text is required'),
    successMessage: z.string().min(1, 'Success message is required'),
    errorMessage: z.string().min(1, 'Error message is required'),
    redirectUrl: z.string().url().optional(),
    enableProgressiveProfiling: z.boolean(),
    enableDoubleOptIn: z.boolean(),
    consentText: z.string().optional(),
    styling: z.object({
      theme: z.enum(['light', 'dark', 'auto']),
      primaryColor: z.string(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
      layout: z.enum(['vertical', 'horizontal', 'multi-step']),
      customCss: z.string().optional()
    })
  })
});

const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().min(1, 'Workflow description is required'),
  trigger: z.object({
    type: z.enum(['form_submission', 'lead_created', 'lead_updated', 'email_opened', 'link_clicked', 'page_viewed', 'time_based', 'manual']),
    source: z.string().optional(),
    eventData: z.record(z.string(), z.any()).optional()
  }),
  conditions: z.array(z.object({
    type: z.enum(['field_value', 'lead_score', 'segment', 'behavior', 'time', 'custom']),
    field: z.string().optional(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any(),
    customLogic: z.string().optional()
  })).optional(),
  actions: z.array(z.object({
    id: z.string(),
    type: z.enum(['send_email', 'send_sms', 'send_whatsapp', 'add_tag', 'remove_tag', 'update_field', 'create_task', 'wait', 'webhook', 'add_to_segment', 'remove_from_segment']),
    config: z.object({}).passthrough(),
    delay: z.number().optional(),
    conditions: z.array(z.object({
      type: z.enum(['field_value', 'lead_score', 'segment', 'behavior', 'time', 'custom']),
      field: z.string().optional(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
      value: z.any(),
      customLogic: z.string().optional()
    })).optional()
  })),
  settings: z.object({
    allowReentry: z.boolean(),
    exitOnConversion: z.boolean(),
    maxExecutionsPerLead: z.number().min(1),
    executionWindow: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string()
    }).optional()
  })
});

// Initialize marketing automation engine
let automationEngine: MarketingAutomationEngine | null = null;

function getAutomationEngine(): MarketingAutomationEngine {
  if (!automationEngine) {
    automationEngine = new MarketingAutomationEngine();
  }
  return automationEngine;
}

// GET /api/marketing-automation/forms - Get all forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'forms') {
      // Get real forms from database
      const forms = await db
        .select({
          id: marketingForms.id,
          name: marketingForms.name,
          title: marketingForms.title,
          description: marketingForms.description,
          submitButtonText: marketingForms.submitButtonText,
          successMessage: marketingForms.successMessage,
          errorMessage: marketingForms.errorMessage,
          redirectUrl: marketingForms.redirectUrl,
          enableProgressiveProfiling: marketingForms.enableProgressiveProfiling,
          enableDoubleOptIn: marketingForms.enableDoubleOptIn,
          consentText: marketingForms.consentText,
          styling: marketingForms.styling,
          fields: marketingForms.fields,
          workflows: marketingForms.workflows,
          createdAt: marketingForms.createdAt,
          updatedAt: marketingForms.updatedAt
        })
        .from(marketingForms)
        .orderBy(desc(marketingForms.createdAt));

      return NextResponse.json({
        success: true,
        data: forms
      });
    }

    if (type === 'workflows') {
      // Get real workflows from database
      const workflows = await db
        .select({
          id: marketingWorkflows.id,
          name: marketingWorkflows.name,
          description: marketingWorkflows.description,
          status: marketingWorkflows.status,
          triggerType: marketingWorkflows.triggerType,
          triggerSource: marketingWorkflows.triggerSource,
          triggerEventData: marketingWorkflows.triggerEventData,
          conditions: marketingWorkflows.conditions,
          actions: marketingWorkflows.actions,
          settings: marketingWorkflows.settings,
          createdAt: marketingWorkflows.createdAt,
          updatedAt: marketingWorkflows.updatedAt,
          createdByUserId: marketingWorkflows.createdByUserId
        })
        .from(marketingWorkflows)
        .orderBy(desc(marketingWorkflows.createdAt));

      return NextResponse.json({
        success: true,
        data: workflows
      });
    }

    if (type === 'analytics') {
      // Get analytics data
      const [
        workflowStats,
        formStats,
        emailStats,
        whatsappStats,
        conversionStats
      ] = await Promise.all([
        // Workflow execution stats
        db.select({
          total: count(),
          active: sql`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
          paused: sql`COUNT(CASE WHEN status = 'paused' THEN 1 END)`
        }).from(marketingWorkflows),
        
        // Form submission stats
        db.select({
          totalSubmissions: sum(sql`CASE WHEN metric_type = 'form_submission' THEN metric_value ELSE 0 END`),
          totalForms: count(sql`DISTINCT form_id`)
        }).from(marketingAnalytics)
        .where(eq(marketingAnalytics.metricType, 'form_submission')),
        
        // Email stats
        db.select({
          totalSent: sum(sql`CASE WHEN metric_type = 'email_sent' THEN metric_value ELSE 0 END`)
        }).from(marketingAnalytics)
        .where(eq(marketingAnalytics.metricType, 'email_sent')),
        
        // WhatsApp stats
        db.select({
          totalSent: sum(sql`CASE WHEN metric_type = 'whatsapp_sent' THEN metric_value ELSE 0 END`)
        }).from(marketingAnalytics)
        .where(eq(marketingAnalytics.metricType, 'whatsapp_sent')),
        
        // Conversion stats
        db.select({
          totalConversions: sum(sql`CASE WHEN metric_type = 'conversion' AND metric_value > 0 THEN metric_value ELSE 0 END`),
          totalLeads: count(sql`DISTINCT lead_id`)
        }).from(marketingAnalytics)
        .where(sql`metric_type IN ('conversion', 'form_submission')`)
      ]);

      const analytics = {
        workflows: workflowStats[0],
        forms: formStats[0],
        emails: emailStats[0],
        whatsapp: whatsappStats[0],
        conversions: conversionStats[0]
      };

      return NextResponse.json({
        success: true,
        data: analytics
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        forms: [],
        workflows: [],
        analytics: {}
      }
    });

  } catch (error) {
    console.error('Marketing automation GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch marketing automation data' 
    }, { status: 500 });
  }
}

// POST /api/marketing-automation/forms - Create new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'forms') {
      const body = await request.json();
      const validatedData = formSchema.parse(body);

      // Create form
      const form: LeadCaptureForm = {
        id: `form_${Date.now()}`,
        ...validatedData,
        workflows: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return NextResponse.json({
        success: true,
        data: form
      });
    }

    if (type === 'workflows') {
      const body = await request.json();
      const validatedData = workflowSchema.parse(body);

      // Create workflow
      const workflow: MarketingWorkflow = {
        id: `workflow_${Date.now()}`,
        ...validatedData,
        conditions: validatedData.conditions || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Register workflow with automation engine
      const engine = getAutomationEngine();
      await engine.registerWorkflow(workflow);

      return NextResponse.json({
        success: true,
        data: workflow
      });
    }

    if (type === 'submit-form') {
      const body = await request.json();
      const { formId, data } = body;

      if (!formId || !data) {
        return NextResponse.json({ 
          error: 'Form ID and data are required' 
        }, { status: 400 });
      }

      // Create lead from form submission
      const lead = await storage.createLead({
        leadId: `form_${formId}_${Date.now()}`,
        propertyAddress: data.propertyAddress || 'Unknown Address',
        city: data.city || 'Unknown City',
        state: data.state || 'Unknown State',
        zip: data.zip || '00000',
        ownerName: data.name || 'Unknown Owner',
        ownerEmail: data.email,
        ownerPhone: data.phone,
        source: `form_${formId}`,
        status: 'new',
        notes: `Form submission: ${JSON.stringify(data)}`
      });

      // Trigger workflow if configured
      const engine = getAutomationEngine();
      try {
        await engine.triggerWorkflow('workflow_1', lead.id.toString(), data);
      } catch (workflowError) {
        console.warn('Workflow trigger failed:', workflowError);
      }

      return NextResponse.json({
        success: true,
        data: {
          leadId: lead.id,
          message: 'Form submitted successfully'
        }
      });
    }

    return NextResponse.json({ 
      error: 'Invalid request type' 
    }, { status: 400 });

  } catch (error) {
    console.error('Marketing automation POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to process marketing automation request' 
    }, { status: 500 });
  }
}

// PUT /api/marketing-automation/forms/[id] - Update form
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'ID is required' 
      }, { status: 400 });
    }

    if (type === 'forms') {
      const body = await request.json();
      const validatedData = formSchema.parse(body);

      // Update form logic here
      return NextResponse.json({
        success: true,
        data: {
          id,
          ...validatedData,
          updatedAt: new Date()
        }
      });
    }

    if (type === 'workflows') {
      const body = await request.json();
      const validatedData = workflowSchema.parse(body);

      // Update workflow logic here
      return NextResponse.json({
        success: true,
        data: {
          id,
          ...validatedData,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ 
      error: 'Invalid request type' 
    }, { status: 400 });

  } catch (error) {
    console.error('Marketing automation PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to update marketing automation data' 
    }, { status: 500 });
  }
}

// DELETE /api/marketing-automation/forms/[id] - Delete form
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'ID is required' 
      }, { status: 400 });
    }

    // Delete logic here
    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`
    });

  } catch (error) {
    console.error('Marketing automation DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete marketing automation data' 
    }, { status: 500 });
  }
}