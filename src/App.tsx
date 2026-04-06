import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './auth/auth-context'
import { LoginPage } from './components/LoginPage'
import { Layout } from './components/Layout'
import { OrderList } from './components/OrderList'
import { OrderDetails } from './components/OrderDetails'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOrder = any

function App() {
  const { isAuthenticated, isLoading } = useAuth()
  const [selectedOrder, setSelectedOrder] = useState<AnyOrder | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <><LoginPage /><Analytics /></>
  }

  return (
    <>
      <Layout>
        {selectedOrder ? (
          <OrderDetails
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
          />
        ) : (
          <OrderList onSelectOrder={setSelectedOrder} />
        )}
      </Layout>
      <Analytics />
    </>
  )
}

export default App
