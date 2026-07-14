import { useState } from 'react'
import { CalendarDays, Pencil } from 'lucide-react'
import EditInteractionModal from '../interaction/EditInteractionModal.jsx'

const OUTCOME_COLORS = {
  interested: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  not_interested: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  needs_follow_up: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  requested_literature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  busy: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export default function Timeline({ interactions }) {
  const [editing, setEditing] = useState(null)

  if (!interactions?.length) return null
  return (
    <>
      <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6">
        {interactions.map((i) => (
          <li key={i.id} className="ml-6">
            <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-950" />
            <div className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarDays size={14} />
                  {new Date(i.visit_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${OUTCOME_COLORS[i.outcome] || OUTCOME_COLORS.neutral}`}>
                    {i.outcome?.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => setEditing(i)}
                    aria-label="Edit interaction"
                    title="Edit interaction"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              {i.products_discussed && (
                <p className="text-sm mt-2 text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Products:</span> {i.products_discussed}
                </p>
              )}
              {i.summary && <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{i.summary}</p>}
              {i.follow_up_date && (
                <p className="text-xs mt-2 text-brand-600 dark:text-brand-400">
                  Follow-up: {new Date(i.follow_up_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <EditInteractionModal
        open={!!editing}
        interaction={editing}
        onClose={() => setEditing(null)}
      />
    </>
  )
}