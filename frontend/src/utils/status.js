export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  under_review: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  need_more_information: 'bg-orange-50 text-orange-700 border border-orange-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
}

export const TYPE_LABELS = {
  recordation: 'Recordation',
  renewal: 'Renewal',
  change_of_ownership: 'Change of Ownership',
  change_of_name: 'Change of Name',
  discontinuation: 'Discontinuation',
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
