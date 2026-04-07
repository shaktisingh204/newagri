"use client";

import { useState } from "react";
import FileUploader from "@/components/admin/FileUploader";
import UploadPreview from "@/components/admin/UploadPreview";
import UploadHistory from "@/components/admin/UploadHistory";
import { clearAllData } from "@/actions/ingestion";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function handleClearDB() {
    if (!confirm("This will delete ALL crops, regions, calendars, and upload history. Are you sure?")) return;
    setClearing(true);
    try {
      const result = await clearAllData();
      if (result.success) {
        toast.success("All data cleared successfully");
        setSelectedUploadId(null);
      }
    } catch {
      toast.error("Failed to clear data");
    } finally {
      setClearing(false);
    }
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Ingestion Console</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Upload, parse, validate, and commit crop calendar data
          </p>
        </div>
        <button
          onClick={handleClearDB}
          disabled={clearing}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 self-start"
        >
          {clearing ? "Clearing..." : "Clear All Data"}
        </button>
      </div>

      <FileUploader onUploadComplete={setSelectedUploadId} />
      <UploadPreview uploadId={selectedUploadId} />
      <UploadHistory onSelect={setSelectedUploadId} />
    </main>
  );
}
