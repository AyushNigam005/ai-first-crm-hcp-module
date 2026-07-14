import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Send, Loader2, Sparkles, Check, X } from 'lucide-react'
import { sendChatMessage, confirmExtractedInteraction, dismissExtraction } from '../../redux/slices/chatSlice'

const SAMPLE = 'I met Dr Sharma today. We discussed Insulin X. He is interested. Please remind me to visit him next month.'

export default function ChatWindow({ onSaved }) {
  const dispatch = useDispatch()
  const { messages, pendingExtraction, sessionId, status } = useSelector((s) => s.chat)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingExtraction])

  const handleSend = async (text) => {
    const message = (text ?? input).trim()
    if (!message) return
    setInput('')
    await dispatch(sendChatMessage({ message, session_id: sessionId }))
  }

  const handleConfirm = async () => {
    const result = await dispatch(confirmExtractedInteraction({ session_id: sessionId, extracted: pendingExtraction }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Interaction saved to CRM')
      onSaved?.(result.payload)
    } else {
      toast.error(result.payload || 'Failed to save')
    }
  }

  return (
    <div className="card flex flex-col h-[560px]">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-600" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">AI Interaction Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-3">
            <p>Describe your HCP meeting in natural language and I'll extract the details automatically.</p>
            <button
              onClick={() => handleSend(SAMPLE)}
              className="text-brand-600 dark:text-brand-400 underline underline-offset-2 text-left"
            >
              Try: "{SAMPLE}"
            </button>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pendingExtraction && (
          <div className="card p-4 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2 uppercase tracking-wide">Extracted details — review before saving</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
              <dt className="text-slate-500">Doctor</dt><dd className="text-slate-800 dark:text-slate-100">{pendingExtraction.doctor_name || '—'}</dd>
              <dt className="text-slate-500">Hospital</dt><dd className="text-slate-800 dark:text-slate-100">{pendingExtraction.hospital || '—'}</dd>
              <dt className="text-slate-500">Specialty</dt><dd className="text-slate-800 dark:text-slate-100">{pendingExtraction.specialty || '—'}</dd>
              <dt className="text-slate-500">Products</dt><dd className="text-slate-800 dark:text-slate-100">{pendingExtraction.products?.join(', ') || '—'}</dd>
              <dt className="text-slate-500">Follow-up</dt><dd className="text-slate-800 dark:text-slate-100">{pendingExtraction.follow_up || '—'}</dd>
              <dt className="text-slate-500">Sentiment</dt><dd className="text-slate-800 dark:text-slate-100 capitalize">{pendingExtraction.sentiment || '—'}</dd>
            </dl>
            <div className="flex gap-2">
              <button onClick={handleConfirm} className="btn-primary flex-1"><Check size={16} /> Confirm &amp; Save</button>
              <button onClick={() => dispatch(dismissExtraction())} className="btn-secondary"><X size={16} /></button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="e.g. Met Dr Rao, discussed CardioX, he wants literature..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={() => handleSend()} disabled={status === 'loading'} className="btn-primary px-3.5">
          {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
