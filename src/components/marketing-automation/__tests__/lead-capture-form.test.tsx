import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadCaptureForm } from '../lead-capture-form'
import { LeadCaptureForm as LeadCaptureFormType } from '@/lib/marketing-automation/types'

describe('LeadCaptureForm', () => {
  const mockForm: LeadCaptureFormType = {
    id: 'test_form',
    name: 'Test Form',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', name: 'name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', name: 'email', required: true },
    ],
    settings: {
      title: 'Test Form Title',
      description: 'This is a test form',
      submitButtonText: 'Submit Form',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Something went wrong. Please try again.',
      enableProgressiveProfiling: false,
      enableDoubleOptIn: false,
      styling: { theme: 'light', primaryColor: '#0066cc', borderRadius: 'md', layout: 'vertical' }
    },
    workflows: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockOnSubmit = vi.fn().mockResolvedValue({ success: true })

  it('renders title, description and fields', () => {
    render(<LeadCaptureForm form={mockForm} onSubmit={mockOnSubmit} />)
    expect(screen.getByText('Test Form Title')).toBeInTheDocument()
    expect(screen.getByText('This is a test form')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('validates required fields and blocks submit', async () => {
    render(<LeadCaptureForm form={mockForm} onSubmit={mockOnSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit Form' }))
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits with valid data', async () => {
    render(<LeadCaptureForm form={mockForm} onSubmit={mockOnSubmit} />)
    await userEvent.type(screen.getByLabelText('Full Name'), 'John Doe')
    await userEvent.type(screen.getByLabelText('Email Address'), 'john@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Submit Form' }))
    await waitFor(() => {
      expect(screen.getByText('Form submitted successfully!')).toBeInTheDocument()
    })
  })
})