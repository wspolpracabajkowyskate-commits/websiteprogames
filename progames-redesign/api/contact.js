const TO_EMAIL = process.env.CONTACT_TO || 'office@progames.pl';
const FROM_EMAIL = process.env.CONTACT_FROM || 'Pro Games Website <website@progames.pl>';

function clean(value, max = 2000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, max);
}
function esc(value) {
  return clean(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 160);
  const company = clean(body.company, 160);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 80);
  const product = clean(body.product, 180);
  const message = clean(body.message, 5000);
  const language = clean(body.language, 10) === 'es' ? 'ES' : 'EN';

  if (!name || !email || !message || !validEmail(email)) {
    return res.status(400).json({ error: 'Invalid form data' });
  }

  const subject = `[Pro Games website] ${product ? product + ' — ' : ''}${name}`;
  const text = [
    'New inquiry from the Pro Games website', '',
    `Language: ${language}`,
    `Name: ${name}`,
    `Company: ${company || '-'}`,
    `Email: ${email}`,
    `Phone: ${phone || '-'}`,
    `Product: ${product || '-'}`, '',
    'Message:', message
  ].join('\n');

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#111">
    <h2>New inquiry from Pro Games website</h2>
    <table style="border-collapse:collapse;width:100%;font-size:15px">
      <tr><td style="padding:8px 0;color:#666">Language</td><td><b>${esc(language)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#666">Name</td><td><b>${esc(name)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#666">Company</td><td>${esc(company || '-')}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#666">Phone</td><td>${esc(phone || '-')}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Product</td><td>${esc(product || '-')}</td></tr>
    </table>
    <div style="margin-top:24px;padding:20px;background:#f4f5f6;border-radius:14px;white-space:pre-wrap">${esc(message)}</div>
  </div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text,
        html
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(502).json({ error: 'Email delivery failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
};
