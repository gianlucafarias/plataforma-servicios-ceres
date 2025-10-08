/**
 * Workers/Consumidores para jobs de Slack
 * 
 * Procesamiento:
 * - Envía mensajes a Slack usando webhook
 * - Maneja errores silenciosamente para evitar loops
 */

interface SlackAlertData {
  text: string;
}

/**
 * Envía una alerta a Slack
 * 
 * @param data - Datos del mensaje
 */
export async function postToSlack(data: SlackAlertData | string) {
  const text = typeof data === 'string' ? data : data.text;
  const url = process.env.SLACK_WEBHOOK_URL;
  
  if (!url) {
    console.warn('[slack.worker] SLACK_WEBHOOK_URL no configurado');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Slack respondió con status ${response.status}`);
    }

    console.log(`[slack.worker] Alerta enviada a Slack: ${text.substring(0, 50)}...`);
  } catch (error) {
    // No lanzar error para evitar loops de retry
    // Si Slack falla, logueamos y continuamos
    console.error('[slack.worker] Error enviando a Slack:', error);
  }
}

