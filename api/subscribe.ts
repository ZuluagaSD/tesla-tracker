import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from './_crypto.js'

const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, refresh_token, access_token, token_expires_at } = req.body

  if (!email || !refresh_token) {
    return res.status(400).json({ error: 'Missing email or refresh_token' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  // Verify the tokens work by fetching orders
  let currentAccessToken = access_token
  let currentExpiresAt = token_expires_at

  // Refresh if expired or no access token
  if (!currentAccessToken || (currentExpiresAt && currentExpiresAt < Date.now())) {
    const refreshRes = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: 'ownerapi',
        refresh_token,
      }),
    })
    if (!refreshRes.ok) {
      return res.status(400).json({ error: 'Invalid Tesla tokens. Please sign in again.' })
    }
    const tokenData = await refreshRes.json()
    currentAccessToken = tokenData.access_token
    currentExpiresAt = Date.now() + tokenData.expires_in * 1000
  }

  // Verify by fetching orders
  const ordersRes = await fetch('https://owner-api.teslamotors.com/api/1/users/orders', {
    headers: { Authorization: `Bearer ${currentAccessToken}` },
  })
  if (!ordersRes.ok) {
    return res.status(400).json({ error: 'Could not verify Tesla account. Please sign in again.' })
  }

  const ordersData = await ordersRes.json()
  const orders = ordersData.response ?? []

  // Upsert subscriber
  const { data: subscriber, error: subError } = await supabase
    .from('subscribers')
    .upsert(
      {
        email,
        refresh_token: encrypt(refresh_token),
        access_token: encrypt(currentAccessToken),
        token_expires_at: currentExpiresAt,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single()

  if (subError || !subscriber) {
    return res.status(500).json({ error: 'Failed to save subscription' })
  }

  // Create initial snapshots for each order
  for (const order of orders) {
    const refNum = order.referenceNumber
    if (!refNum) continue

    // Fetch order details
    let details = null
    try {
      const detailsRes = await fetch(
        `https://akamai-apigateway-vfx.tesla.com/tasks?deviceLanguage=en&deviceCountry=US&referenceNumber=${encodeURIComponent(refNum)}&appVersion=9.99.9-9999`,
        { headers: { Authorization: `Bearer ${currentAccessToken}` } },
      )
      if (detailsRes.ok) details = await detailsRes.json()
    } catch {
      // Details fetch failed, continue with order data only
    }

    const snapshot = extractSnapshot(order, details)

    await supabase.from('order_snapshots').upsert(
      {
        subscriber_id: subscriber.id,
        reference_number: refNum,
        ...snapshot,
        tasks_complete: snapshot.tasks_complete,
        raw_snapshot: { order, details },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'subscriber_id,reference_number' },
    )
  }

  return res.status(200).json({
    success: true,
    message: `Subscribed ${email} to updates for ${orders.length} order(s)`,
    orderCount: orders.length,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSnapshot(order: any, details: any) {
  const tasks = details?.tasks ?? {}
  const scheduling = tasks.scheduling ?? {}
  const registration = tasks.registration ?? {}
  const orderDetails = registration.orderDetails ?? {}
  const finalPaymentData = tasks.finalPayment?.data ?? {}

  const tasksComplete: Record<string, boolean> = {}
  for (const [key, task] of Object.entries(tasks)) {
    if (task && typeof task === 'object' && 'complete' in (task as Record<string, unknown>)) {
      tasksComplete[key] = (task as Record<string, unknown>).complete === true
    }
  }

  return {
    vin: order.vin ?? null,
    order_status: order.orderStatus ?? null,
    tasks_complete: tasksComplete,
    delivery_window: scheduling.deliveryWindowDisplay ?? null,
    appointment_date: scheduling.deliveryAppointmentDate || null,
    odometer: orderDetails.vehicleOdometer?.toString() ?? null,
    routing_location: orderDetails.vehicleRoutingLocation ?? null,
    eta_delivery_center: finalPaymentData.etaToDeliveryCenter ?? null,
  }
}
