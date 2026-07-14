import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { createInteraction } from '../../redux/slices/interactionsSlice'

const OUTCOMES = ['interested', 'not_interested', 'needs_follow_up', 'requested_literature', 'busy', 'neutral']

export default function InteractionForm({ onSaved }) {
  const dispatch = useDispatch()
  const { status } = useSelector((s) => s.interactions)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (values) => {
    const result = await dispatch(createInteraction(values))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Interaction logged successfully')
      reset()
      onSaved?.(result.payload)
    } else {
      toast.error(result.payload || 'Failed to save interaction')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-text">Doctor Name *</label>
          <input className="input-field" placeholder="Dr. Priya Sharma" {...register('hcp_name', { required: true })} />
          {errors.hcp_name && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>
        <div>
          <label className="label-text">Specialty</label>
          <input className="input-field" placeholder="Endocrinology" {...register('specialty')} />
        </div>
        <div>
          <label className="label-text">Hospital</label>
          <input className="input-field" placeholder="Apollo Hospital" {...register('hospital')} />
        </div>
        <div>
          <label className="label-text">City</label>
          <input className="input-field" placeholder="Mumbai" {...register('city')} />
        </div>
        <div>
          <label className="label-text">Visit Date</label>
          <input type="date" className="input-field" {...register('visit_date')} />
        </div>
        <div>
          <label className="label-text">Follow-up Date</label>
          <input type="date" className="input-field" {...register('follow_up_date')} />
        </div>
        <div>
          <label className="label-text">Products Discussed</label>
          <input className="input-field" placeholder="Insulin X, Cardiotab" {...register('products_discussed')} />
        </div>
        <div>
          <label className="label-text">Outcome</label>
          <select className="input-field" {...register('outcome')}>
            {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label-text">Notes</label>
        <textarea className="input-field" rows={4} placeholder="What was discussed, objections raised, next steps..." {...register('notes')} />
      </div>
      <button type="submit" disabled={status === 'loading'} className="btn-primary">
        {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
        Save Interaction
      </button>
    </form>
  )
}
