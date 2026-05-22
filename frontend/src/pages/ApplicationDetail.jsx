import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { formatDateTime, TYPE_LABELS } from '../utils/status'
import { useRole } from '../hooks/useRole'

function InfoRow({ label, value }) {
  return (
    <div className="py-3 grid grid-cols-3 gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2">{value || '—'}</dd>
    </div>
  )
}

function DecisionModal({ onClose, onSubmit, loading }) {
  const [decision, setDecision] = useState('')
  const [comment, setComment] = useState('')
  const needsComment = decision === 'rejected' || decision === 'need_more_info'

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(decision, comment || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Make a Decision</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
            <div className="space-y-2">
              {[
                { value: 'approved', label: 'Approve', color: 'text-green-700 border-green-300 bg-green-50' },
                { value: 'rejected', label: 'Reject', color: 'text-red-700 border-red-300 bg-red-50' },
                { value: 'need_more_info', label: 'Request More Information', color: 'text-orange-700 border-orange-300 bg-orange-50' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value={opt.value}
                    checked={decision === opt.value}
                    onChange={() => setDecision(opt.value)}
                    className="text-blue-600"
                  />
                  <span className={`text-sm font-medium px-2 py-0.5 rounded border ${opt.color}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
              {needsComment && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={needsComment}
              rows={4}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder={needsComment ? 'Required: explain your decision…' : 'Optional comment…'}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!decision || loading}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting…' : 'Confirm Decision'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isReviewer } = useRole()

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)

  const load = useCallback(() => {
    api.getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const doAction = async (fn) => {
    setActionError(null)
    setActionLoading(true)
    try {
      const updated = await fn()
      setApp(updated)
    } catch (e) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmit = () => doAction(() => api.submitApplication(id))
  const handleResubmit = () => doAction(() => api.resubmitApplication(id))
  const handleStartReview = () => doAction(() => api.startReview(id))
  const handleDecision = (decision, comment) =>
    doAction(async () => {
      const result = await api.makeDecision(id, decision, comment)
      setShowDecisionModal(false)
      return result
    })

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm py-8 text-center">
        {error} — <Link to="/" className="text-blue-600 hover:underline">Go back</Link>
      </div>
    )
  }

  const status = app.status
  const isImmutable = status === 'approved' || status === 'rejected'

  return (
    <div className="max-w-3xl">
      {showDecisionModal && (
        <DecisionModal
          onClose={() => setShowDecisionModal(false)}
          onSubmit={handleDecision}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link to="/" className="hover:text-gray-700">Applications</Link>
          <span>/</span>
          <span className="font-mono text-gray-600">{app.tracking_number}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{app.applicant_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{app.company_name}</p>
          </div>
          <StatusBadge status={status} label={app.status_display} />
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {actionError}
        </div>
      )}

      {/* Action Bar */}
      {!isImmutable && (
        <div className="mb-5 flex flex-wrap gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-500 self-center mr-auto">Actions:</span>

          {/* Applicant actions */}
          {!isReviewer && status === 'draft' && (
            <>
              <Link
                to={`/applications/${id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleSubmit}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Submit Application
              </button>
            </>
          )}

          {!isReviewer && status === 'need_more_information' && (
            <>
              <Link
                to={`/applications/${id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleResubmit}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Resubmit
              </button>
            </>
          )}

          {/* Reviewer actions */}
          {isReviewer && status === 'submitted' && (
            <button
              onClick={handleStartReview}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-yellow-600 px-3 py-1.5 rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              Start Review
            </button>
          )}

          {isReviewer && status === 'under_review' && (
            <button
              onClick={() => setShowDecisionModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Make Decision
            </button>
          )}
        </div>
      )}

      {/* Details card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Application Details</h2>
        </div>
        <dl className="px-5 divide-y divide-gray-50">
          <InfoRow label="Tracking Number" value={
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{app.tracking_number}</span>
          } />
          <InfoRow label="Applicant Name" value={app.applicant_name} />
          <InfoRow label="Email" value={app.applicant_email} />
          <InfoRow label="Company" value={app.company_name} />
          <InfoRow label="Application Type" value={app.application_type_display} />
          <InfoRow label="Status" value={<StatusBadge status={status} label={app.status_display} />} />
          <InfoRow label="Description" value={
            <p className="whitespace-pre-wrap leading-relaxed">{app.description}</p>
          } />
        </dl>
      </div>

      {/* Reviewer comment */}
      {app.reviewer_comment && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Reviewer Comment</p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{app.reviewer_comment}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Timeline</h2>
        </div>
        <dl className="px-5 divide-y divide-gray-50">
          <InfoRow label="Created" value={formatDateTime(app.created_at)} />
          <InfoRow label="Last Updated" value={formatDateTime(app.updated_at)} />
          <InfoRow label="Submitted" value={formatDateTime(app.submitted_at)} />
          <InfoRow label="Reviewed" value={formatDateTime(app.reviewed_at)} />
        </dl>
      </div>
    </div>
  )
}
