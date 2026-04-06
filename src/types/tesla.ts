export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
}

export interface PKCEPair {
  code_verifier: string
  code_challenge: string
}

export interface TeslaOrder {
  referenceNumber: string
  modelCode: string
  orderStatus: string
  vin: string | null
  isB2b?: boolean
  ownerCompanyName?: string
  isUsed?: boolean
  mktOptions?: string
}

export interface OrderTask {
  scheduling?: {
    deliveryWindow?: {
      startDate?: string
      endDate?: string
    }
    appointmentDate?: string
    appointmentTime?: string
    deliveryAddress?: string
    deliveryType?: string
    deliveryCenter?: string
  }
  registration?: {
    vehicleRoutingLocation?: string
    odometer?: number
    reservationDate?: string
    orderBookedDate?: string
    licensePlate?: string
  }
  finalPayment?: {
    etaToDeliveryCenter?: string
  }
  deliveryAcceptance?: {
    gates?: DeliveryGate[]
  }
}

export interface DeliveryGate {
  name: string
  status: string
  type: string
}

export interface OrderDetailsResponse {
  tasks: OrderTask
}
