import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-black text-gray-200 mb-4 tracking-tighter">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link
        href="/"
        className="bg-primary text-white px-8 py-3 rounded font-bold hover:opacity-90 transition-opacity"
      >
        Return to Store
      </Link>
    </div>
  );
}
