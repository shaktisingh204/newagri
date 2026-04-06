import Navbar from "@/components/Navbar";
import ProfileView from "@/components/profile/ProfileView";
import { getProfile } from "@/actions/profile";
import { getFavorites } from "@/actions/favorites";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const favorites = await getFavorites();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
        <ProfileView profile={profile} favorites={favorites} />
      </main>
    </>
  );
}
