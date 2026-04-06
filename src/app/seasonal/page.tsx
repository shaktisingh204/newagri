import Navbar from "@/components/Navbar";
import SeasonalView from "@/components/seasonal/SeasonalView";
import { getInSeasonCrops } from "@/actions/crops";

export default async function SeasonalPage() {
  const currentMonth = new Date().getMonth() + 1;
  const data = await getInSeasonCrops(currentMonth);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">What&apos;s In Season</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Crops currently active based on the current month</p>
        </div>
        <SeasonalView data={data} currentMonth={currentMonth} />
      </main>
    </>
  );
}
