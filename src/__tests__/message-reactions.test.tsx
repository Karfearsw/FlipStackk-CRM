import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageReactions } from '../components/communication/message-reactions.tsx'
import { vi } from 'vitest'
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: '1' } }, status: 'authenticated' }),
}))

describe('MessageReactions', () => {
  const mockMessageId = 1
  const mockReactions = [
    { emoji: '👍', count: 2, userIds: [1, 2] },
    { emoji: '❤️', count: 1, userIds: [3] },
    { emoji: '😄', count: 1, userIds: [2] },
  ]
  let onAddReaction: any
  let onRemoveReaction: any

  beforeEach(() => {
    vi.clearAllMocks()
    onAddReaction = vi.fn().mockResolvedValue(undefined)
    onRemoveReaction = vi.fn().mockResolvedValue(undefined)
  })

  it('should render reactions correctly', () => {
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    const thumbs = screen.getByText('👍')
    const heart = screen.getByText('❤️')
    const smile = screen.getByText('😄')
    expect(thumbs).toBeInTheDocument()
    expect(heart).toBeInTheDocument()
    expect(smile).toBeInTheDocument()
    expect(thumbs.closest('button')?.querySelector('.font-medium')?.textContent).toBe('2')
    expect(heart.closest('button')?.querySelector('.font-medium')?.textContent).toBe('1')
    expect(smile.closest('button')?.querySelector('.font-medium')?.textContent).toBe('1')
  })

  it('should show add reaction button', () => {
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    expect(screen.getByRole('button', { name: 'Add reaction' })).toBeInTheDocument()
  })

  it('should open emoji picker when add reaction button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    const addButton = screen.getByRole('button', { name: 'Add reaction' })
    await user.click(addButton)

    // Emoji picker should be visible (assuming it has some common emojis)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('should handle reaction click when user has not reacted', async () => {
    const user = userEvent.setup()
    
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    // Click on ❤️ reaction (which user has not reacted to)
    const heartReaction = screen.getByText('❤️').closest('button')
    if (heartReaction) {
      await user.click(heartReaction)
    }

    expect(onAddReaction).toHaveBeenCalledWith('❤️')
  })

  it('should handle reaction click when user has already reacted', async () => {
    const user = userEvent.setup()
    
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    // Click on 👍 reaction (which user has already reacted to)
    const thumbsUpReaction = screen.getByText('👍').closest('button')
    if (thumbsUpReaction) {
      await user.click(thumbsUpReaction)
    }

    // Should call remove reaction since user has already reacted
    expect(onRemoveReaction).toHaveBeenCalledWith('👍')
  })

  // Loading and error states are not handled by this component

  it('should expose tooltip via title on hover', async () => {
    const user = userEvent.setup()
    
    render(
      <MessageReactions 
        messageId={mockMessageId}
        reactions={mockReactions}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    )

    // Mock the tooltip functionality
    const thumbsUpButton = screen.getByText('👍').closest('button')
    if (thumbsUpButton) {
      await user.hover(thumbsUpButton)
    }

    // Tooltip is provided via the title attribute
    await waitFor(() => {
      const btn = screen.getByText('👍').closest('button')
      expect(btn).toHaveAttribute('title')
    })
  })

  // Mutation pending state is internal to add-reaction; reaction buttons remain active
})