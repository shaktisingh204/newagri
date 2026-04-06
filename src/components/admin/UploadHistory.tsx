"use client";

import { useEffect, useState } from "react";
import { getUploads } from "@/actions/ingestion";

interface UploadRecord {
  _id: string;
  fileName: string;
  fileType: string;
  status: string;
  totalRows: number;
  validRows: number;
  flaggedRows: { row: number; reason: string }[];
  createdAt: string;
  committedAt?: string;
}

export default function UploadHistory({ onSelect }: { onSelect: (id: string) => void }) {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  useEffect(() => {
    getUploads().then(setUploads);
  }, []);

  if (uploads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-400">
        No uploads yet
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    parsed: "bg-blue-100 text-blue-800",
    validated: "bg-indigo-100 text-indigo-800",
    committed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Upload History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Rows</th>
              <th className="px-4 py-3 text-left">Flagged</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.fileName}</td>
                <td className="px-4 py-3 uppercase text-xs">{u.fileType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[u.status] || ""}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">{u.validRows}/{u.totalRows}</td>
                <td className="px-4 py-3">{u.flaggedRows?.length || 0}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelect(u._id)}
                    className="text-green-700 hover:underline text-sm font-medium"
                  >
                    Preview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
