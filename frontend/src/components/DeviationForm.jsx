import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import {
  FileText, Calendar, Hash, Package, Truck, User, AlertTriangle,
  Loader2, CheckCircle, AlertCircle, Info, Save, Edit3, Check, X, Sparkles, Trash2,
  Zap, FileCheck, AlertTriangle as AlertTriangleIcon, ClipboardCheck
} from 'lucide-react'
import { updateDeviation, fetchDeviation, clearExtractedData, clearChatMessages } from '../store/deviationSlice'
import { clsx } from 'clsx'

// Workflow steps for left panel
const LEFT_WORKFLOW_STEPS = [
  { id: 1, key: 'input', label: 'Input', icon: FileText, desc: 'Deviation text/file' },
  { id: 2, key: 'process', label: 'AI Processing', icon: Zap, desc: 'Extracting data...' },
  { id: 3, key: 'form', label: 'Extracted Form', icon: FileCheck, desc: 'Fields populated' },
  { id: 4, key: 'impact', label: 'Impact/Severity', icon: AlertTriangleIcon, desc: 'AI assessment' },
  { id: 5, key: 'review', label: 'Review', icon: ClipboardCheck, desc: 'Accept/Reject' },
  { id: 6, key: 'save', label: 'Save', icon: Save, desc: 'Submit' },
  { id: 7, key: 'complete', label: 'Submitted', icon: CheckCircle, desc: 'Deviation submitted' },
]

function LeftWorkflowStepper({ extractedData, impactAssessment, aiLoading, current, showAIReview }) {
  const getCurrentStep = () => {
    // If submitted, show all steps as complete
    if (current?.status === 'SUBMITTED') return 7
    if (!extractedData || Object.keys(extractedData).length === 0) return 1
    if (aiLoading) return 2
    if (!impactAssessment) return 3
    if (!showAIReview) return 4
    if (!current?.severity) return 5
    if (current?.status === 'DRAFT') return 6
    return 6
  }

  const currentStep = getCurrentStep()

  return (
    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
      <div className="max-w-full mx-auto">
        <div className="text-xs font-medium text-primary-700 mb-3 uppercase tracking-wider">
          Workflow Progress
        </div>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" />
          <div className="relative flex items-center justify-between">
            {LEFT_WORKFLOW_STEPS.map((step, index) => {
              const isActive = currentStep >= step.id
              const isCurrent = currentStep === step.id
              const isComplete = currentStep > step.id
              
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isComplete ? 'bg-primary-600 border-primary-600 text-white' :
                    isCurrent ? 'bg-primary-100 border-primary-600 text-primary-700' :
                    'bg-white border-gray-300 text-gray-400'
                  )}>
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent && aiLoading && step.id === 2 ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <step.icon className={clsx('w-5 h-5', isCurrent ? 'text-primary-600' : '')} />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={clsx(
                      'text-xs font-medium',
                      isComplete ? 'text-primary-600' :
                      isCurrent ? 'text-primary-700' :
                      'text-gray-500'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-400 max-w-[80px] truncate">{step.desc}</p>
                  </div>
                  {index < LEFT_WORKFLOW_STEPS.length - 1 && (
                    <div className={clsx(
                      'absolute top-5 left-1/2 w-full h-1',
                      index < currentStep - 1 ? 'bg-primary-600' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-primary-700">
              Step {currentStep} of {LEFT_WORKFLOW_STEPS.length}:
            </span>{' '}
            {currentStep === 1 && 'Go to AI Panel (right) → Paste text/upload file → Click Extract'}
            {currentStep === 2 && 'AI is extracting structured data from your input...'}
            {currentStep === 3 && 'Fields below are auto-populated. Check "AI Available" badges.'}
            {currentStep === 4 && 'Go to AI Panel → Click "Assess Impact & Severity"'}
            {currentStep === 5 && 'Click "Review AI Suggestions" above → Accept/Reject each field'}
            {currentStep === 6 && 'Click "Save & Submit" below to finalize'}
            {currentStep === 7 && 'Deviation successfully submitted! All steps complete.'}
          </p>
        </div>
      </div>
    </div>
  )
}

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

  // Initialize review decisions when extracted data changes
  useEffect(() => {
    if (extractedData && Object.keys(extractedData).length > 0) {
      const decisions = {}
      Object.keys(extractedData).forEach(key => {
        decisions[key] = 'pending'
      })
      setReviewDecisions(decisions)
    }
  }, [extractedData])

  const handleAcceptAll = () => {
    if (!extractedData || !current) return
    
    // Get valid form fields that can be updated
    const validFields = formFields.map(f => f.name)
    const updates = {}
    
    Object.keys(extractedData).forEach(field => {
      if (validFields.includes(field)) {
        const suggestion = getAISuggestion(field)
        if (suggestion) {
          updates[field] = suggestion
        }
      }
    })
    
    // Single API call with all updates
    if (Object.keys(updates).length > 0) {
      dispatch(updateDeviation({ id: current.id, data: updates }))
    }
    
    setReviewDecisions(prev => {
      const next = { ...prev }
      Object.keys(extractedData).forEach(field => {
        if (getAISuggestion(field) && validFields.includes(field)) next[field] = 'accepted'
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
      {/* Guard against null current */}
      {!current && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Loading deviation...</p>
          </div>
        </div>
      )}
      {current && (
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

      {/* Workflow Progress Stepper */}
      <LeftWorkflowStepper 
        extractedData={extractedData} 
        impactAssessment={impactAssessment} 
        aiLoading={aiLoading}
        current={current}
        showAIReview={showAIReview}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* AI Review Panel - Always visible when there's extracted data */}
        {extractedData && Object.keys(extractedData).length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Suggestions Review</h3>
                  <p className="text-sm text-gray-500">Accept or reject each AI-suggested field</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setShowAIReview(false)}
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Hide
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={handleAcceptAll}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Accept All
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formFields
                .filter(f => hasAISuggestion(f.name))
                .map((field) => {
                  const aiValue = getAISuggestion(field.name)
                  const decision = reviewDecisions[field.name]
                  return (
                    <div key={field.name} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{field.label}</p>
                          <p className="text-sm text-primary-700 bg-primary-50 px-3 py-1.5 rounded font-mono mt-1 inline-block max-w-full truncate">
                            {aiValue}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {decision === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => acceptField(field.name)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Accept
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => rejectField(field.name)}
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </button>
                            </div>
                          ) : decision === 'accepted' ? (
                            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Accepted
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary-100">
              <p className="text-xs text-gray-500 text-center">
                {Object.keys(reviewDecisions).filter(k => reviewDecisions[k] === 'accepted').length} of {Object.keys(extractedData).length} fields accepted
              </p>
            </div>
          </div>
        )}
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
  )}
</div>
)
}