import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'en' | 'es'

const translations = {
  // LoginPage
  'app.title': { en: 'Tesla Delivery Tracker', es: 'Rastreador de Entrega Tesla' },
  'app.subtitle': { en: 'Track your Tesla order status in real time', es: 'Rastrea el estado de tu pedido Tesla en tiempo real' },
  'login.description': {
    en: 'Sign in with your Tesla account to view your order status, delivery window, and vehicle details.',
    es: 'Inicia sesión con tu cuenta Tesla para ver el estado de tu pedido, ventana de entrega y detalles del vehículo.',
  },
  'login.signIn': { en: 'Sign in with Tesla', es: 'Iniciar sesión con Tesla' },
  'login.step1': { en: 'Complete sign-in in the new tab', es: 'Completa el inicio de sesión en la nueva pestaña' },
  'login.step2': { en: 'Copy the URL from the blank page you land on', es: 'Copia la URL de la página en blanco' },
  'login.step3': { en: 'Paste it below', es: 'Pégala abajo' },
  'login.placeholder': { en: 'Paste callback URL here...', es: 'Pega la URL de callback aquí...' },
  'login.cancel': { en: 'Cancel', es: 'Cancelar' },
  'login.submit': { en: 'Complete Sign In', es: 'Completar Inicio de Sesión' },
  'login.submitting': { en: 'Signing in...', es: 'Iniciando sesión...' },
  'login.popupBlocked': { en: 'Popup blocked?', es: '¿Ventana bloqueada?' },
  'login.openManually': { en: 'Open sign-in manually', es: 'Abrir inicio de sesión manualmente' },
  'login.error.start': { en: 'Failed to start sign-in', es: 'Error al iniciar sesión' },
  'login.error.complete': { en: 'Failed to complete sign-in', es: 'Error al completar el inicio de sesión' },

  // Layout
  'layout.signOut': { en: 'Sign Out', es: 'Cerrar Sesión' },

  // OrderList
  'orders.title': { en: 'Your Orders', es: 'Tus Pedidos' },
  'orders.refresh': { en: 'Refresh', es: 'Actualizar' },
  'orders.error': { en: 'Failed to load orders', es: 'Error al cargar pedidos' },
  'orders.tryAgain': { en: 'Try Again', es: 'Intentar de Nuevo' },
  'orders.empty': { en: 'No orders found.', es: 'No se encontraron pedidos.' },

  // OrderCard
  'card.order': { en: 'Order', es: 'Pedido' },
  'card.vin': { en: 'VIN', es: 'VIN' },
  'card.pending': { en: 'Pending', es: 'Pendiente' },

  // OrderDetails
  'details.back': { en: 'Back to Orders', es: 'Volver a Pedidos' },
  'details.order': { en: 'Order', es: 'Pedido' },
  'details.tab.overview': { en: 'Overview', es: 'Resumen' },
  'details.tab.tasks': { en: 'Tasks', es: 'Tareas' },
  'details.tab.json': { en: 'Raw JSON', es: 'JSON Crudo' },
  'details.error': { en: 'Failed to load order details', es: 'Error al cargar detalles del pedido' },

  // Sections
  'section.vehicle': { en: 'Vehicle', es: 'Vehículo' },
  'section.orderContact': { en: 'Order Contact', es: 'Contacto del Pedido' },
  'section.registrant': { en: 'Registrant', es: 'Registrante' },
  'section.regAddress': { en: 'Registration Address', es: 'Dirección de Registro' },
  'section.delivery': { en: 'Delivery', es: 'Entrega' },
  'section.financing': { en: 'Financing', es: 'Financiamiento' },
  'section.finalPayment': { en: 'Final Payment', es: 'Pago Final' },
  'section.agreements': { en: 'Agreements', es: 'Acuerdos' },
  'section.timeline': { en: 'Timeline', es: 'Cronología' },
  'section.location': { en: 'Location', es: 'Ubicación' },

  // Labels
  'label.model': { en: 'Model', es: 'Modelo' },
  'label.vin': { en: 'VIN', es: 'VIN' },
  'label.options': { en: 'Options', es: 'Opciones' },
  'label.titleStatus': { en: 'Title Status', es: 'Estado del Título' },
  'label.name': { en: 'Name', es: 'Nombre' },
  'label.email': { en: 'Email', es: 'Correo' },
  'label.phone': { en: 'Phone', es: 'Teléfono' },
  'label.address': { en: 'Address', es: 'Dirección' },
  'label.idType': { en: 'ID Type', es: 'Tipo de ID' },
  'label.profession': { en: 'Profession', es: 'Profesión' },
  'label.gender': { en: 'Gender', es: 'Género' },
  'label.type': { en: 'Type', es: 'Tipo' },
  'label.location': { en: 'Location', es: 'Ubicación' },
  'label.deliveryAddress': { en: 'Delivery Address', es: 'Dirección de Entrega' },
  'label.appointment': { en: 'Appointment', es: 'Cita' },
  'label.schedule': { en: 'Schedule', es: 'Programar' },
  'label.scheduleDelivery': { en: 'Schedule Delivery', es: 'Programar Entrega' },
  'label.paymentMethod': { en: 'Payment Method', es: 'Método de Pago' },
  'label.status': { en: 'Status', es: 'Estado' },
  'label.currency': { en: 'Currency', es: 'Moneda' },
  'label.amountDue': { en: 'Amount Due', es: 'Monto Adeudado' },
  'label.amountSent': { en: 'Amount Sent', es: 'Monto Enviado' },
  'label.completed': { en: 'Completed', es: 'Completado' },
  'label.incomplete': { en: 'Incomplete', es: 'Incompleto' },
  'label.regStarted': { en: 'Registration Started', es: 'Registro Iniciado' },
  'label.startedBy': { en: 'Started By', es: 'Iniciado Por' },
  'label.lastUpdated': { en: 'Last Updated', es: 'Última Actualización' },
  'label.vehicleLocation': { en: 'Vehicle Location', es: 'Ubicación del Vehículo' },

  // Task fields
  'task.id': { en: 'ID', es: 'ID' },
  'task.required': { en: 'Required', es: 'Requerido' },
  'task.enabled': { en: 'Enabled', es: 'Habilitado' },
  'task.complete': { en: 'Complete', es: 'Completo' },
  'task.pending': { en: 'Pending', es: 'Pendiente' },
  'task.yes': { en: 'Yes', es: 'Sí' },
  'task.no': { en: 'No', es: 'No' },
  'task.info': { en: 'Info', es: 'Info' },
  'task.deliveryType': { en: 'Delivery Type', es: 'Tipo de Entrega' },
  'task.deliveryLocation': { en: 'Delivery Location', es: 'Lugar de Entrega' },
  'task.modelCode': { en: 'Model Code', es: 'Código de Modelo' },
  'task.country': { en: 'Country', es: 'País' },
  'task.matched': { en: 'Matched', es: 'Asignado' },
  'task.matchedInventory': { en: 'Matched/Inventory', es: 'Asignado/Inventario' },
  'task.readyToAccept': { en: 'Ready to Accept', es: 'Listo para Aceptar' },
  'task.selfScheduling': { en: 'Self-Scheduling Available', es: 'Auto-programación Disponible' },
  'task.scheduleLink': { en: 'Schedule Link', es: 'Enlace de Programación' },
  'task.openScheduling': { en: 'Open Scheduling', es: 'Abrir Programación' },
  'task.customerType': { en: 'Customer Type', es: 'Tipo de Cliente' },
  'task.orderType': { en: 'Order Type', es: 'Tipo de Pedido' },
  'task.currentStep': { en: 'Current Step', es: 'Paso Actual' },
  'task.alertStatuses': { en: 'Alert Statuses', es: 'Estados de Alerta' },
  'task.financeStatus': { en: 'Finance Status', es: 'Estado Financiero' },
  'task.financeIntent': { en: 'Finance Intent', es: 'Intención Financiera' },
  'task.thirdParty': { en: 'Third Party Hosted', es: 'Alojado por Terceros' },
  'task.vehicleReady': { en: 'Vehicle Ready', es: 'Vehículo Listo' },
  'task.hasBlocker': { en: 'Has Blocker', es: 'Tiene Bloqueo' },
  'task.isPickup': { en: 'Is Pickup', es: 'Es Recogida' },
  'task.eSignStatus': { en: 'eSign Status', es: 'Estado de Firma Electrónica' },
  'task.signatureStatus': { en: 'Signature Status', es: 'Estado de Firma' },
  'task.completedPackets': { en: 'Completed Packets', es: 'Paquetes Completados' },
  'task.incompletePackets': { en: 'Incomplete Packets', es: 'Paquetes Incompletos' },

  // JSON tab
  'json.orderData': { en: 'Order Data', es: 'Datos del Pedido' },
  'json.detailsStripped': { en: 'Details API Response (tasks stripped of strings)', es: 'Respuesta API de Detalles (sin cadenas de texto)' },
  'json.fullResponse': { en: 'Full API Response (with strings)', es: 'Respuesta API Completa (con cadenas de texto)' },
  'json.noTasks': { en: 'No task data available.', es: 'No hay datos de tareas disponibles.' },

  // Subscribe
  'subscribe.title': { en: 'Email Notifications', es: 'Notificaciones por Correo' },
  'subscribe.description': { en: 'Get notified when your order status changes', es: 'Recibe notificaciones cuando cambie el estado de tu pedido' },
  'subscribe.placeholder': { en: 'your@email.com', es: 'tu@correo.com' },
  'subscribe.button': { en: 'Notify Me', es: 'Notificarme' },
  'subscribe.subscribing': { en: 'Subscribing...', es: 'Suscribiendo...' },
  'subscribe.subscribed': { en: 'Subscribed:', es: 'Suscrito:' },
  'subscribe.unsubscribe': { en: 'Unsubscribe', es: 'Cancelar Suscripción' },
  'subscribe.unsubscribing': { en: 'Unsubscribing...', es: 'Cancelando suscripción...' },
  'subscribe.error': { en: 'Subscription failed', es: 'Error en la suscripción' },
  'subscribe.error.generic': { en: 'Failed to subscribe. Please try again.', es: 'Error al suscribirse. Inténtalo de nuevo.' },
  'subscribe.error.unsub': { en: 'Failed to unsubscribe', es: 'Error al cancelar suscripción' },
  'subscribe.success.unsub': { en: 'Unsubscribed successfully', es: 'Suscripción cancelada exitosamente' },
} as const

type TranslationKey = keyof typeof translations

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const LANG_KEY = 'tesla-tracker-lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'es' || stored === 'en') return stored
    return navigator.language.startsWith('es') ? 'es' : 'en'
  })

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }

  function t(key: TranslationKey): string {
    return translations[key]?.[lang] ?? translations[key]?.['en'] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

// For use outside React (e.g., email templates called from API)
export function getTranslation(key: TranslationKey, lang: Lang): string {
  return translations[key]?.[lang] ?? translations[key]?.['en'] ?? key
}

// Re-export for convenience
export { useEffect }
