import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/login', { email, password })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/register', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Registration failed')
  }
})

const storedUser = localStorage.getItem('hcp_crm_user')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: localStorage.getItem('hcp_crm_token') || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('hcp_crm_token')
      localStorage.removeItem('hcp_crm_user')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.access_token
        localStorage.setItem('hcp_crm_token', action.payload.access_token)
        localStorage.setItem('hcp_crm_user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.access_token
        localStorage.setItem('hcp_crm_token', action.payload.access_token)
        localStorage.setItem('hcp_crm_user', JSON.stringify(action.payload.user))
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
