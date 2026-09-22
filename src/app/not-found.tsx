import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-black text-primary/10 dark:text-white/10 mb-4 tracking-tighter">404</h1>
      <h2 className="text-3xl font-bold text-primary dark:text-white mb-2 font-serif">Page Not Found</h2>
      <p className="text-primary/70 dark:text-white/70 mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link
        href="/"
        className="bg-primary dark:bg-white text-[#E8E7E5] dark:text-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
      >
        Return to Store
      </Link>
    </div>
  );
}
