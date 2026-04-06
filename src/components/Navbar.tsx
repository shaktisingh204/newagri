import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import SearchBar from "@/components/SearchBar";
import MobileMenu from "@/components/MobileMenu";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Desktop nav */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold tracking-tight shrink-0">
              AgriSphere
            </Link>
            {user && (
              <div className="hidden md:flex items-center space-x-5">
                <Link href="/dashboard" className="hover:text-green-200 transition-colors text-sm">
                  Dashboard
                </Link>
                <Link href="/seasonal" className="hover:text-green-200 transition-colors text-sm">
                  In Season
                </Link>
                <Link href="/compare" className="hover:text-green-200 transition-colors text-sm">
                  Compare
                </Link>
                <Link href="/analytics" className="hover:text-green-200 transition-colors text-sm">
                  Analytics
                </Link>
                <Link href="/favorites" className="hover:text-green-200 transition-colors text-sm">
                  Favorites
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:text-green-200 transition-colors text-sm">
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center space-x-4">
            {user && <SearchBar />}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile" className="text-sm text-green-200 hover:text-white transition-colors truncate max-w-[140px]">
                  {user.email}
                </Link>
                <span className="text-xs bg-green-700 px-2 py-0.5 rounded">{user.role}</span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-sm transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="hover:text-green-200 transition-colors">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button + menu */}
          <MobileMenu user={user} />
        </div>
      </div>
    </nav>
  );
}
