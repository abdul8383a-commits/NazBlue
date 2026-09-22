"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import LogoutButton from "./LogoutButton";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export default function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-1 focus:outline-none text-primary dark:text-white"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={closeMenu}></div>
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-[#E8E7E5] dark:bg-[#163A7A] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full overflow-y-auto px-6 py-8 pt-safe">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-serif text-primary dark:text-white">BLUE ناز</span>
            <button onClick={closeMenu} className="p-2 text-primary dark:text-white focus:outline-none">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex flex-col space-y-6 text-xl font-medium tracking-wide text-primary dark:text-white">
            <Link href="/men" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Men</Link>
            <Link href="/women" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Women</Link>
            <Link href="/kids" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Kids</Link>
            <Link href="/accessories" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Accessories</Link>
            
            <div className="h-px bg-primary/10 dark:bg-white/10 my-4 w-full"></div>
            
            {isLoggedIn ? (
              <>
                <Link href="/account" onClick={closeMenu} className="flex items-center space-x-3 hover:opacity-70 transition-opacity">
                  <User className="w-6 h-6" />
                  <span>My Account</span>
                </Link>
                <div onClick={closeMenu} className="pt-2">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link href="/login" onClick={closeMenu} className="hover:opacity-70 transition-opacity">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
