import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-transparent text-primary py-12 pb-20 md:pb-12 mt-auto border-t border-primary/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12 md:mb-8">
          <div className="md:col-span-2 flex flex-col items-start">
            <Link href="/" className="inline-block relative w-32 md:w-40 h-8 md:h-10 mb-6 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="BLUE ناز" fill className="object-cover object-center mix-blend-multiply brightness-[1.2] contrast-[1.2] scale-[2] dark:mix-blend-screen dark:invert dark:grayscale dark:brightness-[2] dark:contrast-[1]" />
            </Link>
            <p className="text-sm opacity-90 max-w-sm">
              Clothes made to be worn until they soften. The best clothes get better with wear.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-primary">Shop</h3>
            <ul className="flex flex-col space-y-1">
              <li><Link href="/men" className="block py-2 text-sm opacity-80 hover:opacity-100 hover:underline">Men</Link></li>
              <li><Link href="/women" className="block py-2 text-sm opacity-80 hover:opacity-100 hover:underline">Women</Link></li>
              <li><Link href="/kids" className="block py-2 text-sm opacity-80 hover:opacity-100 hover:underline">Kids</Link></li>
              <li><Link href="/accessories" className="block py-2 text-sm opacity-80 hover:opacity-100 hover:underline">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-primary">Legal</h3>
            <ul className="flex flex-col space-y-1 text-sm opacity-90">
              <li><Link href="/terms" className="block py-2 hover:underline">Terms of Service</Link></li>
              <li><Link href="/privacy" className="block py-2 hover:underline">Privacy Policy</Link></li>
              <li><Link href="/refund" className="block py-2 hover:underline">Refund Policy</Link></li>
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
