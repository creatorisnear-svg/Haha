import { Link } from "wouter";

export default function Terms() {
  const lastUpdated = "April 21, 2026";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-noise" />
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="font-display text-lg sm:text-xl tracking-[0.2em] hover:text-primary transition-colors">
            VIGR ANGEL APPAREL
          </Link>
          <Link href="/" className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Legal</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-widest uppercase mb-3">Terms of Service</h1>
        <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        {/* Sales final callout */}
        <div className="border border-primary bg-primary/10 p-6 mb-12">
          <p className="font-display text-lg sm:text-xl tracking-widest uppercase text-primary mb-2">All Sales Final</p>
          <p className="font-sans text-sm leading-relaxed text-foreground">
            VIGR Angel Apparel does <span className="font-semibold">NOT</span> accept returns, exchanges, or issue refunds. By placing an order you agree that all purchases are final at checkout. Please double-check your size and shipping address before completing payment.
          </p>
        </div>

        <div className="space-y-10 font-sans text-sm leading-relaxed text-foreground/90">
          <Section title="1. Agreement">
            <p>
              By accessing vaaclothing.xyz ("the Site") or placing an order with VIGR Angel Apparel ("VAA," "we," "us," "our") you agree to these Terms of Service. If you do not agree, do not use the Site or purchase from us.
            </p>
          </Section>

          <Section title="2. No Refunds, No Returns, No Exchanges">
            <p className="mb-3 font-semibold text-foreground">All sales are final.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do <span className="font-semibold">not</span> accept returns for any reason, including incorrect size, fit preference, or change of mind.</li>
              <li>We do <span className="font-semibold">not</span> issue refunds once payment has been processed.</li>
              <li>We do <span className="font-semibold">not</span> offer exchanges between sizes, colors, or styles.</li>
              <li>Sizing charts are available on each product page — please review them carefully before ordering.</li>
            </ul>
          </Section>

          <Section title="3. Damaged or Incorrect Items">
            <p>
              If your order arrives visibly damaged or you received the wrong item, contact us at{" "}
              <a href="mailto:vaaclothing.xyz@gmail.com" className="text-primary hover:underline">vaaclothing.xyz@gmail.com</a>{" "}
              within <span className="font-semibold">7 days</span> of delivery, including your order number and clear photos. Resolution (replacement or store credit at our discretion) is offered case-by-case and is not a refund. Claims made after 7 days will not be honored.
            </p>
          </Section>

          <Section title="4. Order Processing & Shipping">
            <p>
              Orders are typically processed within 2–5 business days. Shipping times vary by carrier and destination. Once a tracking number is issued, the package is in the carrier's hands and we are not responsible for carrier delays, lost packages, or theft after delivery confirmation. Customers are responsible for providing an accurate shipping address — orders sent to incorrect addresses provided by the customer are not eligible for replacement.
            </p>
          </Section>

          <Section title="5. Payment">
            <p>
              All payments are processed securely through Stripe. By submitting payment information you authorize VAA to charge the listed total, including any applicable taxes and shipping fees. Prices are listed in USD and may change without notice.
            </p>
          </Section>

          <Section title="6. Promo Codes">
            <p>
              Promo codes are non-transferable, have no cash value, cannot be combined unless explicitly stated, and may be modified or canceled at any time. Discounted orders remain subject to the no-refund policy in Section 2.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              All designs, graphics, logos, photography, and content on the Site are the property of VIGR Angel Apparel and are protected by copyright. You may not reproduce, redistribute, or use any content for commercial purposes without written permission.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              VAA, its owners, and operators are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our products or the Site. Use of our products is at your own risk. Total liability for any claim shall not exceed the amount paid for the product in question.
            </p>
          </Section>

          <Section title="9. Privacy">
            <p>
              We collect only the information necessary to fulfill your order (name, email, shipping address, phone). We never sell your data. Payment details are handled directly by Stripe and never stored by us. You may unsubscribe from marketing emails at any time.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms at any time. The "Last updated" date at the top reflects the most recent revision. Continued use of the Site after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions? Email us at{" "}
              <a href="mailto:vaaclothing.xyz@gmail.com" className="text-primary hover:underline">vaaclothing.xyz@gmail.com</a>.
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 text-center">
            VIGR Angel Apparel · Created like Heaven, Worn With Faith
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg sm:text-xl tracking-widest uppercase mb-3 text-foreground">{title}</h2>
      <div className="text-foreground/80">{children}</div>
    </section>
  );
}
