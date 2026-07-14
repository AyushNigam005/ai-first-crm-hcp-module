import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Stethoscope, Loader2 } from 'lucide-react'
import { login, register } from '../redux/slices/authSlice'

export default function Login() {
  const [mode, setMode] = useState('login')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status } = useSelector((s) => s.auth)
  const { register: field, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (values) => {
    const action = mode === 'login' ? login(values) : register(values)
    const result = await dispatch(action)
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
      navigate('/')
    } else {
      toast.error(result.payload || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mb-3">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI-First CRM</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">HCP Interaction Module</p>
        </div>

        <div className="card p-6">
          <div className="flex mb-6 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-sm font-medium">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md capitalize transition-colors ${
                  mode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label-text">Full name</label>
                <input className="input-field" placeholder="Jane Doe" {...field('full_name', { required: true })} />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">Full name is required</p>}
              </div>
            )}
            <div>
              <label className="label-text">Email</label>
              <input className="input-field" type="email" placeholder="you@company.com" {...field('email', { required: true })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">Email is required</p>}
            </div>
            <div>
              <label className="label-text">Password</label>
              <input className="input-field" type="password" placeholder="••••••••" {...field('password', { required: true, minLength: 6 })} />
              {errors.password && <p className="text-xs text-red-500 mt-1">Min 6 characters</p>}
            </div>
            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full mt-2">
              {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
