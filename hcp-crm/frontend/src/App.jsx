import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AppLayout from './components/layout/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HCPList from './pages/HCPList.jsx'
import HCPProfile from './pages/HCPProfile.jsx'
import LogInteraction from './pages/LogInteraction.jsx'

function ProtectedRoute({ children }) {
  const token = useSelector((s) => s.auth.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const themeMode = useSelector((s) => s.theme.mode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
  }, [themeMode])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="hcps" element={<HCPList />} />
        <Route path="hcps/:id" element={<HCPProfile />} />
        <Route path="log-interaction" element={<LogInteraction />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
