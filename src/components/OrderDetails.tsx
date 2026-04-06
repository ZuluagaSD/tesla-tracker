import { useEffect, useState } from 'react'
import { fetchOrderDetails } from '../api/tesla-api'
import { useAuth } from '../auth/auth-context'
import { useI18n } from '../lib/i18n'
import { StatusBadge } from './StatusBadge'
import { VehicleImage } from './VehicleImage'
import { SubscribeForm } from './SubscribeForm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any

interface OrderDetailsProps {
  order: AnyJson
  onBack: () => void
}

type Tab = 'overview' | 'tasks' | 'json'

export function OrderDetails({ order, onBack }: OrderDetailsProps) {
  const { getAccessToken } = useAuth()
  const { t } = useI18n()
  const [details, setDetails] = useState<AnyJson>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  const orderId = order.referenceNumber ?? ''
  const modelCode = order.modelCode ?? ''
  const status = order.orderStatus ?? ''
  const vin = order.vin ?? null

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchOrderDetails(orderId, getAccessToken)
        setDetails(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  const tasks = details?.tasks ?? {}

  // Extract key data from the tasks
  const reg = tasks.registration ?? {}
  const scheduling = tasks.scheduling ?? {}
  const financing = tasks.financing ?? {}
  const finalPayment = tasks.finalPayment ?? {}
  const agreements = tasks.agreements ?? {}
  const delivery = tasks.deliveryAcceptance ?? {}

  const regData = reg.regData ?? {}
  const regDetails = regData.regDetails ?? {}
  const owner = regDetails.owner?.user ?? {}
  const regAddress = regData.registrationAddress ?? {}
  const deliveryDetails = regData.deliveryDetails ?? {}
  const deliveryAddr = deliveryDetails.address ?? {}
  const identity = regDetails.primaryRegistrantIdentityInfo ?? {}
  const orderContact = regData.orderContact ?? {}
  const orderUser = orderContact.user ?? {}
  const orderAddr = orderContact.address ?? {}

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('details.back')}
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {modelCode && (
          <div className="aspect-[21/9] bg-gray-800 overflow-hidden">
            <VehicleImage
              modelCode={modelCode}
              optionCodes={order.mktOptions}
              size={800}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{t('details.order')} {orderId}</h2>
            {status && <StatusBadge status={status} />}
          </div>

          {/* Email Notifications */}
          <SubscribeForm />

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
            {(['overview', 'tasks', 'json'] as Tab[]).map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  tab === tb ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tb === 'overview' ? t('details.tab.overview') : tb === 'tasks' ? t('details.tab.tasks') : t('details.tab.json')}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-5 bg-gray-800 rounded w-2/3" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && tab === 'overview' && (
            <div className="space-y-6">
              {/* Vehicle */}
              <Section title={t('section.vehicle')}>
                <Row label="Model" value={delivery.model ?? modelCode} />
                <Row label="VIN" value={vin ?? 'Pending'} muted={!vin} />
                {order.mktOptions && <Row label="Options" value={order.mktOptions} />}
                {regData.vehicleTitleStatus && <Row label="Title Status" value={regData.vehicleTitleStatus} />}
              </Section>

              {/* Order Contact */}
              {orderUser.firstName && (
                <Section title={t('section.orderContact')}>
                  <Row label="Name" value={`${orderUser.firstName} ${orderUser.lastName}`} />
                  <Row label="Email" value={orderUser.emailAddress ?? ''} />
                  <Row label="Phone" value={orderUser.phoneNumber ? `+${orderUser.phoneDialingPrefix ?? ''} ${orderUser.phoneNumber}` : ''} />
                  {orderAddr.address1 && (
                    <Row label="Address" value={formatAddress(orderAddr)} />
                  )}
                </Section>
              )}

              {/* Registrant */}
              {owner.firstName && (
                <Section title={t('section.registrant')}>
                  <Row label="Name" value={`${owner.firstName} ${owner.lastName}`} />
                  <Row label="Email" value={owner.emailAddress ?? ''} />
                  <Row label="Phone" value={owner.phoneNumber ?? ''} />
                  {identity.idType && <Row label="ID Type" value={identity.idType.replace(/_/g, ' ')} />}
                  {identity.profession && <Row label="Profession" value={identity.profession} />}
                  {regDetails.owner?.gender && <Row label="Gender" value={regDetails.owner.gender} />}
                </Section>
              )}

              {/* Registration Address */}
              {regAddress.address1 && (
                <Section title={t('section.regAddress')}>
                  <Row label="Address" value={formatAddress(regAddress)} />
                </Section>
              )}

              {/* Delivery */}
              <Section title={t('section.delivery')}>
                <Row label="Type" value={humanize(scheduling.deliveryType ?? deliveryDetails.deliveryType ?? '')} />
                {scheduling.deliveryAddressTitle && (
                  <Row label="Location" value={scheduling.deliveryAddressTitle} />
                )}
                {deliveryAddr.address1 && (
                  <Row label="Delivery Address" value={formatAddress(deliveryAddr)} />
                )}
                {scheduling.deliveryAppointmentDate && (
                  <Row label="Appointment" value={scheduling.deliveryAppointmentDate} />
                )}
                {scheduling.selfSchedulingUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Schedule</span>
                    <a
                      href={scheduling.selfSchedulingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-400 hover:text-red-300 underline"
                    >
                      Schedule Delivery
                    </a>
                  </div>
                )}
              </Section>

              {/* Financing */}
              <Section title={t('section.financing')}>
                <Row label="Payment Method" value={financing.card?.messageBody ?? reg.orderType ?? ''} />
                <Row label="Status" value={financing.card?.title ?? ''} />
                {finalPayment.currencyFormat?.currencyCode && (
                  <Row label="Currency" value={finalPayment.currencyFormat.currencyCode} />
                )}
              </Section>

              {/* Final Payment */}
              <Section title={t('section.finalPayment')}>
                <Row label="Amount Due" value={String(finalPayment.amountDue ?? 'N/A')} />
                <Row label="Amount Sent" value={String(finalPayment.amountSent ?? 'N/A')} />
                <Row label="Status" value={finalPayment.card?.title ?? ''} />
              </Section>

              {/* Agreements */}
              {agreements.id && (
                <Section title={t('section.agreements')}>
                  <Row label="Status" value={agreements.card?.title ?? agreements.status ?? ''} />
                  {agreements.completedPackets?.length > 0 && (
                    <Row label="Completed" value={agreements.completedPackets.join(', ')} />
                  )}
                  {agreements.incompletePackets?.length > 0 && (
                    <Row label="Incomplete" value={agreements.incompletePackets.join(', ')} />
                  )}
                </Section>
              )}

              {/* Timeline */}
              <Section title={t('section.timeline')}>
                {regData.startedOn && <Row label="Registration Started" value={formatDate(regData.startedOn)} />}
                {regData.startedBy && <Row label="Started By" value={regData.startedBy} />}
                {regDetails.lastUpdateDatetime && <Row label="Last Updated" value={formatDate(regDetails.lastUpdateDatetime)} />}
              </Section>

            </div>
          )}

          {!loading && !error && tab === 'tasks' && (
            <div className="space-y-4">
              {Object.entries(tasks).map(([key, task]: [string, AnyJson]) => (
                <TaskCard key={key} name={key} task={task} />
              ))}
            </div>
          )}

          {!loading && !error && tab === 'json' && (
            <div className="space-y-4">
              <JsonBlock title="Order Data" data={order} />
              <JsonBlock title="Details API Response (tasks stripped of strings)" data={stripStrings(details)} />
              <details className="group">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300">
                  Full API Response (with strings)
                </summary>
                <pre className="mt-2 bg-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskCard({ name, task }: { name: string; task: AnyJson }) {
  const [expanded, setExpanded] = useState(false)
  const card = task.card ?? {}
  const isComplete = task.complete === true

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isComplete ? 'bg-green-500' : task.enabled === false ? 'bg-gray-600' : 'bg-amber-500'}`} />
          <div>
            <h4 className="text-white font-medium">{task.strings?.name ?? humanize(name)}</h4>
            <p className="text-sm text-gray-400">{card.title ?? (isComplete ? 'Complete' : 'Pending')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {card.messageBody && typeof card.messageBody === 'string' && (
            <span className="text-sm text-gray-300 hidden sm:block">{card.messageBody}</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3 space-y-2">
          <Row label="ID" value={task.id ?? name} />
          <Row label="Required" value={task.required ? 'Yes' : 'No'} />
          <Row label="Enabled" value={task.enabled ? 'Yes' : 'No'} />
          <Row label="Complete" value={isComplete ? 'Yes' : 'No'} />
          {task.status && <Row label="Status" value={String(task.status)} />}
          {task.order != null && <Row label="Order" value={String(task.order)} />}
          {card.messageTitle && <Row label={card.messageTitle} value={String(card.messageBody ?? '')} />}
          {card.subtitle && <Row label="Info" value={card.subtitle} />}

          {/* Task-specific fields */}
          <TaskSpecificFields name={name} task={task} />
        </div>
      )}
    </div>
  )
}

function TaskSpecificFields({ name, task }: { name: string; task: AnyJson }) {
  if (name === 'scheduling') {
    return (
      <>
        {task.deliveryType && <Row label="Delivery Type" value={humanize(task.deliveryType)} />}
        {task.deliveryAddressTitle && <Row label="Delivery Location" value={task.deliveryAddressTitle} />}
        {task.deliveryAppointmentDate && <Row label="Appointment" value={task.deliveryAppointmentDate} />}
        {task.modelCode && <Row label="Model Code" value={task.modelCode} />}
        {task.countryCode && <Row label="Country" value={task.countryCode} />}
        <Row label="Matched/Inventory" value={task.isInventoryOrMatched ? 'Yes' : 'No'} />
        <Row label="Ready to Accept" value={task.readyToAccept ? 'Yes' : 'No'} />
        <Row label="Self-Scheduling Available" value={task.isSelfSchedulingAvailable ? 'Yes' : 'No'} />
        {task.selfSchedulingUrl && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Schedule Link</span>
            <a href={task.selfSchedulingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-red-400 hover:text-red-300 underline truncate max-w-[60%]">
              Open Scheduling
            </a>
          </div>
        )}
      </>
    )
  }

  if (name === 'registration') {
    return (
      <>
        {task.customerType && <Row label="Customer Type" value={task.customerType} />}
        {task.orderType && <Row label="Order Type" value={task.orderType} />}
        {task.country && <Row label="Country" value={task.country} />}
        {task.currentStep && <Row label="Current Step" value={humanize(task.currentStep)} />}
        <Row label="Matched" value={task.isMatched ? 'Yes' : 'No'} />
        {task.vehicleTitleStatus && <Row label="Title Status" value={task.vehicleTitleStatus} />}
        {task.alertStatuses && (
          <div className="mt-2 space-y-1">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Alert Statuses</span>
            {Object.entries(task.alertStatuses).map(([k, v]: [string, AnyJson]) => (
              <div key={k} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${v === 'COMPLETE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-gray-300">{humanize(k)}</span>
                <span className={`text-xs ml-auto ${v === 'COMPLETE' ? 'text-green-400' : 'text-amber-400'}`}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  if (name === 'finalPayment') {
    return (
      <>
        {task.amountDue != null && <Row label="Amount Due" value={String(task.amountDue)} />}
        {task.amountSent != null && <Row label="Amount Sent" value={String(task.amountSent)} />}
        {task.currencyFormat?.currencyCode && <Row label="Currency" value={task.currencyFormat.currencyCode} />}
        <Row label="Accessible" value={task.accessible ? 'Yes' : 'No'} />
      </>
    )
  }

  if (name === 'agreements') {
    return (
      <>
        {task.eSignStatus && <Row label="eSign Status" value={task.eSignStatus} />}
        {task.signatureStatus !== undefined && <Row label="Signature Status" value={task.signatureStatus || 'N/A'} />}
        {task.completedPackets?.length > 0 && <Row label="Completed Packets" value={task.completedPackets.join(', ')} />}
        {task.incompletePackets?.length > 0 && <Row label="Incomplete Packets" value={task.incompletePackets.join(', ')} />}
        {task.countryCode && <Row label="Country" value={task.countryCode} />}
      </>
    )
  }

  if (name === 'deliveryAcceptance') {
    return (
      <>
        {task.model && <Row label="Model" value={task.model} />}
        {task.deliveryType && <Row label="Delivery Type" value={humanize(task.deliveryType)} />}
        <Row label="Vehicle Ready" value={task.vehicleIsReady ? 'Yes' : 'No'} />
        <Row label="Has Blocker" value={task.hasBlocker ? 'Yes' : 'No'} />
        <Row label="Is Pickup" value={task.isPickup ? 'Yes' : 'No'} />
        {task.appointmentDate && <Row label="Appointment" value={task.appointmentDate} />}
      </>
    )
  }

  if (name === 'financing') {
    return (
      <>
        {task.status && <Row label="Finance Status" value={humanize(task.status)} />}
        <Row label="Finance Intent" value={task.financeIntent ? 'Yes' : 'No'} />
        <Row label="Third Party Hosted" value={task.thirdPartyHosted ? 'Yes' : 'No'} />
      </>
    )
  }

  return null
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  if (!value && value !== '0') return null
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 text-sm flex-shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${muted ? 'text-gray-600' : 'text-gray-200'}`}>{value}</span>
    </div>
  )
}

function JsonBlock({ title, data }: { title: string; data: AnyJson }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <pre className="bg-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function stripStrings(obj: AnyJson): AnyJson {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripStrings)
  const result: Record<string, AnyJson> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'strings') continue
    result[k] = stripStrings(v)
  }
  return result
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatAddress(addr: AnyJson): string {
  const parts = [addr.address1, addr.address2, addr.city, addr.stateProvince, addr.countryCode].filter(Boolean)
  return parts.join(', ')
}

function humanize(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}
