import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Sparkles, FileText, Loader2 } from 'lucide-react'
import { fetchHcpById } from '../redux/slices/hcpSlice'
import { fetchInteractions } from '../redux/slices/interactionsSlice'
import Timeline from '../components/hcp/Timeline.jsx'
import { ListSkeleton } from '../components/common/Skeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import api from '../services/api'

export default function HCPProfile() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { selected: hcp } = useSelector((s) => s.hcp)
  const { list: interactions, status } = useSelector((s) => s.interactions)
  const [aiLoading, setAiLoading] = useState(null) // 'next-action' | 'summary' | null
  const [nextAction, setNextAction] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    dispatch(fetchHcpById(id))
    dispatch(fetchInteractions({ hcp_id: id, page_size: 50 }))
  }, [dispatch, id])

  const runNextAction = async () => {
    setAiLoading('next-action')
    try {
      const { data } = await api.get(`/api/chat/next-action/${id}`)
      setNextAction(data)
    } catch {
      toast.error('Could not generate a suggestion')
    } finally {
      setAiLoading(null)
    }
  }

  const runSummary = async () => {
    setAiLoading('summary')
    try {
      const { data } = await api.get(`/api/chat/followup-summary/${id}`)
      setSummary(data)
    } catch {
      toast.error('Could not generate summary')
    } finally {
      setAiLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xl font-semibold">
          {hcp?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{hcp?.name || 'Loading...'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[hcp?.specialty, hcp?.hospital, hcp?.city].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={runNextAction} disabled={aiLoading} className="card p-4 text-left hover:shadow-md transition-shadow flex items-center gap-3">
          <Sparkles size={18} className="text-brand-600" />
          <div>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">Suggest Next Action</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI recommendation from latest visit</p>
          </div>
          {aiLoading === 'next-action' && <Loader2 size={16} className="animate-spin ml-auto" />}
        </button>
        <button onClick={runSummary} disabled={aiLoading} className="card p-4 text-left hover:shadow-md transition-shadow flex items-center gap-3">
          <FileText size={18} className="text-brand-600" />
          <div>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">Generate Follow-up Summary</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">CRM report from interaction history</p>
          </div>
          {aiLoading === 'summary' && <Loader2 size={16} className="animate-spin ml-auto" />}
        </button>
      </div>

      {nextAction && (
        <div className="card p-4 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-1">Suggested Next Action</p>
          <p className="text-sm text-slate-800 dark:text-slate-100">{nextAction.reply}</p>
          {nextAction.detail?.rationale && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{nextAction.detail.rationale}</p>
          )}
        </div>
      )}

      {summary?.report && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-2">Follow-up Summary Report</p>
          <dl className="text-sm space-y-2">
            <div><dt className="font-medium text-slate-700 dark:text-slate-200">Previous Visit</dt><dd className="text-slate-600 dark:text-slate-300">{summary.report.previous_visit}</dd></div>
            <div><dt className="font-medium text-slate-700 dark:text-slate-200">Discussion</dt><dd className="text-slate-600 dark:text-slate-300">{summary.report.discussion}</dd></div>
            <div><dt className="font-medium text-slate-700 dark:text-slate-200">Products</dt><dd className="text-slate-600 dark:text-slate-300">{summary.report.products?.join(', ')}</dd></div>
            <div><dt className="font-medium text-slate-700 dark:text-slate-200">Objections</dt><dd className="text-slate-600 dark:text-slate-300">{summary.report.objections}</dd></div>
            <div>
              <dt className="font-medium text-slate-700 dark:text-slate-200">Action Items</dt>
              <dd className="text-slate-600 dark:text-slate-300">
                <ul className="list-disc list-inside">
                  {summary.report.action_items?.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Interaction Timeline</h2>
        {status === 'loading' ? (
          <ListSkeleton rows={3} />
        ) : interactions.length === 0 ? (
          <EmptyState title="No interactions logged yet" description="Log a visit with this doctor to see it appear here." />
        ) : (
          <Timeline interactions={interactions} />
        )}
      </div>
    </div>
  )
}
