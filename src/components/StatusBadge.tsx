const STATUS_STYLES: Record<string, string> = {
  ORDERED: 'bg-blue-900/50 text-blue-300 border-blue-800',
  ORDER_CONFIRMED: 'bg-blue-900/50 text-blue-300 border-blue-800',
  IN_PRODUCTION: 'bg-amber-900/50 text-amber-300 border-amber-800',
  MANUFACTURING: 'bg-amber-900/50 text-amber-300 border-amber-800',
  IN_TRANSIT: 'bg-purple-900/50 text-purple-300 border-purple-800',
  TRANSPORT: 'bg-purple-900/50 text-purple-300 border-purple-800',
  READY_FOR_DELIVERY: 'bg-green-900/50 text-green-300 border-green-800',
  DELIVERED: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
}

const DEFAULT_STYLE = 'bg-gray-800 text-gray-300 border-gray-700'

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE
  const label = status.replace(/_/g, ' ')

  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
