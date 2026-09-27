import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

export const fetchDeviations = createAsyncThunk(
  'deviations/fetchAll',
  async ({ skip = 0, limit = 100, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip)
      params.append('limit', limit)
      if (status) params.append('status', status)
      const response = await api.get(`/deviations?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch deviations')
    }
  }
)

export const fetchDeviation = createAsyncThunk(
  'deviations/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/deviations/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch deviation')
    }
  }
)

export const createDeviation = createAsyncThunk(
  'deviations/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/deviations', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create deviation')
    }
  }
)

export const updateDeviation = createAsyncThunk(
  'deviations/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/deviations/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update deviation')
    }
  }
)

export const deleteDeviation = createAsyncThunk(
  'deviations/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/deviations/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete deviation')
    }
  }
)

export const extractDeviationInfo = createAsyncThunk(
  'deviations/extract',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/extract', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to extract information')
    }
  }
)

export const extractDeviationFromFile = createAsyncThunk(
  'deviations/extractFile',
  async ({ file, additionalText }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('additional_text', additionalText)
      const response = await api.post('/ai/extract-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to extract from file')
    }
  }
)

export const assessImpact = createAsyncThunk(
  'deviations/assessImpact',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/assess-impact', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to assess impact')
    }
  }
)

export const chatWithAI = createAsyncThunk(
  'deviations/chat',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/chat', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to chat with AI')
    }
  }
)

const deviationSlice = createSlice({
  name: 'deviations',
  initialState: {
    items: [],
    current: null,
    total: 0,
    loading: false,
    error: null,
    aiLoading: false,
    aiError: null,
    extractedData: null,
    extractionConfidence: 0,
    impactAssessment: null,
    chatMessages: [],
  },
  reducers: {
    setExtractedData: (state, action) => {
      state.extractedData = action.payload
    },
    clearExtractedData: (state) => {
      state.extractedData = null
      state.extractionConfidence = 0
    },
    setImpactAssessment: (state, action) => {
      state.impactAssessment = action.payload
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload)
    },
    clearChatMessages: (state) => {
      state.chatMessages = []
    },
    clearErrors: (state) => {
      state.error = null
      state.aiError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeviations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeviations.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
      })
      .addCase(fetchDeviations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchDeviation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeviation.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(fetchDeviation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createDeviation.pending, (state) => {
        state.loading = true
      })
      .addCase(createDeviation.fulfilled, (state, action) => {
        state.loading = false
        state.items.unshift(action.payload)
        state.total += 1
        state.current = action.payload
      })
      .addCase(createDeviation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateDeviation.pending, (state) => {
        state.loading = true
      })
      .addCase(updateDeviation.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex(d => d.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
        state.current = action.payload
      })
      .addCase(updateDeviation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(extractDeviationInfo.pending, (state) => {
        state.aiLoading = true
        state.aiError = null
      })
      .addCase(extractDeviationInfo.fulfilled, (state, action) => {
        state.aiLoading = false
        state.extractedData = action.payload.extracted_data
        state.extractionConfidence = action.payload.confidence
      })
      .addCase(extractDeviationInfo.rejected, (state, action) => {
        state.aiLoading = false
        state.aiError = action.payload
      })
      .addCase(extractDeviationFromFile.pending, (state) => {
        state.aiLoading = true
        state.aiError = null
      })
      .addCase(extractDeviationFromFile.fulfilled, (state, action) => {
        state.aiLoading = false
        state.extractedData = action.payload.extracted_data
        state.extractionConfidence = action.payload.confidence
      })
      .addCase(extractDeviationFromFile.rejected, (state, action) => {
        state.aiLoading = false
        state.aiError = action.payload
      })
      .addCase(assessImpact.pending, (state) => {
        state.aiLoading = true
        state.aiError = null
      })
      .addCase(assessImpact.fulfilled, (state, action) => {
        state.aiLoading = false
        state.impactAssessment = action.payload
      })
      .addCase(assessImpact.rejected, (state, action) => {
        state.aiLoading = false
        state.aiError = action.payload
      })
      .addCase(chatWithAI.pending, (state) => {
        state.aiLoading = true
      })
      .addCase(chatWithAI.fulfilled, (state, action) => {
        state.aiLoading = false
        state.chatMessages.push({ role: 'assistant', content: action.payload.response })
      })
      .addCase(chatWithAI.rejected, (state, action) => {
        state.aiLoading = false
        state.aiError = action.payload
      })
      .addCase(deleteDeviation.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteDeviation.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter(d => d.id !== action.payload)
        state.total -= 1
        if (state.current?.id === action.payload) {
          state.current = null
        }
      })
      .addCase(deleteDeviation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  setExtractedData,
  clearExtractedData,
  setImpactAssessment,
  addChatMessage,
  clearChatMessages,
  clearErrors,
} = deviationSlice.actions

export default deviationSlice.reducer