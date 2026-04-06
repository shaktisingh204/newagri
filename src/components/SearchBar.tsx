"use client";

import { useState, useRef, useEffect } from "react";
import { searchCropsAutocomplete } from "@/actions/crops";
import { useRouter } from "next/navigation";

interface SearchResult {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  season: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const data = await searchCropsAutocomplete(value);
      setResults(data);
      setOpen(data.length > 0);
    }, 300);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(`/crops/${result._id}`);
  }

  return (
    <div ref={ref} className="relative w-full md:w-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search crops..."
        className="w-full md:w-44 px-3 py-1.5 rounded-lg bg-green-700 text-white placeholder-green-300 text-sm border border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 md:focus:w-64 transition-all"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 md:left-auto md:right-0 md:w-72 bg-white rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r._id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-800 text-sm">{r.cropName}</div>
              <div className="text-xs text-gray-400">
                {r.country} / {r.state} &middot; {r.season}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
