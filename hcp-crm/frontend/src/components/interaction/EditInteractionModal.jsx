import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import { editInteraction, fetchInteractions } from '../../redux/slices/interactionsSlice'

const OUTCOMES = ['interested', 'not_interested', 'needs_follow_up', 'requested_literature', 'busy', 'neutral']

function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function EditInteractionModal({ open, onClose, interaction }) {
  const dispatch = useDispatch()
  const [notes, setNotes] = useState('')
  const [products, setProducts] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [outcome, setOutcome] = useState('neutral')
  const [saving, setSaving] = useState(false)

  // Re-hydrate the form whenever a new interaction is opened for editing.
  useEffect(() => {
    if (interaction) {
      setNotes(interaction.notes || '')
      setProducts(interaction.products_discussed || '')
      setFollowUp(toDateInputValue(interaction.follow_up_date))
      setOutcome(interaction.outcome || 'neutral')
    }
  }, [interaction])

  if (!interaction) return null

  const handleSave = async () => {
    setSaving(true)

    // The backend's Edit Interaction tool (LangGraph node) expects a natural-language
    // correction instruction, which it parses into structured field changes before
    // updating the row. We state every field explicitly so the parser has an
    // unambiguous instruction for each one, regardless of what actually changed.
    const message = [
      `Update the notes to exactly: "${notes || 'No notes.'}".`,
      `Update the products discussed to exactly: "${products || 'None'}".`,
      followUp ? `Set the follow-up date to exactly ${followUp} (format YYYY-MM-DD).` : '',
      `Set the outcome to exactly "${outcome}".`,
    ].filter(Boolean).join(' ')

    const result = await dispatch(
      editInteraction({
        interactionId: interaction.id,
        message,
        session_id: `edit-interaction-${interaction.id}`,
      }),
    )

    if (result.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchInteractions({ hcp_id: interaction.hcp_id, page_size: 50 }))
      toast.success('Interaction updated successfully')
      onClose()
    } else {
      toast.error(result.payload || 'Failed to update interaction')
    }
    setSaving(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Interaction"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-text">Products Discussed</label>
          <input
            className="input-field"
            placeholder="Insulin X, Cardiotab"
            value={products}
            onChange={(e) => setProducts(e.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Follow-up Date</label>
          <input
            type="date"
            className="input-field"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Outcome</label>
          <select className="input-field" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">Notes</label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="What was discussed, objections raised, next steps..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}