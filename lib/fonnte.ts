/**
 * Fonnte WhatsApp API Helper
 * Docs: https://docs.fonnte.com/api-send-message/
 */

interface FonnteSendParams {
  target: string;
  message: string;
  countryCode?: string;
}

interface FonnteResponse {
  status: boolean;
  detail?: string;
  process?: string;
  reason?: string;
  id?: string[];
  target?: string[];
}

export async function sendWhatsApp(params: FonnteSendParams): Promise<FonnteResponse> {
  const token = process.env.FONNTE_WHATSAPP_TOKEN;
  if (!token) {
    throw new Error('FONNTE_WHATSAPP_TOKEN is not configured');
  }

  const formData = new URLSearchParams();
  formData.append('target', params.target);
  formData.append('message', params.message);
  formData.append('countryCode', params.countryCode || '62');

  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': token,
    },
    body: formData,
  });

  const data = await res.json();
  return data as FonnteResponse;
}
