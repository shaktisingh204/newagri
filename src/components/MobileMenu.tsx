"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import SearchBar from "@/components/SearchBar";

interface MobileMenuProps {
  user: { email: string; role: string } | null;
}

export default function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-green-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-green-800 border-t border-green-700 shadow-lg z-50">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 mb-2">
                  <SearchBar />
                </div>
                <MobileLink href="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                <MobileLink href="/seasonal" onClick={() => setOpen(false)}>In Season</MobileLink>
                <MobileLink href="/compare" onClick={() => setOpen(false)}>Compare</MobileLink>
                <MobileLink href="/analytics" onClick={() => setOpen(false)}>Analytics</MobileLink>
                <MobileLink href="/favorites" onClick={() => setOpen(false)}>Favorites</MobileLink>
                {user.role === "admin" && (
                  <MobileLink href="/admin" onClick={() => setOpen(false)}>Admin</MobileLink>
                )}
                <div className="border-t border-green-700 mt-2 pt-2">
                  <MobileLink href="/profile" onClick={() => setOpen(false)}>
                    Profile ({user.email})
                  </MobileLink>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors text-green-200"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <MobileLink href="/auth/login" onClick={() => setOpen(false)}>Login</MobileLink>
                <MobileLink href="/auth/register" onClick={() => setOpen(false)}>Register</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
    >
      {children}
    </Link>
  );
}
