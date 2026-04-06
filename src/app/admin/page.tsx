"use client";

import { useState } from "react";
import FileUploader from "@/components/admin/FileUploader";
import UploadPreview from "@/components/admin/UploadPreview";
import UploadHistory from "@/components/admin/UploadHistory";

export default function AdminPage() {
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Ingestion Console</h1>
        <p className="text-gray-500 mt-1">
          Upload, parse, validate, and commit crop calendar data
        </p>
      </div>

      <FileUploader onUploadComplete={setSelectedUploadId} />
      <UploadPreview uploadId={selectedUploadId} />
      <UploadHistory onSelect={setSelectedUploadId} />
    </main>
  );
}
