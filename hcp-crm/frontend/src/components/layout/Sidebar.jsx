import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, MessageSquarePlus, Stethoscope } from 'lucide-react'
import { useSelector } from 'react-redux'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/hcps', label: 'HCPs', icon: Users },
  { to: '/log-interaction', label: 'Log Interaction', icon: MessageSquarePlus },
]

export default function Sidebar() {
  const open = useSelector((s) => s.ui.sidebarOpen)

  return (
    <aside
      className={`${open ? 'w-64' : 'w-0 md:w-20'} shrink-0 overflow-hidden transition-all duration-200
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col`}
    >
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0">
          <Stethoscope size={18} />
        </div>
        {open && <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">HCP CRM</span>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`
            }
          >
            <Icon size={18} className="shrink-0" />
            {open && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
