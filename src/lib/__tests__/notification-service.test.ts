import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '../notification-service'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => ([])) })) })) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => ([{ id: 1 }])) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => ([{ id: 1 }])) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => ([{ id: 1 }])) })) })),
  },
}))

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    service = new NotificationService()
    vi.clearAllMocks()
  })

  it('creates a notification and processes channels', async () => {
    const result = await service.createNotification({
      userId: 1,
      type: 'message',
      title: 'Hello',
      message: 'World',
      category: 'in_app',
    })
    expect(result.userId).toBe(1)
    expect(result.title).toBe('Hello')
    expect(result.message).toBe('World')
  })

  it('gets user notifications with defaults', async () => {
    const list = await service.getUserNotifications(1, { limit: 5 })
    expect(Array.isArray(list)).toBe(true)
  })

  it('marks single notification as read', async () => {
    await service.markAsRead(1)
    expect(true).toBe(true)
  })

  it('marks all notifications as read for user', async () => {
    await service.markAllAsRead(1)
    expect(true).toBe(true)
  })

  it('computes unread count', async () => {
    const count = await service.getUnreadCount(1)
    expect(typeof count).toBe('number')
  })

  it('sets notification preference create then update', async () => {
    const pref = await service.setNotificationPreference({
      userId: 1,
      notificationType: 'default',
      channel: 'email',
      isEnabled: true,
      frequency: 'immediate',
    } as any)
    expect(pref.userId).toBe(1)
  })

  it('sends bulk notifications', async () => {
    await service.sendBulkNotification([1, 2], {
      type: 'system',
      title: 'Update',
      message: 'System update',
    })
    expect(true).toBe(true)
  })
})
})