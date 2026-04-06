import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FilterPanel from "@/components/dashboard/FilterPanel";
import CropTimeline from "@/components/dashboard/CropTimeline";
import StatsBar from "@/components/dashboard/StatsBar";
import CropMap from "@/components/map/CropMap";
import ExportButton from "@/components/dashboard/ExportButton";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { searchCropCalendars, getFilterOptions, getRegionsWithCoordinates } from "@/actions/crops";
import { getDashboardStats, getRecentActivity } from "@/actions/analytics";
import { getFavoriteIds } from "@/actions/favorites";

interface DashboardPageProps {
  searchParams: Promise<{
    country?: string;
    state?: string;
    region?: string;
    crop?: string;
    season?: string;
    month?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawParams = await searchParams;
  // Default country to India if no country filter is set
  const params = { ...rawParams, country: rawParams.country || "India" };

  const [filterOptions, calendars, regions, stats, recentActivity, favoriteIds] = await Promise.all([
    getFilterOptions(),
    searchCropCalendars(params),
    getRegionsWithCoordinates(),
    getDashboardStats(),
    getRecentActivity(),
    getFavoriteIds(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crop Calendar Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Explore crop calendars across countries and agro-ecological zones</p>
          </div>
          <ExportButton filters={params} />
        </div>

        <StatsBar stats={stats} />

        <Suspense fallback={<div className="h-20 bg-gray-100 rounded-xl animate-pulse" />}>
          <FilterPanel
            countries={filterOptions.countries}
            crops={filterOptions.crops}
            seasons={filterOptions.seasons}
            months={filterOptions.months}
          />
        </Suspense>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Crop Timelines ({calendars.length} results)
            </h2>
            <CropTimeline calendars={calendars} favoriteIds={favoriteIds} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Regional Coverage</h2>
              <CropMap regions={regions} />
            </div>
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </main>
    </>
  );
}
