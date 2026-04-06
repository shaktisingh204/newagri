import Navbar from "@/components/Navbar";
import FavoritesView from "@/components/favorites/FavoritesView";
import { getFavorites } from "@/actions/favorites";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Your bookmarked crop calendars</p>
        </div>
        <FavoritesView calendars={favorites} />
      </main>
    </>
  );
}
