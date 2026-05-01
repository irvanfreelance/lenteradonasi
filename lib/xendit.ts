/**
 * Xendit Payment Request API Helper
 * Documentation: https://developers.xendit.co/api-reference/payment-requests/
 */

const XENDIT_API_KEY = process.env.XENDIT_API_KEY;
const XENDIT_BASE_URL = 'https://api.xendit.co';

export type XenditPaymentType = 'VIRTUAL_ACCOUNT' | 'EWALLET' | 'OVER_THE_COUNTER' | 'QR_CODE';

interface CreatePaymentRequestParams {
  externalId: string;
  amount: number;
  currency: 'IDR';
  type: XenditPaymentType;
  channelCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  successReturnUrl?: string;
}

export async function createXenditPaymentRequest({
  externalId,
  amount,
  currency,
  type,
  channelCode,
  customerName,
  customerEmail,
  customerPhone,
  successReturnUrl
}: CreatePaymentRequestParams) {
  if (!XENDIT_API_KEY) {
    throw new Error('XENDIT_API_KEY is not defined in environment variables');
  }

  const authHeader = `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`;

  const payload: any = {
    reference_id: externalId,
    amount,
    currency,
    country: 'ID',
    payment_method: {
      type,
      reusability: 'ONE_TIME_USE',
    },
    metadata: {
      invoice_code: externalId
    }
  };

  // Channel specific properties
  if (type === 'VIRTUAL_ACCOUNT') {
    payload.payment_method.virtual_account = {
      channel_code: channelCode,
      channel_properties: {
        customer_name: customerName,
      }
    };
  } else if (type === 'EWALLET') {
    let formattedPhone = customerPhone;
    if (formattedPhone && formattedPhone.startsWith('0')) {
      formattedPhone = '+62' + formattedPhone.slice(1);
    } else if (formattedPhone && formattedPhone.startsWith('62')) {
      formattedPhone = '+' + formattedPhone;
    }

    payload.payment_method.ewallet = {
      channel_code: channelCode,
      channel_properties: {
        success_return_url: successReturnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/status/${externalId}`
      }
    };
    if (formattedPhone) {
      payload.payment_method.ewallet.channel_properties.mobile_number = formattedPhone;
    }
  } else if (type === 'OVER_THE_COUNTER') {
    payload.payment_method.over_the_counter = {
      channel_code: channelCode,
      channel_properties: {
        customer_name: customerName,
      }
    };
  } else if (type === 'QR_CODE') {
    payload.payment_method.qr_code = {
      channel_code: undefined,
    };
  }

  const response = await fetch(`${XENDIT_BASE_URL}/payment_requests`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'X-IDEMPOTENCY-KEY': externalId
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Xendit API Error:', data);
    throw new Error(data.message || 'Failed to create payment request with Xendit');
  }

  return data;
}
