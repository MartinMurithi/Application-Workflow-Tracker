import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'

const APPLICATION_TYPES = [
  { value: 'recordation', label: 'Recordation' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'change_of_ownership', label: 'Change of Ownership' },
  { value: 'change_of_name', label: 'Change of Name' },
  { value: 'discontinuation', label: 'Discontinuation' },
]

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function ApplicationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    applicant_name: '',
    applicant_email: '',
    company_name: '',
    application_type: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    api.getApplication(id)
      .then((app) => {
        setForm({
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          company_name: app.company_name,
          application_type: app.application_type,
          description: app.description,
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetchLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let result
      if (isEdit) {
        result = await api.updateApplication(id, form)
      } else {
        result = await api.createApplication(form)
      }
      navigate(`/applications/${result.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Edit Application' : 'New Application'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEdit ? 'Update the application details below.' : 'Fill in the details to create a draft application.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Applicant Name" required>
            <input
              type="text"
              name="applicant_name"
              value={form.applicant_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Applicant Email" required>
            <input
              type="email"
              name="applicant_email"
              value={form.applicant_email}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jane@company.com"
            />
          </Field>
        </div>

        <Field label="Company Name" required>
          <input
            type="text"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Acme Corp"
          />
        </Field>

        <Field label="Application Type" required>
          <select
            name="application_type"
            value={form.application_type}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select a type…</option>
            {APPLICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Description" required hint="Provide a clear description of what you are applying for.">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Describe the purpose and details of this application…"
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Draft'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/applications/${id}` : '/')}
            className="text-gray-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
