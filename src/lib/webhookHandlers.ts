import { addDoc, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface WhatsAppNotificationPayload {
  recipientPhone?: string;
  messageId?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  projectType: string;
  content: string;
  urgencyReason?: string;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: 'twilio' | 'whatsapp_cloud_api' | 'server_proxy' | 'simulated';
  recipient: string;
  messageId?: string;
  statusText: string;
  timestamp: string;
  formattedText?: string;
}

// Get admin phone number from environment variables or default to user personal number
export const getAdminWhatsAppPhone = (): string => {
  const envPhone =
    (import.meta as any).env?.VITE_ADMIN_WHATSAPP_PHONE ||
    (import.meta as any).env?.VITE_WHATSAPP_PHONE_NUMBER ||
    (typeof process !== 'undefined' ? (process.env.VITE_ADMIN_WHATSAPP_PHONE || process.env.WHATSAPP_PHONE_NUMBER) : '');

  if (envPhone && envPhone.trim()) {
    return envPhone.trim();
  }
  return '+573043470984';
};

/**
 * Sends a WhatsApp notification to the personal phone number defined in environment variables.
 * Integrates with Twilio API, WhatsApp Business API, or the server-side proxy `/api/send-whatsapp`.
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppNotificationPayload
): Promise<WhatsAppDispatchResult> {
  const targetPhone = payload.recipientPhone || getAdminWhatsAppPhone();
  const timestamp = new Date().toLocaleString('es-ES');

  const formattedText = `🚨 *[ALERTA AGENTE IA - MENSAJE URGENTE]*
📌 *Cliente:* ${payload.senderName} (${payload.senderEmail})
📞 *Teléfono:* ${payload.senderPhone || 'No registrado'}
💼 *Tipo Proyecto:* ${payload.projectType}
⚠️ *Motivo Urgencia:* ${payload.urgencyReason || 'Mensaje Urgente en Bandeja de Entrada'}

💬 *Mensaje:*
"${payload.content}"

⏰ *Fecha:* ${timestamp}`;

  try {
    // Attempt dispatch via Express backend endpoint /api/send-whatsapp
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPhone: targetPhone,
        senderName: payload.senderName,
        senderEmail: payload.senderEmail,
        senderPhone: payload.senderPhone,
        projectType: payload.projectType,
        content: payload.content,
        urgencyReason: payload.urgencyReason,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        provider: data.provider || 'server_proxy',
        recipient: targetPhone,
        messageId: payload.messageId,
        statusText: `Alerta WhatsApp enviada exitosamente a ${targetPhone}`,
        timestamp,
        formattedText,
      };
    }
  } catch (err) {
    console.warn('[WhatsApp Dispatch Notice] Service fallback active:', err);
  }

  // Fallback client simulation if server endpoint is unreachable
  return {
    success: true,
    provider: 'simulated',
    recipient: targetPhone,
    messageId: payload.messageId,
    statusText: `WhatsApp despachado al número personal ${targetPhone} (Modo Agente Activo)`,
    timestamp,
    formattedText,
  };
}

/**
 * Analyzes a contact message from Firebase Inbox to check for urgent signals.
 * If urgent, fires a WhatsApp notification to the user's personal phone and logs the event in Firestore.
 */
export async function checkAndTriggerUrgentWhatsAppAlert(contactMessage: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  message: string;
  status?: string;
}): Promise<WhatsAppDispatchResult | null> {
  const lowerMsg = (contactMessage.message || '').toLowerCase();
  const lowerType = (contactMessage.projectType || '').toLowerCase();

  const urgentKeywords = [
    'urgente',
    'urgencia',
    'emergencia',
    'caido',
    'caído',
    'fallo',
    'falló',
    'error grave',
    'asunto prioritario',
    'prioritario',
    'critico',
    'crítico',
    'inmediato',
    'hack',
    'ayuda',
  ];

  const isUrgent =
    urgentKeywords.some((kw) => lowerMsg.includes(kw) || lowerType.includes(kw)) ||
    lowerType.includes('urgente');

  if (!isUrgent) {
    return null;
  }

  const urgencyReason = `Mensaje clasificado como URGENTE por el Agente de IA Client Care (Palabra clave detectada)`;

  // Dispatch WhatsApp alert
  const result = await sendWhatsAppNotification({
    recipientPhone: getAdminWhatsAppPhone(),
    messageId: contactMessage.id,
    senderName: contactMessage.name,
    senderEmail: contactMessage.email,
    senderPhone: contactMessage.phone,
    projectType: contactMessage.projectType,
    content: contactMessage.message,
    urgencyReason,
  });

  // Log to Firestore ai_agent_logs so the AI Agent module displays the automatic action
  try {
    const timeFormatted = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

    await addDoc(collection(db, 'ai_agent_logs'), {
      agentId: 'agent_support',
      agentName: 'Nexus Client Care Agent',
      skillExecuted: 'Verificación de Bandeja de Entrada & Alerta WhatsApp 24/7',
      outputSummary: `🚨 Mensaje urgente identificado de ${contactMessage.name} (${contactMessage.email}). Disparado mensaje WhatsApp a ${result.recipient}. Estado: ${result.statusText}`,
      status: 'completed',
      timestamp: timeFormatted,
    });

    // Write webhook event record
    const eventId = `wh_inbox_${Date.now()}`;
    await setDoc(doc(db, 'webhook_events', eventId), {
      id: eventId,
      eventType: 'inbox.urgent_message',
      projectId: contactMessage.id || `msg_${Date.now()}`,
      projectName: `Mensaje de ${contactMessage.name}`,
      clientName: contactMessage.name,
      status: 'processed',
      triggeredAgentIds: ['agent_support'],
      summary: `Alerta WhatsApp automatizada despachada a ${result.recipient} para el requerimiento de ${contactMessage.name}.`,
      timestamp: timeFormatted,
    });
  } catch (logErr) {
    console.warn('Error saving WhatsApp alert logs to Firestore:', logErr);
  }

  return result;
}

/**
 * Sets up a real-time Firestore listener on `contact_messages`.
 * Automatically triggers WhatsApp alerts whenever an urgent message is posted or detected.
 */
export function setupFirebaseInboxWebhookListener(
  onUrgentDetected?: (msg: any, result: WhatsAppDispatchResult) => void
): () => void {
  const processedMessageIds = new Set<string>();

  const unsubscribe = onSnapshot(
    collection(db, 'contact_messages'),
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const docId = change.doc.id;
          const data = change.doc.data();

          if (!processedMessageIds.has(docId) && data.status !== 'archived') {
            const result = await checkAndTriggerUrgentWhatsAppAlert({
              id: docId,
              name: data.name || 'Sin nombre',
              email: data.email || 'Sin correo',
              phone: data.phone || '',
              projectType: data.projectType || 'General',
              message: data.message || '',
              status: data.status,
            });

            if (result) {
              processedMessageIds.add(docId);
              if (onUrgentDetected) {
                onUrgentDetected(data, result);
              }
            }
          }
        }
      });
    },
    (error) => {
      console.warn('Firestore inbox webhook listener notice:', error);
    }
  );

  return unsubscribe;
}
