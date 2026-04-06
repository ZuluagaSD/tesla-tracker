import { useEffect, useState } from 'react'
import { fetchOrders } from '../api/tesla-api'
import { useAuth } from '../auth/auth-context'
import { OrderCard } from './OrderCard'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOrder = any

interface OrderListProps {
  onSelectOrder: (order: AnyOrder) => void
}

export function OrderList({ onSelectOrder }: OrderListProps) {
  const { getAccessToken } = useAuth()
  const [orders, setOrders] = useState<AnyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const { parsed } = await fetchOrders(getAccessToken)
      setOrders(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[16/9] bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-800 rounded w-2/3" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadOrders}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">No orders found.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your Orders</h2>
        <button
          onClick={loadOrders}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order: AnyOrder, i: number) => (
          <OrderCard
            key={order.referenceNumber ?? i}
            order={order}
            onClick={() => onSelectOrder(order)}
          />
        ))}
      </div>
    </div>
  )
}
