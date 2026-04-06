import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold tracking-tight">
              AgriSphere
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="hover:text-green-200 transition-colors">
                  Dashboard
                </Link>
                <Link href="/compare" className="hover:text-green-200 transition-colors">
                  Compare
                </Link>
                <Link href="/analytics" className="hover:text-green-200 transition-colors">
                  Analytics
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:text-green-200 transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-green-200">
                  {user.email} ({user.role})
                </span>
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
        </div>
      </div>
    </nav>
  );
}
