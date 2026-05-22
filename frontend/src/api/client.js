const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getRole() {
  return localStorage.getItem('x-role') || 'applicant'
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Role': getRole(),
  }

  const config = { method, headers }
  if (body !== null) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, config)

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`
    try {
      const err = await response.json()
      errorDetail = err.detail || JSON.stringify(err)
    } catch {}
    throw new Error(errorDetail)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  // Applications
  listApplications: () => request('GET', '/applications'),
  getApplication: (id) => request('GET', `/applications/${id}`),
  createApplication: (data) => request('POST', '/applications', data),
  updateApplication: (id, data) => request('PUT', `/applications/${id}`, data),
  submitApplication: (id) => request('POST', `/applications/${id}/submit`),
  resubmitApplication: (id) => request('POST', `/applications/${id}/resubmit`),

  // Reviewer
  startReview: (id) => request('POST', `/applications/${id}/start-review`),
  makeDecision: (id, decision, comment) =>
    request('POST', `/applications/${id}/decision`, { decision, comment }),
}
