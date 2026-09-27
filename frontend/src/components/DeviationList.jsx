import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import { fetchDeviations, createDeviation, fetchDeviation, deleteDeviation } from '../store/deviationSlice'
import { toggleSidebar, setActiveTab } from '../store/uiSlice'
import { Plus, ChevronLeft, ChevronRight, FileText, Search, Filter, Trash2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_INVESTIGATION: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-green-100 text-green-800',
}

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800',
  MAJOR: 'bg-orange-100 text-orange-800',
  MINOR: 'bg-yellow-100 text-yellow-800',
}

export default function DeviationList() {
  const dispatch = useDispatch()
  const { items, total, loading, error } = useSelector((state) => state.deviations)
  const { sidebarOpen, activeTab } = useSelector((state) => state.ui)

  useEffect(() => {
    dispatch(fetchDeviations({ skip: 0, limit: 50 }))
  }, [dispatch])

  const handleCreate = async () => {
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 16).replace('T', ' ')
    const result = await dispatch(createDeviation({
      title: `New Deviation ${timestamp}`,
      description: 'Click to edit description...',
      status: 'DRAFT',
    })).unwrap()
    dispatch(setActiveTab('form'))
    if (!sidebarOpen) dispatch(toggleSidebar())
  }

  const handleSelect = (deviation) => {
    dispatch(fetchDeviation(deviation.id))
    dispatch(setActiveTab('form'))
    if (!sidebarOpen) dispatch(toggleSidebar())
  }

  const handleDelete = async (e, deviation) => {
    e.stopPropagation()
    if (window.confirm(`Delete ${deviation.deviation_number}? This cannot be undone.`)) {
      try {
        await dispatch(deleteDeviation(deviation.id)).unwrap()
      } catch (error) {
        alert('Failed to delete: ' + error)
      }
    }
  }

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-80' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {sidebarOpen && (
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Deviations
          </h2>
        )}
        <button
          className="btn-ghost p-2"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="p-4 border-b border-gray-100 flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={handleCreate}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deviation
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sidebarOpen && (
          <div className="p-4 space-y-3">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                <p>Error loading deviations</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <button className="btn-secondary btn-sm mt-2" onClick={() => dispatch(fetchDeviations({}))}>
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No deviations found</p>
                <p className="text-sm">Create your first deviation</p>
              </div>
            ) : (
              <ul className="space-y-2" role="listbox">
                {items.map((deviation) => (
                  <li key={deviation.id} role="option" className="group">
                    <div className="flex items-center gap-2">
                      <button
                        className={clsx(
                          'flex-1 text-left p-3 rounded-lg transition-colors',
                          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500'
                        )}
                        onClick={() => handleSelect(deviation)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{deviation.deviation_number}</p>
                            <p className="text-sm text-gray-500 truncate mt-0.5">{deviation.title || 'Untitled'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={clsx('badge text-xs', statusColors[deviation.status])}>
                                {deviation.status}
                              </span>
                              {deviation.severity && (
                                <span className={clsx('badge text-xs', severityColors[deviation.severity])}>
                                  {deviation.severity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 whitespace-nowrap">
                          {format(new Date(deviation.created_at), 'MMM d, yyyy')}
                        </p>
                      </button>
                      <button
                        className="btn-ghost p-2 text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, deviation)}
                        title="Delete deviation"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {sidebarOpen && (
        <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
          <p>Total: {total} deviations</p>
        </div>
      )}
    </aside>
  )
}