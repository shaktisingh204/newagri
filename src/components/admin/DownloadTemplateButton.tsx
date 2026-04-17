"use client";

export default function DownloadTemplateButton() {
  return (
    <a
      href="/api/admin/template"
      download
      className="inline-flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
    >
      Download Template
    </a>
  );
}
