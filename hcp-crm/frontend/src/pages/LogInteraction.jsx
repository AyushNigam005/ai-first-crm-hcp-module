import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, MessageSquare } from 'lucide-react'
import InteractionForm from '../components/interaction/InteractionForm.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'

export default function LogInteraction() {
  const [mode, setMode] = useState('form')
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Log Interaction</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Record an HCP visit using a structured form or by chatting naturally with the AI assistant.
        </p>
      </div>

      <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-sm font-medium">
        <button
          onClick={() => setMode('form')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            mode === 'form' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
          }`}
        >
          <ClipboardList size={16} /> Structured Form
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            mode === 'chat' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
          }`}
        >
          <MessageSquare size={16} /> AI Chat
        </button>
      </div>

      {mode === 'form' ? (
        <InteractionForm onSaved={() => navigate('/hcps')} />
      ) : (
        <ChatWindow onSaved={() => navigate('/hcps')} />
      )}
    </div>
  )
}
