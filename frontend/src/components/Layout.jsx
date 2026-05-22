import { Link, useLocation } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Layout({ children }) {
  const { role, switchRole, isReviewer } = useRole()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 text-sm">AppTracker</span>
              </Link>

              <nav className="hidden sm:flex items-center gap-1">
                <NavLink to="/">Applications</NavLink>
                {!isReviewer && <NavLink to="/new">New Application</NavLink>}
              </nav>
            </div>

            {/* Role switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:block">Role:</span>
              <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                <button
                  onClick={() => switchRole('applicant')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    role === 'applicant'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Applicant
                </button>
                <button
                  onClick={() => switchRole('reviewer')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    role === 'reviewer'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="sm:hidden border-b border-gray-200 bg-white px-4 py-2 flex gap-2">
        <NavLink to="/">Applications</NavLink>
        {!isReviewer && <NavLink to="/new">New</NavLink>}
      </div>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
