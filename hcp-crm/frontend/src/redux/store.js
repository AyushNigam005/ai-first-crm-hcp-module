import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import hcpReducer from './slices/hcpSlice'
import interactionsReducer from './slices/interactionsSlice'
import chatReducer from './slices/chatSlice'
import themeReducer from './slices/themeSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hcp: hcpReducer,
    interactions: interactionsReducer,
    chat: chatReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
})
