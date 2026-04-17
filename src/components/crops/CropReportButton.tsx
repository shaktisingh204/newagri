"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cropToPrintableHtml, type ICropCalendarLike } from "@/lib/pdf";

interface CropReportButtonProps {
  calendar: ICropCalendarLike;
}

function safeFilename(name: string): string {
  const cleaned = name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "crop";
}

function downloadHtmlFallback(html: string, cropName: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(cropName)}-report.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CropReportButton({ calendar }: CropReportButtonProps) {
  const [busy, setBusy] = useState(false);

  function handleDownload(): void {
    if (busy) return;
    setBusy(true);
    try {
      const html = cropToPrintableHtml(calendar);
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        downloadHtmlFallback(html, calendar.cropName);
        toast("Popup blocked. Downloaded HTML report instead.", { icon: "!" });
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const triggerPrint = (): void => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          /* ignore print errors; user can still Ctrl+P */
        }
      };

      if (printWindow.document.readyState === "complete") {
        triggerPrint();
      } else {
        printWindow.addEventListener("load", triggerPrint, { once: true });
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="bg-green-600 text-white hover:bg-green-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {busy ? "Preparing..." : "Download Report"}
    </button>
  );
}
