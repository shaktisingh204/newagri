import Navbar from "@/components/Navbar";
import ComparisonView from "@/components/dashboard/ComparisonView";
import { getFilterOptions } from "@/actions/crops";

export default async function ComparePage() {
  const options = await getFilterOptions();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crop Comparison</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Overlay up to three crops side-by-side for cross-crop planning
          </p>
        </div>
        <ComparisonView availableCrops={options.crops} />
      </main>
    </>
  );
}
