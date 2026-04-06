"use client";

import { useEffect, useState, useTransition } from "react";
import { getUploadPreview, commitUpload } from "@/actions/ingestion";

interface FlaggedRow {
  row: number;
  reason: string;
  data: Record<string, unknown>;
}

interface UploadData {
  _id: string;
  fileName: string;
  fileType: string;
  status: string;
  totalRows: number;
  validRows: number;
  flaggedRows: FlaggedRow[];
  parsedData: Record<string, unknown>[];
}

export default function UploadPreview({ uploadId }: { uploadId: string | null }) {
  const [data, setData] = useState<UploadData | null>(null);
  const [commitResult, setCommitResult] = useState<{ success?: boolean; committed?: number; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (uploadId) {
      getUploadPreview(uploadId).then(setData);
    }
  }, [uploadId]);

  if (!uploadId || !data) return null;

  const handleCommit = () => {
    startTransition(async () => {
      const res = await commitUpload(uploadId);
      setCommitResult(res);
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">Preview: {data.fileName}</h2>
            <p className="text-sm text-gray-500">
              Status: <span className="font-medium capitalize">{data.status}</span> |
              Total: {data.totalRows} | Valid: {data.validRows} | Flagged: {data.flaggedRows.length}
            </p>
          </div>
          {data.status !== "committed" && (
            <button
              onClick={handleCommit}
              disabled={isPending}
              className="shrink-0 px-6 py-2.5 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Committing..." : "Commit to Database"}
            </button>
          )}
        </div>

        {commitResult?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Successfully committed {commitResult.committed} records to the database.
          </div>
        )}
        {commitResult?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {commitResult.error}
          </div>
        )}
      </div>

      {/* Flagged Rows */}
      {data.flaggedRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4">
            Flagged Rows ({data.flaggedRows.length})
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b bg-red-50">
                  <th className="px-4 py-2 text-left">Row</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.flaggedRows.map((fr, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">{fr.row}</td>
                    <td className="px-4 py-2 text-red-600">{fr.reason}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-md truncate">
                      {JSON.stringify(fr.data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Preview */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Valid Data Preview (first 20 rows)</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2 text-left">Crop</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">State</th>
                <th className="px-3 py-2 text-left">Season</th>
                <th className="px-3 py-2 text-left">Sowing</th>
                <th className="px-3 py-2 text-left">Growing</th>
                <th className="px-3 py-2 text-left">Harvesting</th>
              </tr>
            </thead>
            <tbody>
              {data.parsedData.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{String(row.cropName || "")}</td>
                  <td className="px-3 py-2">{String(row.country || "")}</td>
                  <td className="px-3 py-2">{String(row.state || "")}</td>
                  <td className="px-3 py-2">{String(row.season || "")}</td>
                  <td className="px-3 py-2 text-xs">{String(row.sowingMonths || "")}</td>
                  <td className="px-3 py-2 text-xs">{String(row.growingMonths || "")}</td>
                  <td className="px-3 py-2 text-xs">{String(row.harvestingMonths || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
