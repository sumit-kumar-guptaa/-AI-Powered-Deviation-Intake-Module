export const DeviationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  CLOSED: 'CLOSED',
} as const

export const DeviationSeverity = {
  CRITICAL: 'CRITICAL',
  MAJOR: 'MAJOR',
  MINOR: 'MINOR',
} as const

export type DeviationStatusType = typeof DeviationStatus[keyof typeof DeviationStatus]
export type DeviationSeverityType = typeof DeviationSeverity[keyof typeof DeviationSeverity]

export interface Deviation {
  id: number
  deviation_number: string
  title: string
  description: string
  batch_number: string | null
  product_name: string | null
  process_step: string | null
  equipment_id: string | null
  deviation_date: string | null
  reported_by: string | null
  reported_date: string
  status: DeviationStatusType
  severity: DeviationSeverityType | null
  impact_assessment: string | null
  root_cause: string | null
  corrective_action: string | null
  preventive_action: string | null
  ai_extracted_data: Record<string, any> | null
  ai_impact_reason: string | null
  ai_severity_recommendation: DeviationSeverityType | null
  created_at: string
  updated_at: string
}

export interface DeviationListResponse {
  items: Deviation[]
  total: number
}

export interface AIExtractionResponse {
  extracted_data: Record<string, any>
  confidence: number
}

export interface AImpactAssessmentResponse {
  severity: DeviationSeverityType
  impact_assessment: string
  reason: string
  confidence: number
}

export interface AIChatResponse {
  response: string
  suggested_actions: string[]
}