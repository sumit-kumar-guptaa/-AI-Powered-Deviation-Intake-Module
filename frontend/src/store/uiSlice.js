import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    activeTab: 'form',
    aiPanelOpen: true,
    notifications: [],
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
    },
    toggleAIPanel: (state) => {
      state.aiPanelOpen = !state.aiPanelOpen
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
  },
})

export const {
  toggleSidebar,
  setActiveTab,
  toggleAIPanel,
  addNotification,
  removeNotification,
} = uiSlice.actions

export default uiSlice.reducer