import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MarketingAutomationEngine } from '../engine'
import { storage } from '@/lib/storage'

vi.mock('@/lib/storage', async (orig) => {
  const actual = await (orig as any).default?.() || (await import('../../storage'))
  return {
    ...actual,
    storage: {
      getLead: vi.fn(async (id: number) => ({ id, ownerPhone: '+1234567890', ownerEmail: 'lead@example.com', ownerName: 'Lead', propertyAddress: '123 Main St' })),
      updateLead: vi.fn(async () => ({})),
      createActivity: vi.fn(async () => ({})),
    },
  }
})

describe('MarketingAutomationEngine', () => {
  let engine: MarketingAutomationEngine

  beforeEach(() => {
    engine = new MarketingAutomationEngine()
    vi.clearAllMocks()
  })

  it('registers and triggers an active workflow', async () => {
    const workflow = {
      id: 'wf1',
      name: 'Welcome',
      description: 'Welcome workflow',
      trigger: { type: 'lead_created' },
      conditions: [],
      actions: [
        { id: 'a1', type: 'send_sms', config: { message: 'Hello' } },
      ],
      settings: { allowReentry: true, exitOnConversion: false, maxExecutionsPerLead: 3 },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await engine.registerWorkflow(workflow)
    const exec = await engine.triggerWorkflow('wf1', '1', { source: 'seed' })
    expect(exec.workflowId).toBe('wf1')
    expect(exec.id).toMatch(/^exec_/)
  })

  it('throws for missing workflow', async () => {
    await expect(engine.triggerWorkflow('missing', '1')).rejects.toThrow(/Workflow not found/)
  })

  it('throws for inactive workflow', async () => {
    const workflow = {
      id: 'wf2',
      name: 'Inactive',
      description: '',
      trigger: { type: 'manual' },
      conditions: [],
      actions: [],
      settings: { allowReentry: true, exitOnConversion: false, maxExecutionsPerLead: 1 },
      status: 'paused',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await engine.registerWorkflow(workflow)
    await expect(engine.triggerWorkflow('wf2', '1')).rejects.toThrow(/not active/)
  })

  it('executes send_email and send_sms actions via providers', async () => {
    const workflow = {
      id: 'wf3',
      name: 'Multi',
      description: '',
      trigger: { type: 'manual' },
      conditions: [],
      actions: [
        { id: 'e1', type: 'send_email', config: { subject: 'Welcome', message: 'Hello' } },
        { id: 's1', type: 'send_sms', config: { message: 'Hi' } },
      ],
      settings: { allowReentry: true, exitOnConversion: false, maxExecutionsPerLead: 5 },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await engine.registerWorkflow(workflow)
    const exec = await engine.triggerWorkflow('wf3', '1', {})
    expect(exec.workflowId).toBe('wf3')
  })

  it('updates lead field with update_field action', async () => {
    const spy = vi.spyOn(storage, 'updateLead') as any
    await (engine as any).executeAction({ id: 'u1', type: 'update_field', config: { field: 'status', value: 'contacted' } }, '1', {})
    expect(spy).toHaveBeenCalled()
  })
})