// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any

export async function fetchOrders(
  getAccessToken: () => Promise<string>,
): Promise<{ parsed: AnyJson[]; raw: AnyJson }> {
  const token = await getAccessToken()
  const res = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`)
  }

  const data = await res.json()
  return { parsed: data.response ?? data ?? [], raw: data }
}

export async function fetchOrderDetails(
  orderId: string,
  getAccessToken: () => Promise<string>,
): Promise<AnyJson> {
  const token = await getAccessToken()
  const res = await fetch(`/api/order-details?referenceNumber=${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch order details: ${res.status}`)
  }

  return res.json()
}
