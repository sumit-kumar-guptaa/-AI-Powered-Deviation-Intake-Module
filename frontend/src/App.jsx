import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import DeviationList from './components/DeviationList'
import DeviationForm from './components/DeviationForm'
import AIPanel from './components/AIPanel'
import { toggleSidebar } from './store/uiSlice'
import { Menu } from 'lucide-react'
import { clsx } from 'clsx'

function Header() {
  const dispatch = useDispatch()
  const { sidebarOpen } = useSelector((state) => state.ui)

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            className="btn-ghost p-2 lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">AIVOA Deviation Management</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">API Pharmaceutical Manufacturer</span>
        </div>
      </div>
    </header>
  )
}

function MainContent() {
  const { sidebarOpen, activeTab, aiPanelOpen } = useSelector((state) => state.ui)

  return (
    <main className={clsx('pt-16 transition-all duration-300', sidebarOpen ? 'lg:ml-80' : 'lg:ml-16')}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className={clsx('grid gap-6', aiPanelOpen ? 'lg:grid-cols-12' : 'lg:grid-cols-1')}>
          <div className={clsx('min-w-0', aiPanelOpen ? 'lg:col-span-7' : '')}>
            <DeviationForm />
          </div>
          {aiPanelOpen && (
            <div className="lg:col-span-5">
              <AIPanel />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DeviationList />
      <MainContent />
    </div>
  )
}