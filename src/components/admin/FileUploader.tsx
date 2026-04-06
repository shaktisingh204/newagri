"use client";

import { useState, useTransition } from "react";
import { uploadAndParseFile } from "@/actions/ingestion";

interface UploadResult {
  success?: boolean;
  error?: string;
  uploadId?: string;
  totalRows?: number;
  validRows?: number;
  flaggedCount?: number;
}

export default function FileUploader({ onUploadComplete }: { onUploadComplete: (id: string) => void }) {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await uploadAndParseFile(formData);
      setResult(res);
      if (res.success && res.uploadId) {
        onUploadComplete(res.uploadId);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Upload Data File</h2>
      <p className="text-sm text-gray-500 mb-4">
        Supported formats: XLSX, PDF. Files are parsed, normalized, and validated before commit.
      </p>

      <form action={handleSubmit}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
          <input
            type="file"
            name="file"
            accept=".xlsx,.pdf"
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Uploading & Parsing..." : "Upload & Parse"}
        </button>
      </form>

      {result?.error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {result.error}
        </div>
      )}

      {result?.success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium">File parsed successfully!</p>
          <p className="text-sm mt-1">
            Total rows: {result.totalRows} | Valid: {result.validRows} | Flagged: {result.flaggedCount}
          </p>
        </div>
      )}
    </div>
  );
}
