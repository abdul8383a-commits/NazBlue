import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-transparent text-primary py-12 mt-auto border-t border-primary/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block relative w-40 h-10 mb-6 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="BLUE ناز" fill className="object-cover object-center mix-blend-multiply brightness-[1.2] contrast-[1.2] scale-[2] dark:mix-blend-screen dark:invert dark:grayscale dark:brightness-[2] dark:contrast-[1]" />
            </Link>
            <p className="text-sm opacity-90 max-w-sm">
              Clothes made to be worn until they soften. The best clothes get better with wear.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-primary">Shop</h3>
            <ul className="space-y-3">
              <li><Link href="/men" className="text-sm opacity-80 hover:opacity-100 hover:underline">Men</Link></li>
              <li><Link href="/women" className="text-sm opacity-80 hover:opacity-100 hover:underline">Women</Link></li>
              <li><Link href="/kids" className="text-sm opacity-80 hover:opacity-100 hover:underline">Kids</Link></li>
              <li><Link href="/accessories" className="text-sm opacity-80 hover:opacity-100 hover:underline">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 uppercase tracking-wider text-xs opacity-80">Legal</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:underline">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary/10 pt-8 text-left text-xs opacity-70">
          <p>&copy; {new Date().getFullYear()} BLUE ناز. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
