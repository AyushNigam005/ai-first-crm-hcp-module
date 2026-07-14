import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchInteractions = createAsyncThunk('interactions/fetchAll', async (params = {}) => {
  const { data } = await api.get('/api/interactions', { params })
  return data
})

export const createInteraction = createAsyncThunk('interactions/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/interactions', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to save interaction')
  }
})

// Edit Interaction — routes through the existing LangGraph edit_interaction tool
// (POST /api/chat/edit/{id}), which parses the instruction and updates the DB row.
export const editInteraction = createAsyncThunk(
  'interactions/editViaAgent',
  async ({ interactionId, message, session_id }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/api/chat/edit/${interactionId}`, { message, session_id })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update interaction')
    }
  },
)

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => { state.status = 'loading' })
      .addCase(fetchInteractions.fulfilled, (state, action) => { state.status = 'succeeded'; state.list = action.payload })
      .addCase(createInteraction.fulfilled, (state, action) => { state.list.unshift(action.payload) })
  },
})

export default interactionsSlice.reducer