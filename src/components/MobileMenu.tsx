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
    <div className="md:hidden flex items-center ml-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 -mr-2 focus:outline-none"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-[80px] md:top-[112px] bg-[#E8E7E5]/95 dark:bg-[#163A7A]/95 backdrop-blur-md z-40 flex flex-col px-6 py-8 border-t border-primary/10 overflow-y-auto">
          <div className="flex flex-col space-y-6 text-xl font-medium tracking-wide text-primary dark:text-white">
            <Link href="/men" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Men</Link>
            <Link href="/women" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Women</Link>
            <Link href="/kids" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Kids</Link>
            <Link href="/accessories" onClick={closeMenu} className="hover:opacity-70 transition-opacity">Accessories</Link>
            
            <div className="h-px bg-primary/10 dark:bg-white/10 my-4 w-full"></div>
            
            {isLoggedIn ? (
              <>
                <Link href="/account" onClick={closeMenu} className="flex items-center space-x-2 hover:opacity-70 transition-opacity">
                  <User className="w-6 h-6" />
                  <span>My Account</span>
                </Link>
                <div onClick={closeMenu}>
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
      )}
    </div>
  );
}
