import { useDispatch, useSelector } from 'react-redux'
import { Menu, Sun, Moon, LogOut } from 'lucide-react'
import { toggleSidebar } from '../../redux/slices/uiSlice'
import { toggleTheme } from '../../redux/slices/themeSlice'
import { logout } from '../../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const themeMode = useSelector((s) => s.theme.mode)

  return (
    <header className="h-16 sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Toggle theme"
        >
          {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
            {user?.full_name || 'User'}
          </span>
          <button
            onClick={() => { dispatch(logout()); navigate('/login') }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
