import Navbar from "@/components/Navbar";
import CropDetailView from "@/components/crops/CropDetailView";
import { getCropCalendarById } from "@/actions/crops";
import { isFavorited } from "@/actions/favorites";
import { notFound } from "next/navigation";

interface CropDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CropDetailPage({ params }: CropDetailPageProps) {
  const { id } = await params;
  const calendar = await getCropCalendarById(id);

  if (!calendar) notFound();

  let favorited = false;
  try {
    favorited = await isFavorited(id);
  } catch {
    // not logged in
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CropDetailView calendar={calendar} initialFavorited={favorited} />
      </main>
    </>
  );
}
