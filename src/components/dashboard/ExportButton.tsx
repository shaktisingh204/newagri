"use client";

import { useState } from "react";
import { exportCropsCSV } from "@/actions/export";
import toast from "react-hot-toast";

interface ExportButtonProps {
  filters: {
    country?: string;
    state?: string;
    crop?: string;
    season?: string;
  };
}

export default function ExportButton({ filters }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportCropsCSV(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crop-calendars-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
