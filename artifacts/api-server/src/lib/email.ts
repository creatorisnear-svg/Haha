import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "vaaclothing.xyz@gmail.com";
const FROM_NAME = "VIGR Angel Apparel";
// Resend allows sending from onboarding@resend.dev without domain verification.
// Set EMAIL_FROM in env once you've verified vaaclothing.xyz on Resend.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const FROM = `${FROM_NAME} <${FROM_ADDRESS}>`;

interface OrderItem {
  productName: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function renderItemsTable(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;color:#e5e5e5;font-size:13px;">${item.productName} × ${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;color:#9a9a9a;font-size:13px;text-align:right;">${formatMoney(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function renderAddress(addr: ShippingAddress): string {
  const line2 = addr.line2 ? `${addr.line2}<br/>` : "";
  return `${addr.name}<br/>${addr.line1}<br/>${line2}${addr.city}, ${addr.state} ${addr.zip}<br/>${addr.country}`;
}

function customerHtml(data: OrderEmailData): string {
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">Order Confirmed</p>
      <h2 style="font-size:28px;letter-spacing:0.2em;margin:0;color:#ffffff;">${data.orderNumber}</h2>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Hey ${data.customerName.split(" ")[0] || "there"},</p>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Your order has been received and is being prepared. We'll send another note when it ships.</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Item</th>
          <th style="text-align:right;padding:8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${renderItemsTable(data.items)}</tbody>
      <tfoot>
        <tr>
          <td style="padding:16px 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em;">Total</td>
          <td style="padding:16px 8px;color:#ffffff;font-size:14px;font-weight:600;text-align:right;">${formatMoney(data.total)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin:24px 0;padding:16px;border:1px solid #2a2a2a;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;">Ship To</p>
      <p style="margin:0;color:#e5e5e5;font-size:13px;line-height:1.6;">${renderAddress(data.shippingAddress)}</p>
    </div>
    <p style="color:#9a9a9a;font-size:12px;line-height:1.6;margin-top:32px;">Questions? Reply to this email — it goes straight to us.</p>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
}

function adminHtml(data: OrderEmailData): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,sans-serif;background:#fff;color:#111;padding:24px;">
  <h2 style="margin:0 0 16px;">New order: ${data.orderNumber}</h2>
  <p><strong>${data.customerName}</strong> · ${data.customerEmail}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead><tr><th align="left" style="border-bottom:1px solid #ddd;padding:8px;">Item</th><th align="right" style="border-bottom:1px solid #ddd;padding:8px;">Subtotal</th></tr></thead>
    <tbody>${data.items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.productName} × ${i.quantity}</td><td align="right" style="padding:8px;border-bottom:1px solid #eee;">${formatMoney(i.price * i.quantity)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td style="padding:8px;"><strong>Total</strong></td><td align="right" style="padding:8px;"><strong>${formatMoney(data.total)}</strong></td></tr></tfoot>
  </table>
  <h3 style="margin:24px 0 8px;">Ship to</h3>
  <p style="margin:0;line-height:1.5;">${renderAddress(data.shippingAddress)}</p>
</body></html>`;
}

async function sendViaResend(payload: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn(
      { to: payload.to, subject: payload.subject },
      "RESEND_API_KEY not configured — email not sent (logging only)"
    );
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo ?? ADMIN_EMAIL,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text }, "Resend API error");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send email via Resend");
  }
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  // Customer confirmation
  await sendViaResend({
    to: data.customerEmail,
    subject: `Order ${data.orderNumber} confirmed — VIGR Angel Apparel`,
    html: customerHtml(data),
  });
  // Admin notification
  await sendViaResend({
    to: ADMIN_EMAIL,
    subject: `[VAA] New order ${data.orderNumber} — ${formatMoney(data.total)}`,
    html: adminHtml(data),
    replyTo: data.customerEmail,
  });
}
