export const metadata = { title: "Terms of Service - BLUE ناز" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">Terms of Service</h1>
      <div className="prose prose-blue text-gray-700 dark:text-white/80 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Agreement to Terms</h2>
          <p>By accessing our website and purchasing our products, you agree to be bound by these Terms of Service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. Products and Pricing</h2>
          <p>All products are subject to availability. Prices for our products are subject to change without notice.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. Payments (Razorpay)</h2>
          <p>We use Razorpay for processing payments. We/Razorpay do not store your card data on our servers. The data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS).</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">4. Contact Information</h2>
          <p>Questions about the Terms of Service should be sent to us at support@blue-naz.com.</p>
        </section>
      </div>
    </div>
  );
}
