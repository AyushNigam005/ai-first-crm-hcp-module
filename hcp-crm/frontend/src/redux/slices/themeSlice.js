import { createSlice } from '@reduxjs/toolkit'

const stored = localStorage.getItem('hcp_crm_theme') || 'light'

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: stored },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
      localStorage.setItem('hcp_crm_theme', state.mode)
    },
  },
})

export const { toggleTheme } = themeSlice.actions
export default themeSlice.reducer
