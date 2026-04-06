import type { Change } from './diff'

export function buildEmailHtml(
  referenceNumber: string,
  changes: Change[],
): string {
  const rows = changes
    .map(
      (c) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#e5e5e5;font-weight:600;">${c.label}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#888;">${c.oldValue ?? '—'}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2e2e2e;color:#4ade80;font-weight:600;">${c.newValue ?? '—'}</td>
      </tr>`,
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
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
        <p style="margin:8px 0 0;color:#888;font-size:14px;">We detected ${changes.length} change${changes.length > 1 ? 's' : ''} to your order.</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#222;">
            <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">Change</th>
            <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">Before</th>
            <th style="padding:10px 16px;text-align:left;color:#888;font-weight:500;font-size:12px;text-transform:uppercase;">After</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <p style="text-align:center;color:#555;font-size:12px;margin-top:24px;">
      You're receiving this because you subscribed to order updates.<br>
      Reply "unsubscribe" or visit the tracker to manage your subscription.
    </p>
  </div>
</body>
</html>`
}

export function buildEmailText(
  referenceNumber: string,
  changes: Change[],
): string {
  const lines = changes.map(
    (c) => `• ${c.label}: ${c.oldValue ?? '—'} → ${c.newValue ?? '—'}`,
  )
  return `Tesla Order Update: ${referenceNumber}\n\n${lines.join('\n')}\n\n— Tesla Delivery Tracker`
}
