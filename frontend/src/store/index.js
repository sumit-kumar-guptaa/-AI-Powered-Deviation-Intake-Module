import { configureStore } from '@reduxjs/toolkit'
import deviationReducer from './deviationSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    deviations: deviationReducer,
    ui: uiReducer,
  },
})

export const RootState = store.getState
export const AppDispatch = store.dispatch