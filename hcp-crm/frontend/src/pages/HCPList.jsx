import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { fetchHcps } from '../redux/slices/hcpSlice'
import { ListSkeleton } from '../components/common/Skeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'

export default function HCPList() {
  const dispatch = useDispatch()
  const { list, status } = useSelector((s) => s.hcp)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchHcps({ search: search || undefined, page, page_size: 12 }))
    }, 300)
    return () => clearTimeout(timeout)
  }, [dispatch, search, page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Healthcare Professionals</h1>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {status === 'loading' ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="No HCPs found" description="Try a different search, or log a new interaction to add one." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((hcp) => (
            <Link key={hcp.id} to={`/hcps/${hcp.id}`} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-semibold">
                  {hcp.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{hcp.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{hcp.specialty || 'Specialty unknown'}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                {hcp.hospital && <p>🏥 {hcp.hospital}</p>}
                {hcp.city && <p>📍 {hcp.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <button className="btn-secondary" onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}
