import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { decrypt, encrypt } from '../_crypto.js'

const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const TESLA_ORDERS_URL = 'https://owner-api.teslamotors.com/api/1/users/orders'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  // Load active subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('is_active', true)

  if (subError || !subscribers) {
    return res.status(500).json({ error: 'Failed to load subscribers' })
  }

  const results: { email: string; status: string; changes: number }[] = []

  for (const sub of subscribers) {
    try {
      // Decrypt stored tokens
      let accessToken: string | null = null
      let refreshToken: string
      let expiresAt = sub.token_expires_at

      try {
        refreshToken = decrypt(sub.refresh_token)
        if (sub.access_token) accessToken = decrypt(sub.access_token)
      } catch {
        // Legacy unencrypted tokens - read as-is
        refreshToken = sub.refresh_token
        accessToken = sub.access_token
      }

      if (!accessToken || (expiresAt && expiresAt < Date.now())) {
        const refreshRes = await fetch(TESLA_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: 'ownerapi',
            refresh_token: refreshToken,
          }),
        })

        if (!refreshRes.ok) {
          // Token expired permanently, deactivate
          await supabase
            .from('subscribers')
            .update({ is_active: false })
            .eq('id', sub.id)
          results.push({ email: sub.email, status: 'token_expired', changes: 0 })
          continue
        }

        const tokenData = await refreshRes.json()
        accessToken = tokenData.access_token
        expiresAt = Date.now() + tokenData.expires_in * 1000

        // Save new tokens (encrypted)
        await supabase
          .from('subscribers')
          .update({
            access_token: encrypt(accessToken!),
            token_expires_at: expiresAt,
            refresh_token: encrypt(tokenData.refresh_token ?? refreshToken),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)
      }

      // Fetch orders
      const ordersRes = await fetch(TESLA_ORDERS_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!ordersRes.ok) {
        results.push({ email: sub.email, status: 'orders_failed', changes: 0 })
        continue
      }

      const ordersData = await ordersRes.json()
      const orders = ordersData.response ?? []

      // Load existing snapshots
      const { data: existingSnapshots } = await supabase
        .from('order_snapshots')
        .select('*')
        .eq('subscriber_id', sub.id)

      const snapshotMap = new Map(
        (existingSnapshots ?? []).map((s: Record<string, unknown>) => [s.reference_number, s]),
      )

      let totalChanges = 0

      for (const order of orders) {
        const refNum = order.referenceNumber
        if (!refNum) continue

        // Fetch details
        let details = null
        try {
          const detailsUrl = `https://akamai-apigateway-vfx.tesla.com/tasks?deviceLanguage=en&deviceCountry=US&referenceNumber=${encodeURIComponent(refNum)}&appVersion=9.99.9-9999`
          const detailsRes = await fetch(detailsUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (detailsRes.ok) details = await detailsRes.json()
        } catch {
          // continue with order data only
        }

        const newSnapshot = extractSnapshot(order, details)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldSnapshot = snapshotMap.get(refNum) as any

        const changes = diffSnapshots(oldSnapshot, newSnapshot)

        if (changes.length > 0) {
          totalChanges += changes.length

          // Send email
          await resend.emails.send({
            from: 'Tesla Tracker <notifications@' + (process.env.RESEND_DOMAIN ?? 'resend.dev') + '>',
            to: sub.email,
            subject: `Tesla Order Update: ${refNum} — ${changes.map((c) => c.label).join(', ')}`,
            html: buildEmailHtml(refNum, changes),
            text: buildEmailText(refNum, changes),
          })
        }

        // Upsert snapshot
        await supabase.from('order_snapshots').upsert(
          {
            subscriber_id: sub.id,
            reference_number: refNum,
            ...newSnapshot,
            tasks_complete: newSnapshot.tasks_complete,
            raw_snapshot: { order, details },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'subscriber_id,reference_number' },
        )
      }

      results.push({ email: sub.email, status: 'ok', changes: totalChanges })
    } catch (err) {
      results.push({ email: sub.email, status: `error: ${err}`, changes: 0 })
    }
  }

  return res.status(200).json({ processed: results.length, results })
}

// --- Inline helpers (duplicated from src/lib to keep serverless self-contained) ---

interface Change {
  field: string
  label: string
  oldValue: string | null
  newValue: string | null
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function diffSnapshots(oldSnap: any | null, newSnap: any): Change[] {
  const changes: Change[] = []
  if (!oldSnap) return changes

  if (!oldSnap.vin && newSnap.vin)
    changes.push({ field: 'vin', label: 'VIN Assigned', oldValue: null, newValue: newSnap.vin })
  else if (oldSnap.vin && newSnap.vin && oldSnap.vin !== newSnap.vin)
    changes.push({ field: 'vin', label: 'VIN Changed', oldValue: oldSnap.vin, newValue: newSnap.vin })

  if (oldSnap.order_status !== newSnap.order_status && newSnap.order_status)
    changes.push({ field: 'order_status', label: 'Order Status Changed', oldValue: oldSnap.order_status, newValue: newSnap.order_status })

  const oldTasks = (typeof oldSnap.tasks_complete === 'object' && oldSnap.tasks_complete) || {}
  for (const [taskName, isComplete] of Object.entries(newSnap.tasks_complete)) {
    if (isComplete && !oldTasks[taskName])
      changes.push({ field: `task_${taskName}`, label: `${taskName.charAt(0).toUpperCase() + taskName.slice(1)} Completed`, oldValue: 'incomplete', newValue: 'complete' })
  }

  if (!oldSnap.delivery_window && newSnap.delivery_window)
    changes.push({ field: 'delivery_window', label: 'Delivery Window Set', oldValue: null, newValue: newSnap.delivery_window })
  else if (oldSnap.delivery_window && newSnap.delivery_window && oldSnap.delivery_window !== newSnap.delivery_window)
    changes.push({ field: 'delivery_window', label: 'Delivery Window Updated', oldValue: oldSnap.delivery_window, newValue: newSnap.delivery_window })

  if (!oldSnap.appointment_date && newSnap.appointment_date)
    changes.push({ field: 'appointment_date', label: 'Appointment Scheduled', oldValue: null, newValue: newSnap.appointment_date })

  if (!oldSnap.odometer && newSnap.odometer)
    changes.push({ field: 'odometer', label: 'Odometer Appeared', oldValue: null, newValue: newSnap.odometer })
  else if (oldSnap.odometer && newSnap.odometer && oldSnap.odometer !== newSnap.odometer)
    changes.push({ field: 'odometer', label: 'Odometer Changed', oldValue: oldSnap.odometer, newValue: newSnap.odometer })

  if (oldSnap.routing_location !== newSnap.routing_location && newSnap.routing_location)
    changes.push({ field: 'routing_location', label: 'Vehicle Location Changed', oldValue: oldSnap.routing_location, newValue: newSnap.routing_location })

  if (oldSnap.eta_delivery_center !== newSnap.eta_delivery_center && newSnap.eta_delivery_center)
    changes.push({ field: 'eta_delivery_center', label: 'ETA Updated', oldValue: oldSnap.eta_delivery_center, newValue: newSnap.eta_delivery_center })

  return changes
}

function buildEmailHtml(referenceNumber: string, changes: Change[]): string {
  const rows = changes.map((c) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#e5e5e5;font-weight:600;">${c.label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#888;">${c.oldValue ?? '—'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#4ade80;font-weight:600;">${c.newValue ?? '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <a href="https://www.tesladeliverytracker.com" style="display:inline-block;background:#dc2626;border-radius:12px;padding:8px 12px;text-decoration:none;">
      <span style="color:white;font-weight:700;font-size:14px;">Tesla Delivery Tracker</span>
    </a>
  </div>
  <div style="background:#1a1a1a;border:1px solid #2e2e2e;border-radius:16px;overflow:hidden;">
    <div style="padding:24px;border-bottom:1px solid #2e2e2e;">
      <h1 style="margin:0;color:white;font-size:20px;">Order Update: ${referenceNumber}</h1>
      <p style="margin:8px 0 0;color:#888;font-size:14px;">${changes.length} change${changes.length > 1 ? 's' : ''} detected.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#222;">
        <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">Change</th>
        <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">Before</th>
        <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">After</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p style="text-align:center;color:#555;font-size:12px;margin-top:24px;">You're receiving this because you subscribed to Tesla order updates.</p>
</div></body></html>`
}

function buildEmailText(referenceNumber: string, changes: Change[]): string {
  const lines = changes.map((c) => `• ${c.label}: ${c.oldValue ?? '—'} → ${c.newValue ?? '—'}`)
  return `Tesla Order Update: ${referenceNumber}\n\n${lines.join('\n')}\n\n— Tesla Delivery Tracker`
}
