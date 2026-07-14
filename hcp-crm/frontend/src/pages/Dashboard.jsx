import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Users, ClipboardList, TrendingUp, MessageSquarePlus } from 'lucide-react'
import { fetchHcps } from '../redux/slices/hcpSlice'
import { fetchInteractions } from '../redux/slices/interactionsSlice'
import { ListSkeleton } from '../components/common/Skeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch()
  const { list: hcps, status: hcpStatus } = useSelector((s) => s.hcp)
  const { list: interactions, status: interactionStatus } = useSelector((s) => s.interactions)

  useEffect(() => {
    dispatch(fetchHcps({ page_size: 50 }))
    dispatch(fetchInteractions({ page_size: 5 }))
  }, [dispatch])

  const followUps = interactions.filter((i) => i.follow_up_date).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your HCP engagement activity</p>
        </div>
        <Link to="/log-interaction" className="btn-primary">
          <MessageSquarePlus size={16} /> Log Interaction
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total HCPs" value={hcps.length} />
        <StatCard icon={ClipboardList} label="Recent Interactions" value={interactions.length} />
        <StatCard icon={TrendingUp} label="Pending Follow-ups" value={followUps} />
      </div>

      <div>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent Interactions</h2>
        {interactionStatus === 'loading' ? (
          <ListSkeleton rows={3} />
        ) : interactions.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No interactions yet"
            description="Log your first HCP interaction using the structured form or the AI chat."
            action={<Link to="/log-interaction" className="btn-primary">Log an Interaction</Link>}
          />
        ) : (
          <div className="space-y-3">
            {interactions.map((i) => (
              <div key={i.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{i.summary || i.products_discussed || 'Interaction'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(i.visit_date).toLocaleDateString()} · {i.outcome} · via {i.source}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                  {i.sentiment}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
