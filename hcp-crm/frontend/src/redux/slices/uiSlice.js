import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, globalError: null },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setGlobalError(state, action) { state.globalError = action.payload },
    clearGlobalError(state) { state.globalError = null },
  },
})

export const { toggleSidebar, setGlobalError, clearGlobalError } = uiSlice.actions
export default uiSlice.reducer
