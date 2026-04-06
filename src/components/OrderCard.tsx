import { StatusBadge } from './StatusBadge'
import { VehicleImage } from './VehicleImage'

const MODEL_NAMES: Record<string, string> = {
  ms: 'Model S',
  m3: 'Model 3',
  mx: 'Model X',
  my: 'Model Y',
  mt: 'Cybertruck',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const modelCode = order.modelCode ?? ''
  const modelName = MODEL_NAMES[modelCode.toLowerCase()] ?? (modelCode || 'Tesla')
  const status = order.orderStatus ?? order.status ?? ''
  const vin = order.vin ?? null
  const refNum = order.referenceNumber ?? order.orderNumber ?? ''

  return (
    <button
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-lg hover:shadow-black/20 transition-all text-left w-full"
    >
      <div className="aspect-[16/9] bg-gray-800 overflow-hidden">
        <VehicleImage
          modelCode={modelCode}
          optionCodes={order.mktOptions}
          size={400}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{modelName}</h3>
          {status && <StatusBadge status={status} />}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order</span>
            <span className="text-gray-300">{refNum}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">VIN</span>
            <span className={vin ? 'text-gray-300' : 'text-gray-600'}>
              {vin ?? 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
