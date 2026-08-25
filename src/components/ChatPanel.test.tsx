/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from './ChatPanel'
import { SEED_BRD } from '../test/stubApi'

const sendChatMessage = vi.fn()

vi.mock('../api/chat', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
}))

describe('ChatPanel', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty grounding copy when open', () => {
    render(
      <ChatPanel
        open
        onClose={vi.fn()}
        selectedArtifactId={null}
        selectedArtifactName={null}
      />,
    )

    expect(screen.getByRole('dialog', { name: /ask docs/i })).toBeInTheDocument()
    expect(
      screen.getByText(/answers grounded in uploaded documents/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/ask a question about program docs/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /this artifact only/i })).not.toBeInTheDocument()
  })

  it('shows artifact scope chip and sends scoped chat request when enabled', async () => {
    sendChatMessage.mockResolvedValue({
      answer: 'BRD covers program scope.',
      sources: [
        {
          fileId: 'file-brd',
          artifactId: SEED_BRD.id,
          filename: 'scope.md',
          chunkIndex: 0,
          content: 'Scope, objectives, and success metrics.',
          score: 0.91,
        },
      ],
      conversationId: 'conv-1',
    })

    const user = userEvent.setup()
    render(
      <ChatPanel
        open
        onClose={vi.fn()}
        selectedArtifactId={SEED_BRD.id}
        selectedArtifactName="BRD"
      />,
    )

    const scopeChip = screen.getByRole('button', { name: /this artifact only: brd/i })
    expect(scopeChip).toHaveAttribute('aria-pressed', 'false')
    await user.click(scopeChip)
    expect(scopeChip).toHaveAttribute('aria-pressed', 'true')

    await user.type(screen.getByLabelText(/^message$/i), 'What is in the BRD?')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith({
        message: 'What is in the BRD?',
        artifactIds: [SEED_BRD.id],
        conversationId: undefined,
      })
    })

    expect(await screen.findByText('BRD covers program scope.')).toBeInTheDocument()
    expect(screen.getByText('scope.md')).toBeInTheDocument()
    expect(screen.getByText('Scope, objectives, and success metrics.')).toBeInTheDocument()
  })

  it('searches all docs by default when an artifact is selected', async () => {
    sendChatMessage.mockResolvedValue({
      answer: 'Not in uploaded documents',
      sources: [],
    })

    const user = userEvent.setup()
    render(
      <ChatPanel
        open
        onClose={vi.fn()}
        selectedArtifactId={SEED_BRD.id}
        selectedArtifactName="BRD"
      />,
    )

    expect(screen.getByRole('button', { name: /this artifact only: brd/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await user.type(screen.getByLabelText(/^message$/i), 'Anything about labs?')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith({
        message: 'Anything about labs?',
        artifactIds: undefined,
        conversationId: undefined,
      })
    })
  })

  it('shows API errors with role=alert', async () => {
    const { ApiError } = await import('../api/client')
    sendChatMessage.mockRejectedValue(
      new ApiError(503, 'service_unavailable', 'Gemini is not configured'),
    )

    const user = userEvent.setup()
    render(
      <ChatPanel
        open
        onClose={vi.fn()}
        selectedArtifactId={null}
      />,
    )

    await user.type(screen.getByLabelText(/^message$/i), 'Hello')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Gemini is not configured')
  })
})
