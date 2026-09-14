export const metadata = { title: "Privacy Policy - BLUE ناز" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">Privacy Policy</h1>
      <div className="prose prose-blue text-gray-700 dark:text-white/80 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h2>
          <p>We use the information we collect to process transactions, maintain our services, and communicate with you about products, services, offers, and promotions.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>
        </section>
      </div>
    </div>
  );
}
