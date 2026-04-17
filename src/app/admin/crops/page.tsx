import Link from "next/link";
import { listCropCalendars } from "@/actions/adminCrud";
import CropList from "@/components/admin/CropList";

interface PageProps {
  searchParams: Promise<{ search?: string; country?: string; page?: string }>;
}

export default async function AdminCropsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search?.trim() || "";
  const country = sp.country?.trim() || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await listCropCalendars({ search, country, page });

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crop Calendar Records</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage crop calendar entries — create, edit, and delete records.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
          <Link
            href="/admin/crops/new"
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            New Crop
          </Link>
        </div>
      </div>

      <CropList
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        search={search}
      />
    </main>
  );
}
