import Link from "next/link";
import { notFound } from "next/navigation";
import { getCropCalendar } from "@/actions/adminCrud";
import CropForm from "@/components/admin/CropForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCropPage({ params }: PageProps) {
  const { id } = await params;
  const record = await getCropCalendar(id);
  if (!record) notFound();

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Crop Calendar</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {record.cropName} — {record.state}, {record.region}
          </p>
        </div>
        <Link
          href="/admin/crops"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 self-start"
        >
          Back to List
        </Link>
      </div>

      <CropForm mode="edit" initial={record} />
    </main>
  );
}
