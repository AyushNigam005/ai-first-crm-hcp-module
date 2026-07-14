import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchHcps = createAsyncThunk('hcp/fetchAll', async (params = {}) => {
  const { data } = await api.get('/api/hcps', { params })
  return data
})

export const fetchHcpById = createAsyncThunk('hcp/fetchOne', async (id) => {
  const { data } = await api.get(`/api/hcps/${id}`)
  return data
})

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: { list: [], selected: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHcps.pending, (state) => { state.status = 'loading' })
      .addCase(fetchHcps.fulfilled, (state, action) => { state.status = 'succeeded'; state.list = action.payload })
      .addCase(fetchHcps.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message })
      .addCase(fetchHcpById.fulfilled, (state, action) => { state.selected = action.payload })
  },
})

export default hcpSlice.reducer
