import { STATUS_COLORS } from '../utils/status'

export default function StatusBadge({ status, label }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label || status}
    </span>
  )
}
