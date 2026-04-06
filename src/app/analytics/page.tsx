import Navbar from "@/components/Navbar";
import BarChartWidget from "@/components/analytics/BarChartWidget";
import StatsBar from "@/components/dashboard/StatsBar";
import {
  getPopularCrops,
  getDashboardStats,
  getCropsByCountry,
  getSeasonalDistribution,
  getCropPhaseDistribution,
} from "@/actions/analytics";

export default async function AnalyticsPage() {
  const [popularCrops, stats, cropsByCountry, seasonalDist, phaseDistribution] = await Promise.all([
    getPopularCrops(),
    getDashboardStats(),
    getCropsByCountry(),
    getSeasonalDistribution(),
    getCropPhaseDistribution(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Demand signals and usage insights across your tenant</p>
        </div>

        <StatsBar stats={stats} />

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <BarChartWidget data={popularCrops} title="Most Popular Crops (by search volume)" color="#15803d" />
          <BarChartWidget data={cropsByCountry} title="Calendars by Country" color="#0d9488" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <BarChartWidget data={seasonalDist} title="Seasonal Distribution" color="#d97706" />
          <BarChartWidget data={phaseDistribution} title="Current Month Phase Distribution" color="#7c3aed" />
        </div>
      </main>
    </>
  );
}
