import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import {
  FileText, Calendar, Hash, Package, Truck, User, AlertTriangle,
  Loader2, CheckCircle, AlertCircle, Info, Save, Edit3, Check, X, Sparkles, Trash2
} from 'lucide-react'
import { updateDeviation, fetchDeviation, clearExtractedData, clearChatMessages } from '../store/deviationSlice'
import { clsx } from 'clsx'

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  MAJOR: 'bg-orange-100 text-orange-800 border-orange-200',
  MINOR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  UNDER_INVESTIGATION: 'bg-purple-100 text-purple-800 border-purple-200',
  CLOSED: 'bg-green-100 text-green-800 border-green-200',
}

const severityOptions = [
  { value: 'CRITICAL', label: 'Critical', description: 'Direct impact on product quality/patient safety' },
  { value: 'MAJOR', label: 'Major', description: 'Significant impact on quality systems' },
  { value: 'MINOR', label: 'Minor', description: 'Minimal quality impact, easily correctable' },
]

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
  { value: 'CLOSED', label: 'Closed' },
]

const formFields = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Brief description of the deviation' },
  { name: 'batch_number', label: 'Batch Number', type: 'text', placeholder: 'e.g., BATCH-2024-001' },
  { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'Product name or code' },
  { name: 'process_step', label: 'Process Step', type: 'text', placeholder: 'Manufacturing step where deviation occurred' },
  { name: 'equipment_id', label: 'Equipment ID', type: 'text', placeholder: 'Equipment identifier' },
  { name: 'deviation_date', label: 'Deviation Date', type: 'date' },
  { name: 'reported_by', label: 'Reported By', type: 'text', placeholder: 'Person reporting the deviation' },
  { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Detailed description of what happened...' },
  { name: 'severity', label: 'Severity', type: 'select', options: severityOptions },
  { name: 'impact_assessment', label: 'Impact Assessment', type: 'textarea', placeholder: 'Assessment of impact on product quality, patient safety, regulatory compliance...' },
  { name: 'root_cause', label: 'Root Cause', type: 'textarea', placeholder: 'Root cause analysis...' },
  { name: 'corrective_action', label: 'Corrective Action', type: 'textarea', placeholder: 'Immediate corrective actions taken...' },
  { name: 'preventive_action', label: 'Preventive Action', type: 'textarea', placeholder: 'Preventive actions to prevent recurrence...' },
]

export default function DeviationForm() {
  const dispatch = useDispatch()
  const { current, loading, aiLoading, extractedData, impactAssessment, extractionConfidence, error } = useSelector(
    (state) => state.deviations
  )
  const [showAIReview, setShowAIReview] = useState(false)
  const [reviewDecisions, setReviewDecisions] = useState({})

  // Fetch deviation only when ID changes
  useEffect(() => {
    if (current?.id) {
      dispatch(fetchDeviation(current.id))
    }
  }, [current?.id, dispatch])

  // Don't auto-show AI review - let user trigger it from AI panel
  const handleAcceptAll = () => {
    if (!extractedData || !current) return
    Object.keys(extractedData).forEach(field => {
      const suggestion = getAISuggestion(field)
      if (suggestion) {
        handleChange(field, suggestion)
      }
    })
    setReviewDecisions(prev => {
      const next = { ...prev }
      Object.keys(extractedData).forEach(field => {
        if (getAISuggestion(field)) next[field] = 'accepted'
      })
      return next
    })
    setShowAIReview(false)
  }

  const getAISuggestion = (field) => {
    if (!extractedData) return null
    const value = extractedData[field]
    return value ? String(value) : null
  }

  const hasAISuggestion = (field) => {
    return getAISuggestion(field) !== null
  }

  const acceptField = (field) => {
    const suggestion = getAISuggestion(field)
    if (suggestion && current) {
      handleChange(field, suggestion)
      setReviewDecisions(prev => ({ ...prev, [field]: 'accepted' }))
    }
  }

  const rejectField = (field) => {
    setReviewDecisions(prev => ({ ...prev, [field]: 'rejected' }))
  }

  const handleChange = (field, value) => {
    if (current) {
      dispatch(updateDeviation({ id: current.id, data: { [field]: value } }))
    }
  }

  const handleDateChange = (field, date) => {
    if (date) {
      handleChange(field, date.toISOString().split('T')[0])
    }
  }

  const renderAIBadge = (field) => {
    if (!hasAISuggestion(field)) return null
    const decision = reviewDecisions[field]
    if (decision === 'accepted') {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" /> AI Applied
        </span>
      )
    }
    if (decision === 'rejected') {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
          <X className="w-3 h-3" /> AI Rejected
        </span>
      )
    }
    return (
      <span className="ml-2 px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded-full flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        AI Available
      </span>
    )
  }

  const renderField = ({ label, name, type = 'text', required = false, options, ...props }) => {
    const aiValue = getAISuggestion(name)
    const decision = reviewDecisions[name]
    const showAIIndicator = hasAISuggestion(name) && showAIReview
    
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">{label} {required && <span className="text-red-500">*</span>}</label>
          {showAIIndicator && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI Available
            </span>
          )}
        </div>
        <div className="relative">
          {type === 'textarea' ? (
            <textarea
              className={clsx('input min-h-[100px] resize-y', props.className, showAIIndicator && 'border-primary-200 bg-primary-50')}
              name={name}
              value={current?.[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              {...props}
            />
          ) : type === 'select' ? (
            <select
              className={clsx('input', props.className, showAIIndicator && 'border-primary-200 bg-primary-50')}
              name={name}
              value={current?.[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              {...props}
            >
              <option value="">Select...</option>
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === 'date' ? (
            <input
              type="date"
              className={clsx('input', props.className, showAIIndicator && 'border-primary-200 bg-primary-50')}
              name={name}
              value={current?.[name] ? current[name].split('T')[0] : ''}
              onChange={(e) => handleChange(name, e.target.value)}
              {...props}
            />
          ) : (
            <input
              type={type}
              className={clsx('input', props.className, showAIIndicator && 'border-primary-200 bg-primary-50')}
              name={name}
              value={current?.[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              {...props}
            />
          )}
          {renderAIBadge(name)}
        </div>
        {showAIIndicator && aiValue && decision === 'pending' && (
          <div className="absolute bottom-full left-0 right-0 mb-1 p-2 bg-primary-50 border border-primary-200 rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-700">AI suggests: <strong>{aiValue.substring(0, 100)}{aiValue.length > 100 ? '...' : ''}</strong></span>
              <div className="flex gap-2">
                <button className="btn-primary btn-sm" onClick={() => acceptField(name)}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Accept
                </button>
                <button className="btn-secondary btn-sm" onClick={() => rejectField(name)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!current) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          {error ? (
            <>
              <p className="text-red-600">Error loading deviation</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button className="btn-secondary btn-sm mt-4" onClick={() => dispatch(fetchDeviations({}))}>
                Refresh List
              </button>
            </>
          ) : (
            <p>Select or create a deviation to view details</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Log Deviation</h2>
            <span className={clsx('badge', statusColors[current.status])}>
              {current.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{current.deviation_number}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => dispatch(updateDeviation({ id: current.id, data: { status: 'SUBMITTED' } }))}
          disabled={loading || current.status !== 'DRAFT'}
        >
          <Save className="w-4 h-4 mr-2" />
          Save & Submit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <div className="grid gap-4 md:grid-cols-2">
          {formFields
            .filter(f => ['title', 'batch_number', 'product_name', 'process_step', 'equipment_id', 'deviation_date', 'reported_by', 'status'].includes(f.name))
            .map((field) => (
              <div key={field.name}>
                {renderField(field)}
              </div>
            ))}
        </div>

        <div>
          {renderField(formFields.find(f => f.name === 'description'))}
        </div>

        {impactAssessment && (
          <div className="border-l-4 border-primary-500 bg-primary-50 p-4 rounded-r-lg">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
              AI Impact & Severity Assessment
            </h3>
            <div className="mb-3">
              <span className={clsx('badge', severityColors[impactAssessment.severity])}>
                {impactAssessment.severity}
              </span>
              <span className="ml-2 text-sm text-gray-600">Confidence: {Math.round(impactAssessment.confidence * 100)}%</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{impactAssessment.impact_assessment}</p>
            <p className="text-xs text-gray-500"><strong>Reason:</strong> {impactAssessment.reason}</p>
            <button
              className="mt-2 btn-secondary btn-sm"
              onClick={() => {
                if (current) {
                  dispatch(updateDeviation({
                    id: current.id,
                    data: {
                      severity: impactAssessment.severity,
                      impact_assessment: impactAssessment.impact_assessment,
                    }
                  }))
                }
              }}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Apply AI Recommendation
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {renderField(formFields.find(f => f.name === 'severity'))}
        </div>

        <div>
          {renderField(formFields.find(f => f.name === 'impact_assessment'))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {formFields
            .filter(f => ['root_cause', 'corrective_action', 'preventive_action'].includes(f.name))
            .map((field) => (
              <div key={field.name}>
                {renderField(field)}
              </div>
            ))}
        </div>

        {extractedData && extractionConfidence > 0 && (
          <details className="border-t border-gray-100 pt-4">
            <summary className="font-medium text-gray-900 cursor-pointer flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              AI Extracted Data (Confidence: {Math.round(extractionConfidence * 100)}%)
            </summary>
            <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono max-h-48 overflow-auto mt-2">
              <pre>{JSON.stringify(extractedData, null, 2)}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}