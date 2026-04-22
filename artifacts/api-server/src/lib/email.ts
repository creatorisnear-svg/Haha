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
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Your order has been received and is being prepared. Orders typically ship within <strong style="color:#ffffff;">2–5 business days</strong>. You'll receive a separate email with your tracking number once your package is on its way.</p>
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
    <p style="color:#9a9a9a;font-size:12px;line-height:1.6;margin-top:32px;">Need help? Email us at <a href="mailto:vaaclothing.xyz@gmail.com" style="color:#c5c5c5;">vaaclothing.xyz@gmail.com</a> · we're happy to assist.</p>
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
  bcc?: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn(
      { to: payload.to, subject: payload.subject },
      "RESEND_API_KEY not configured · email not sent (logging only)"
    );
    throw new Error(
      "Email is not configured. Set the RESEND_API_KEY environment variable to enable sending."
    );
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      ...(payload.bcc && payload.bcc.length > 0 ? { bcc: payload.bcc } : {}),
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo ?? ADMIN_EMAIL,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text, to: payload.to }, "Resend API error");
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.message || parsed?.error || text;
    } catch {}
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  shippingAddress: ShippingAddress;
}

function detectCarrierForEmail(raw: string): { name: string; url: string } {
  const tn = raw.replace(/\s+/g, "").toUpperCase();
  const enc = encodeURIComponent(tn);
  if (/^TBA\d{10,14}$/.test(tn)) return { name: "Amazon Logistics", url: `https://track.amazon.com/tracking/${enc}` };
  if (/^1Z[0-9A-Z]{16}$/.test(tn)) return { name: "UPS", url: `https://www.ups.com/track?tracknum=${enc}` };
  if (/^(94|93|92|95|82)\d{18,20}$/.test(tn)) return { name: "USPS", url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc}` };
  if (/^\d{12}$|^\d{15}$/.test(tn)) return { name: "FedEx", url: `https://www.fedex.com/fedextrack/?trknbr=${enc}` };
  if (/^\d{20}$|^\d{22}$/.test(tn)) return { name: "USPS", url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc}` };
  if (/^\d{10,11}$/.test(tn)) return { name: "DHL", url: `https://www.dhl.com/en/express/tracking.html?AWB=${enc}` };
  return { name: "Carrier", url: `https://parcelsapp.com/en/tracking/${enc}` };
}

function trackingButtonHtml(trackingNumber: string): string {
  const carrier = detectCarrierForEmail(trackingNumber);
  return `<div style="margin:24px 0;padding:24px;border:1px solid #2a2a2a;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;">Tracking Number</p>
      <p style="margin:0 0 20px;color:#ffffff;font-size:18px;font-family:monospace;letter-spacing:0.1em;word-break:break-all;">${trackingNumber}</p>
      <a href="${carrier.url}" style="display:inline-block;background:#ffffff;color:#0a0a0a;padding:14px 28px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-weight:600;">Track with ${carrier.name} →</a>
    </div>`;
}

function shippingHtml(data: ShippingEmailData): string {
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">Your Order Has Shipped</p>
      <h2 style="font-size:28px;letter-spacing:0.2em;margin:0;color:#ffffff;">${data.orderNumber}</h2>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Hey ${data.customerName.split(" ")[0] || "there"},</p>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Good news · your order is on the way. Tap the button below to track your package.</p>
    ${trackingButtonHtml(data.trackingNumber)}
    <div style="margin:24px 0;padding:16px;border:1px solid #2a2a2a;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;">Ship To</p>
      <p style="margin:0;color:#e5e5e5;font-size:13px;line-height:1.6;">${renderAddress(data.shippingAddress)}</p>
    </div>
    <p style="color:#9a9a9a;font-size:12px;line-height:1.6;margin-top:32px;">Need help? Email us at <a href="mailto:vaaclothing.xyz@gmail.com" style="color:#c5c5c5;">vaaclothing.xyz@gmail.com</a> · we're happy to assist.</p>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
}

export async function sendShippingNotification(data: ShippingEmailData): Promise<void> {
  await sendViaResend({
    to: data.customerEmail,
    subject: `Your order ${data.orderNumber} has shipped · VIGR Angel Apparel`,
    html: shippingHtml(data),
  });
}

export async function sendNewsletterWelcome(email: string): Promise<void> {
  const html = `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">Welcome to the covenant</p>
      <h2 style="font-size:24px;letter-spacing:0.2em;margin:0;color:#ffffff;">YOU'RE IN.</h2>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.7;">Thanks for joining the VAA list. You'll be the first to hear about new drops, restocks, and members-only releases.</p>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.7;">Stay close · the next drop is never far.</p>
    <p style="color:#9a9a9a;font-size:12px;line-height:1.6;margin-top:32px;">Need help? Email us at <a href="mailto:vaaclothing.xyz@gmail.com" style="color:#c5c5c5;">vaaclothing.xyz@gmail.com</a></p>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
  await sendViaResend({
    to: email,
    subject: "Welcome to VIGR Angel Apparel",
    html,
  });
}

export async function sendNewsletterBlast(data: {
  subject: string;
  body: string;
  subscribers: string[];
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const html = `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;">
      ${data.body.split("\n").map((line) => `<p style="color:#c5c5c5;font-size:14px;line-height:1.7;margin:0 0 12px;">${line}</p>`).join("")}
    </div>
    <div style="border-top:1px solid #2a2a2a;padding-top:24px;margin-top:16px;">
      <p style="color:#9a9a9a;font-size:12px;line-height:1.6;">Need help? Email us at <a href="mailto:vaaclothing.xyz@gmail.com" style="color:#c5c5c5;">vaaclothing.xyz@gmail.com</a></p>
      <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:24px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
    </div>
  </div>
</body></html>`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const email of data.subscribers) {
    try {
      await sendViaResend({ to: email, subject: data.subject, html });
      sent++;
    } catch (err: any) {
      failed++;
      const msg = err?.message ?? String(err);
      logger.error({ err, email }, "Newsletter blast: failed for subscriber");
      if (errors.length < 3) errors.push(`${email}: ${msg}`);
    }
  }
  return { sent, failed, errors };
}

interface DeliveryEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string | null;
  shippingAddress: ShippingAddress;
}

function deliveredHtml(data: DeliveryEmailData): string {
  const tracking = data.trackingNumber ? trackingButtonHtml(data.trackingNumber) : "";
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">Your Order Was Delivered</p>
      <h2 style="font-size:28px;letter-spacing:0.2em;margin:0;color:#ffffff;">${data.orderNumber}</h2>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Hey ${data.customerName.split(" ")[0] || "there"},</p>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Your order <strong style="color:#ffffff;">${data.orderNumber}</strong> has been delivered. Welcome to the covenant · we hope you wear it well.</p>
    ${tracking}
    <div style="margin:24px 0;padding:16px;border:1px solid #2a2a2a;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;color:#9a9a9a;text-transform:uppercase;">Delivered To</p>
      <p style="margin:0;color:#e5e5e5;font-size:13px;line-height:1.6;">${renderAddress(data.shippingAddress)}</p>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">If anything's wrong with your order, reply to this email and we'll make it right.</p>
    <p style="color:#9a9a9a;font-size:12px;line-height:1.6;margin-top:32px;">Need help? Email us at <a href="mailto:vaaclothing.xyz@gmail.com" style="color:#c5c5c5;">vaaclothing.xyz@gmail.com</a></p>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
}

export async function sendDeliveryNotification(data: DeliveryEmailData): Promise<void> {
  await sendViaResend({
    to: data.customerEmail,
    subject: `Your order ${data.orderNumber} was delivered · VIGR Angel Apparel`,
    html: deliveredHtml(data),
  });
}

// ── Restock / drop release notifications ─────────────────────────────────────
interface ProductNotifyData {
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl?: string | null;
  baseUrl: string;
  type: "restock" | "release";
}

function restockHtml(data: ProductNotifyData): string {
  const heading = data.type === "release" ? "It's Live" : "Back In Stock";
  const intro =
    data.type === "release"
      ? "The drop you've been waiting for just went live. Get yours before they're gone."
      : "Good news. You asked us to let you know when this came back · it's available again.";
  const productUrl = `${data.baseUrl.replace(/\/$/, "")}/products/${data.productId}`;
  const img = data.imageUrl
    ? `<div style="margin:0 auto 16px;max-width:280px;"><img src="${data.imageUrl}" alt="${data.productName}" style="display:block;width:100%;height:auto;border:1px solid #2a2a2a;"/></div>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">${heading}</p>
      <h2 style="font-size:24px;letter-spacing:0.15em;margin:0;color:#ffffff;">${data.productName}</h2>
      <p style="font-size:18px;color:#e5e5e5;margin:8px 0 0;">${formatMoney(data.productPrice)}</p>
    </div>
    ${img}
    <p style="color:#c5c5c5;font-size:14px;line-height:1.7;text-align:center;">${intro}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${productUrl}" style="display:inline-block;background:#9a212e;color:#ffffff;padding:16px 36px;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;font-weight:600;">Shop Now →</a>
    </div>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
}

export async function sendRestockNotification(
  email: string,
  data: ProductNotifyData,
): Promise<void> {
  const subject =
    data.type === "release"
      ? `It's live · ${data.productName} just dropped`
      : `Back in stock · ${data.productName}`;
  await sendViaResend({
    to: email,
    subject: `${subject} · VIGR Angel Apparel`,
    html: restockHtml(data),
  });
}

// ── Abandoned cart reminder ──────────────────────────────────────────────────
interface AbandonedCartItem {
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}
interface AbandonedCartData {
  customerName: string;
  customerEmail: string;
  items: AbandonedCartItem[];
  baseUrl: string;
}

function abandonedCartHtml(data: AbandonedCartData): string {
  const cartUrl = data.baseUrl.replace(/\/$/, "");
  const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const rows = data.items
    .map(
      (i) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;color:#e5e5e5;font-size:13px;">${i.productName} × ${i.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;color:#9a9a9a;font-size:13px;text-align:right;">${formatMoney(i.price * i.quantity)}</td>
        </tr>`,
    )
    .join("");
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a2a;">
      <h1 style="font-size:18px;letter-spacing:0.3em;margin:0;color:#ffffff;text-transform:uppercase;">VIGR Angel Apparel</h1>
    </div>
    <div style="padding:32px 0;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#9a9a9a;margin:0 0 8px;">You Left Something Behind</p>
      <h2 style="font-size:22px;letter-spacing:0.15em;margin:0;color:#ffffff;">Your Cart Is Waiting</h2>
    </div>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">Hey ${data.customerName.split(" ")[0] || "there"},</p>
    <p style="color:#c5c5c5;font-size:14px;line-height:1.6;">We saved your cart. Pieces sell out fast · come back and finish what you started.</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;">
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:16px 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em;">Total</td>
          <td style="padding:16px 8px;color:#ffffff;font-size:14px;font-weight:600;text-align:right;">${formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${cartUrl}" style="display:inline-block;background:#9a212e;color:#ffffff;padding:16px 36px;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;font-weight:600;">Return to Your Cart →</a>
    </div>
    <p style="color:#5a5a5a;font-size:11px;text-align:center;margin-top:32px;letter-spacing:0.2em;text-transform:uppercase;">VIGR Angel Apparel · Born in the grit</p>
  </div>
</body></html>`;
}

export async function sendAbandonedCartReminder(data: AbandonedCartData): Promise<void> {
  await sendViaResend({
    to: data.customerEmail,
    subject: `You left ${data.items.length} item${data.items.length === 1 ? "" : "s"} behind · VIGR Angel Apparel`,
    html: abandonedCartHtml(data),
  });
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  // Customer confirmation
  await sendViaResend({
    to: data.customerEmail,
    subject: `Order ${data.orderNumber} confirmed · VIGR Angel Apparel`,
    html: customerHtml(data),
  });
  // Admin notification
  await sendViaResend({
    to: ADMIN_EMAIL,
    subject: `[VAA] New order ${data.orderNumber} · ${formatMoney(data.total)}`,
    html: adminHtml(data),
    replyTo: data.customerEmail,
  });
}
