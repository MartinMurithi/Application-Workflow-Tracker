import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { formatDate, TYPE_LABELS } from '../utils/status'
import { useRole } from '../hooks/useRole'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'need_more_information', label: 'Need More Info' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ApplicationList() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const { isReviewer } = useRole()

  useEffect(() => {
    setLoading(true)
    api.listApplications()
      .then(setApplications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = applications.filter((app) => {
    const matchStatus = !statusFilter || app.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      app.tracking_number.toLowerCase().includes(q) ||
      app.applicant_name.toLowerCase().includes(q) ||
      app.company_name.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isReviewer ? 'Review and manage submitted applications' : 'Track and manage your applications'}
          </p>
        </div>
        {!isReviewer && (
          <Link
            to="/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Application
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by tracking number, name, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Loading applications…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No applications found</p>
            {!isReviewer && (
              <Link to="/new" className="mt-2 text-sm text-blue-600 hover:underline">
                Create your first application
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tracking #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {app.tracking_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{app.applicant_name}</div>
                      <div className="text-gray-400 text-xs">{app.applicant_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{app.company_name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {TYPE_LABELS[app.application_type] || app.application_type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} label={app.status_display} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDate(app.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
