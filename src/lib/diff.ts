export interface Change {
  field: string
  label: string
  oldValue: string | null
  newValue: string | null
}

export interface Snapshot {
  vin: string | null
  order_status: string | null
  tasks_complete: Record<string, boolean>
  delivery_window: string | null
  appointment_date: string | null
  odometer: string | null
  routing_location: string | null
  eta_delivery_center: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractSnapshot(order: any, details: any): Snapshot {
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

export function diffSnapshots(
  oldSnap: Partial<Snapshot> | null,
  newSnap: Snapshot,
): Change[] {
  const changes: Change[] = []

  if (!oldSnap) return changes

  // VIN assigned
  if (!oldSnap.vin && newSnap.vin) {
    changes.push({ field: 'vin', label: 'VIN Assigned', oldValue: null, newValue: newSnap.vin })
  } else if (oldSnap.vin && newSnap.vin && oldSnap.vin !== newSnap.vin) {
    changes.push({ field: 'vin', label: 'VIN Changed', oldValue: oldSnap.vin, newValue: newSnap.vin })
  }

  // Order status
  if (oldSnap.order_status !== newSnap.order_status) {
    changes.push({ field: 'order_status', label: 'Order Status Changed', oldValue: oldSnap.order_status ?? null, newValue: newSnap.order_status })
  }

  // Task completions
  const oldTasks = oldSnap.tasks_complete ?? {}
  for (const [taskName, isComplete] of Object.entries(newSnap.tasks_complete)) {
    if (isComplete && !oldTasks[taskName]) {
      changes.push({ field: `task_${taskName}`, label: `${humanize(taskName)} Completed`, oldValue: 'incomplete', newValue: 'complete' })
    }
  }

  // Delivery window
  if (!oldSnap.delivery_window && newSnap.delivery_window) {
    changes.push({ field: 'delivery_window', label: 'Delivery Window Set', oldValue: null, newValue: newSnap.delivery_window })
  } else if (oldSnap.delivery_window && newSnap.delivery_window && oldSnap.delivery_window !== newSnap.delivery_window) {
    changes.push({ field: 'delivery_window', label: 'Delivery Window Updated', oldValue: oldSnap.delivery_window, newValue: newSnap.delivery_window })
  }

  // Appointment
  if (!oldSnap.appointment_date && newSnap.appointment_date) {
    changes.push({ field: 'appointment_date', label: 'Delivery Appointment Scheduled', oldValue: null, newValue: newSnap.appointment_date })
  } else if (oldSnap.appointment_date && newSnap.appointment_date && oldSnap.appointment_date !== newSnap.appointment_date) {
    changes.push({ field: 'appointment_date', label: 'Delivery Appointment Changed', oldValue: oldSnap.appointment_date, newValue: newSnap.appointment_date })
  }

  // Odometer
  if (!oldSnap.odometer && newSnap.odometer) {
    changes.push({ field: 'odometer', label: 'Vehicle Odometer Appeared', oldValue: null, newValue: newSnap.odometer })
  } else if (oldSnap.odometer && newSnap.odometer && oldSnap.odometer !== newSnap.odometer) {
    changes.push({ field: 'odometer', label: 'Vehicle Odometer Changed', oldValue: oldSnap.odometer, newValue: newSnap.odometer })
  }

  // Routing location
  if (oldSnap.routing_location !== newSnap.routing_location && newSnap.routing_location) {
    changes.push({ field: 'routing_location', label: 'Vehicle Location Changed', oldValue: oldSnap.routing_location ?? null, newValue: newSnap.routing_location })
  }

  // ETA
  if (oldSnap.eta_delivery_center !== newSnap.eta_delivery_center && newSnap.eta_delivery_center) {
    changes.push({ field: 'eta_delivery_center', label: 'ETA to Delivery Center Updated', oldValue: oldSnap.eta_delivery_center ?? null, newValue: newSnap.eta_delivery_center })
  }

  return changes
}

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim()
}
