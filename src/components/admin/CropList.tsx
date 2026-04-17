"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { deleteCropCalendar } from "@/actions/adminCrud";

export interface CropListItem {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  durationDays?: number;
}

interface CropListProps {
  items: CropListItem[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
}

export default function CropList({ items, total, page, totalPages, search }: CropListProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateQuery(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => {
      router.push(`/admin/crops${sp.toString() ? `?${sp.toString()}` : ""}`);
    });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() || undefined, page: undefined });
  }

  function handleClear() {
    setSearchInput("");
    updateQuery({ search: undefined, page: undefined });
  }

  async function handleDelete(id: string, cropName: string) {
    if (!confirm(`Delete the calendar record for "${cropName}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const result = await deleteCropCalendar(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Record deleted");
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  }

  function goToPage(next: number) {
    if (next < 1 || next > totalPages || next === page) return;
    updateQuery({ page: next === 1 ? undefined : String(next) });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-b sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by crop, state, district, season"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </form>
        <div className="text-sm text-gray-500 shrink-0">
          {total} record{total === 1 ? "" : "s"}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          No crop calendar records found.
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden divide-y">
            {items.map((item) => (
              <div key={item._id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate mr-2">{item.cropName}</span>
                  <span className="text-xs text-gray-500">{item.season}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {item.country} / {item.state} / {item.region}
                </div>
                <div className="text-xs text-gray-500">
                  Duration: {item.durationDays ? `${item.durationDays} days` : "—"}
                </div>
                <div className="flex gap-4 pt-1">
                  <Link
                    href={`/admin/crops/${item._id}/edit`}
                    className="text-green-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item._id, item.cropName)}
                    disabled={deletingId === item._id}
                    className="text-red-500 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Crop Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Country</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">State</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">District</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Season</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.cropName}</td>
                    <td className="px-4 py-3">{item.country}</td>
                    <td className="px-4 py-3">{item.state}</td>
                    <td className="px-4 py-3">{item.region}</td>
                    <td className="px-4 py-3">{item.season}</td>
                    <td className="px-4 py-3">
                      {item.durationDays ? `${item.durationDays} days` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/crops/${item._id}/edit`}
                          className="text-green-700 hover:underline text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id, item.cropName)}
                          disabled={deletingId === item._id}
                          className="text-red-500 hover:underline text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t text-sm">
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
