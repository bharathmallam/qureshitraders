const PROXY_URL = 'https://your-proxy-server.com';  // You'll need to set this up

export const sendSMS = async (phone, name, amount, date) => {
  const params = new URLSearchParams({
    user: 'QureshiTraders_BW',
    pass: '123456',
    sender: 'BUZWAP',
    phone: phone,
    text: 'transaction_alert',
    params: `${name},${amount},${date}`,
    priority: 'wa',
    stype: 'normal'
  });

  const response = await fetch(`${PROXY_URL}/send-sms?${params}`);
  if (!response.ok) {
    throw new Error('Failed to send SMS');
  }
  return response.text();
}; 