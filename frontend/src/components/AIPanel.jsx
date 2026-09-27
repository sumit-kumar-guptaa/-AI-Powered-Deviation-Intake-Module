import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  extractDeviationInfo, extractDeviationFromFile, assessImpact, chatWithAI,
  clearExtractedData, clearChatMessages, addChatMessage, updateDeviation, createDeviation
} from '../store/deviationSlice'
import {
  FileText, Upload, Send, Loader2, Sparkles, Trash2, Copy,
  CheckCircle, AlertTriangle, Info, Mic2, Paperclip, RotateCcw
} from 'lucide-react'
import { clsx } from 'clsx'

const SUPPORTED_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.eml', '.msg']

export default function AIPanel() {
  const dispatch = useDispatch()
  const { extractedData, extractionConfidence, aiLoading, aiError, impactAssessment, chatMessages } = useSelector(
    (state) => state.deviations
  )
  const currentDeviation = useSelector((state) => state.deviations.current)

  const [inputText, setInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [activeTab, setActiveTab] = useState('extract')
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleFileSelect = (file) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_TYPES.includes(ext)) {
      alert(`Unsupported file type. Supported: ${SUPPORTED_TYPES.join(', ')}`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    setSelectedFile(file)
  }

  const handleExtractText = async () => {
    if (!inputText.trim() && !selectedFile) return
    try {
      if (selectedFile) {
        await dispatch(extractDeviationFromFile({ file: selectedFile, additionalText: inputText })).unwrap()
      } else {
        await dispatch(extractDeviationInfo({ text: inputText })).unwrap()
      }
      
      // If no current deviation exists, create one with extracted data
      if (!currentDeviation) {
        const extracted = extractedData || {}
        const newDeviation = await dispatch(createDeviation({
          title: extracted.title || 'AI Extracted Deviation',
          description: extracted.description || inputText,
          batch_number: extracted.batch_number,
          product_name: extracted.product_name,
          process_step: extracted.process_step,
          equipment_id: extracted.equipment_id,
          deviation_date: extracted.deviation_date,
          reported_by: extracted.reported_by,
          status: 'DRAFT',
        })).unwrap()
        console.log('Created new deviation from AI extraction:', newDeviation.deviation_number)
      }
      
      setInputText('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Extraction failed:', error)
    }
  }

  const handleAssessImpact = async () => {
    if (!extractedData) return
    try {
      await dispatch(assessImpact({ deviation_data: extractedData })).unwrap()
    } catch (error) {
      console.error('Assessment failed:', error)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const message = chatInput
    setChatInput('')
    dispatch(addChatMessage({ role: 'user', content: message }))
    try {
      await dispatch(chatWithAI({ message, deviation_context: extractedData || currentDeviation })).unwrap()
    } catch (error) {
      console.error('Chat failed:', error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Copilot</h2>
          </div>
          {(extractedData || impactAssessment) && (
            <button
              className="btn-ghost p-2 text-red-500 hover:bg-red-50"
              onClick={() => {
                dispatch(clearExtractedData())
                dispatch(clearChatMessages())
              }}
              title="Clear AI data"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            className={clsx(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'extract' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setActiveTab('extract')}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Extract
            </span>
          </button>
          <button
            className={clsx(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setActiveTab('chat')}
          >
            <span className="flex items-center gap-1.5 justify-center">
              <Info className="w-4 h-4" />
              Chat
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {activeTab === 'extract' && (
          <ExtractTab
            inputText={inputText}
            setInputText={setInputText}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handleFileSelect={handleFileSelect}
            handleExtractText={handleExtractText}
            handleAssessImpact={handleAssessImpact}
            extractedData={extractedData}
            extractionConfidence={extractionConfidence}
            impactAssessment={impactAssessment}
            aiLoading={aiLoading}
            aiError={aiError}
            fileInputRef={fileInputRef}
            currentDeviation={currentDeviation}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSend={handleChatSend}
            handleKeyDown={handleKeyDown}
            aiLoading={aiLoading}
            chatEndRef={chatEndRef}
            currentDeviation={currentDeviation}
          />
        )}
      </div>
    </div>
  )
}

function ExtractTab({
  inputText, setInputText, selectedFile, setSelectedFile,
  handleFileSelect, handleExtractText, handleAssessImpact,
  extractedData, extractionConfidence, impactAssessment,
  aiLoading, aiError, fileInputRef, currentDeviation
}) {
  const dispatch = useDispatch()
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Paste Deviation Text / Email</label>
        <textarea
          className="input min-h-[120px] resize-y"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste deviation report, email, or description here..."
          disabled={aiLoading}
        />
      </div>

      <div>
        <label className="label">Or Upload Document</label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            id="file-upload"
            accept={SUPPORTED_TYPES.join(',')}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            disabled={aiLoading}
          />
          <label
            htmlFor="file-upload"
            className={clsx(
              'w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
              selectedFile ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-400'
            )}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500"
                  onClick={(e) => { e.preventDefault(); setSelectedFile(null) }}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-gray-600">Click or drag to upload</p>
                <p className="text-xs text-gray-400">PDF, DOCX, TXT, EML, MSG (max 10MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {aiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      <button
        className={clsx('btn-primary w-full', aiLoading && 'opacity-70')}
        onClick={handleExtractText}
        disabled={aiLoading || (!inputText.trim() && !selectedFile)}
      >
        {aiLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Extract & Analyze
          </span>
        )}
      </button>

      {extractedData && extractionConfidence > 0 && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Extracted Information
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-60 overflow-auto">
            <pre className="font-mono">{JSON.stringify(extractedData, null, 2)}</pre>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Confidence: {Math.round(extractionConfidence * 100)}%</span>
            <button
              className="text-primary-600 hover:underline text-xs"
              onClick={() => copyToClipboard(JSON.stringify(extractedData, null, 2))}
            >
              <Copy className="w-3.5 h-3.5 inline mr-1" /> Copy JSON
            </button>
          </div>

          {!impactAssessment && extractedData && (
            <button
              className="btn-secondary w-full"
              onClick={handleAssessImpact}
              disabled={aiLoading}
            >
              <span className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Assess Impact & Severity
              </span>
            </button>
          )}

          {impactAssessment && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">AI Impact Assessment</h4>
                <button
                  className="btn-ghost p-1 text-xs text-primary-600 hover:bg-primary-50"
                  onClick={handleAssessImpact}
                  disabled={aiLoading}
                  title="Re-run assessment"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <div className="mb-2">
                <span className={clsx('badge', severityColors[impactAssessment.severity])}>
                  {impactAssessment.severity}
                </span>
                <span className="ml-2 text-sm text-gray-600">Confidence: {Math.round(impactAssessment.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{impactAssessment.impact_assessment}</p>
              <p className="text-xs text-gray-500"><strong>Reason:</strong> {impactAssessment.reason}</p>
              {currentDeviation && (
                <button
                  className="mt-2 btn-primary btn-sm w-full"
                  onClick={() => {
                    dispatch(updateDeviation({
                      id: currentDeviation.id,
                      data: {
                        severity: impactAssessment.severity,
                        impact_assessment: impactAssessment.impact_assessment,
                      }
                    }))
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Apply to Form
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatTab({
  chatMessages, chatInput, setChatInput, handleChatSend,
  handleKeyDown, aiLoading, chatEndRef, currentDeviation
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4" ref={chatEndRef}>
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Ask me anything about deviations</p>
            <p className="text-sm mt-1">I can help with root cause analysis, regulatory guidance, CAPA suggestions, and more.</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                )}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div
                className={clsx(
                  'max-w-[75%] p-3 rounded-2xl',
                  msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex gap-2">
          <textarea
            className="input flex-1 min-h-[44px] max-h-[120px] resize-none"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about root cause, CAPA, regulations..."
            disabled={aiLoading}
            rows={1}
          />
          <button
            className="btn-primary self-end"
            onClick={handleChatSend}
            disabled={aiLoading || !chatInput.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {currentDeviation && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Context: {currentDeviation.deviation_number} - {currentDeviation.title}
          </p>
        )}
      </div>
    </div>
  )
}

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  MAJOR: 'bg-orange-100 text-orange-800 border-orange-200',
  MINOR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}