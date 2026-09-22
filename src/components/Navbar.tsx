import Link from 'next/link';
import Image from 'next/image';
import { User, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 text-primary border-b border-primary/5 pt-safe">
      <div className="absolute inset-0 bg-[#E8E7E5]/95 dark:bg-[#163A7A]/95 backdrop-blur-md -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 lg:px-12 relative">
        <div className="flex justify-between items-center h-16 md:h-24">
          
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <MobileMenu isLoggedIn={!!user} />
            </div>
            
            <Link href="/" className="flex items-center justify-center w-28 md:w-48 h-8 md:h-12 relative overflow-hidden hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="BLUE ناز" fill className="object-cover object-center mix-blend-multiply brightness-[1.2] contrast-[1.2] scale-[2] dark:mix-blend-screen dark:invert dark:grayscale dark:brightness-[2] dark:contrast-[1]" priority />
            </Link>
            
            <div className="hidden md:flex items-center ml-12 space-x-8 text-base font-medium tracking-wide">
              <Link href="/men" className="hover:opacity-70 transition-opacity">Men</Link>
              <Link href="/women" className="hover:opacity-70 transition-opacity">Women</Link>
              <Link href="/kids" className="hover:opacity-70 transition-opacity">Kids</Link>
              <Link href="/accessories" className="hover:opacity-70 transition-opacity">Accessories</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm font-medium tracking-wide">
            <ThemeToggle />
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/cart" className="hover:opacity-70 transition-opacity flex items-center space-x-2" aria-label="Cart">
                <ShoppingCart className="w-5 h-5"/>
                <span>Cart</span>
              </Link>
              {user ? (
                <>
                  <Link href="/account" className="hover:opacity-70" aria-label="Account">
                    <User className="w-5 h-5" />
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="hover:opacity-70 transition-opacity text-sm">
                  Login
                </Link>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
