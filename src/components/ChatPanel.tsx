import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { sendChatMessage } from '../api/chat'
import { ApiError } from '../api/client'
import type { ChatSource } from '../api/types'

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  selectedArtifactId: string | null
  selectedArtifactName?: string | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
}

let messageSeq = 0
function nextMessageId(): string {
  messageSeq += 1
  return `msg-${messageSeq}`
}

export function ChatPanel({
  open,
  onClose,
  selectedArtifactId,
  selectedArtifactName,
}: ChatPanelProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | undefined>()
  // Default: search all uploaded docs. User can opt into artifact scope.
  const [scopeToArtifact, setScopeToArtifact] = useState(false)

  useEffect(() => {
    if (!open) return
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [messages, pending])

  if (!open) return null

  const canScope = Boolean(selectedArtifactId)
  const scoped = canScope && scopeToArtifact

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || pending) return

    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      content: message,
    }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setPending(true)
    setError(null)

    try {
      const response = await sendChatMessage({
        message,
        artifactIds: scoped && selectedArtifactId ? [selectedArtifactId] : undefined,
        conversationId,
      })
      if (response.conversationId) setConversationId(response.conversationId)
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
        },
      ])
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not send message')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="chat-drawer-backdrop" onClick={onClose}>
      <aside
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-drawer-head">
          <div>
            <h2 id={titleId}>Ask docs</h2>
            <p className="chat-drawer-sub">Answers grounded in uploaded documents.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {canScope && (
          <div className="chat-scope">
            <button
              type="button"
              className={`chat-scope-chip${scoped ? ' active' : ''}`}
              aria-pressed={scoped}
              onClick={() => setScopeToArtifact((value) => !value)}
            >
              This artifact only
              {selectedArtifactName ? `: ${selectedArtifactName}` : ''}
            </button>
          </div>
        )}

        <div className="chat-messages" ref={listRef} aria-live="polite">
          {messages.length === 0 && !pending && (
            <p className="contents-empty">
              Ask a question about program docs. Replies cite matching file excerpts when
              found; otherwise you&apos;ll see that it is not in uploaded documents.
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble chat-bubble-${message.role}`}
            >
              <p>{message.content}</p>
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <ul className="chat-sources">
                  {message.sources.map((source, index) => (
                    <li key={`${source.fileId}-${source.chunkIndex}-${index}`}>
                      <b>{source.filename}</b>
                      <span className="chat-source-excerpt">{source.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {pending && <p className="chat-pending">Thinking…</p>}
        </div>

        {error && (
          <p className="form-error form-error-general" role="alert">
            {error}
          </p>
        )}

        <form className="chat-composer" onSubmit={(event) => void handleSubmit(event)}>
          <label className="sr-only" htmlFor="chat-message-input">
            Message
          </label>
          <textarea
            id="chat-message-input"
            ref={inputRef}
            rows={3}
            value={draft}
            disabled={pending}
            placeholder="Ask about uploaded docs…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={pending || !draft.trim()}
          >
            {pending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </aside>
    </div>
  )
}
