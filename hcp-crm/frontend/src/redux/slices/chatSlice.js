import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, session_id }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/chat/message', { message, session_id })
      return { message, ...data }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Chat request failed')
    }
  },
)

export const confirmExtractedInteraction = createAsyncThunk(
  'chat/confirm',
  async ({ session_id, extracted }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/chat/confirm', { session_id, extracted })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to save interaction')
    }
  },
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessionId: `session-${Date.now()}`,
    messages: [], // { role, content, intent?, extracted?, requiresConfirmation? }
    pendingExtraction: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    resetSession(state) {
      state.messages = []
      state.pendingExtraction = null
      state.sessionId = `session-${Date.now()}`
    },
    dismissExtraction(state) {
      state.pendingExtraction = null
      state.messages.push({ role: 'assistant', content: 'Draft discarded.' })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.status = 'loading'
        state.messages.push({ role: 'user', content: action.meta.arg.message })
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.messages.push({
          role: 'assistant',
          content: action.payload.reply,
          intent: action.payload.intent,
          toolUsed: action.payload.tool_used,
        })
        if (action.payload.requires_confirmation) {
          state.pendingExtraction = action.payload.extracted
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        state.messages.push({ role: 'assistant', content: `⚠️ ${action.payload}` })
      })
      .addCase(confirmExtractedInteraction.fulfilled, (state) => {
        state.pendingExtraction = null
        state.messages.push({ role: 'assistant', content: '✅ Interaction saved to CRM.' })
      })
  },
})

export const { resetSession, dismissExtraction } = chatSlice.actions
export default chatSlice.reducer
