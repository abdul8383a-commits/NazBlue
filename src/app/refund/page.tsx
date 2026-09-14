export const metadata = { title: "Refund Policy - BLUE ناز" };

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">Return & Refund Policy</h1>
      <div className="prose prose-blue text-gray-700 dark:text-white/80 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Returns</h2>
          <p>Our policy lasts 14 days. If 14 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange.</p>
          <p>To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. Refunds</h2>
          <p>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. If approved, your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. Shipping</h2>
          <p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.</p>
        </section>
      </div>
    </div>
  );
}
