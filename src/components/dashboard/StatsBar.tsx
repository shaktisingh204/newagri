interface Stats {
  totalCalendars: number;
  totalCrops: number;
  totalCountries: number;
  totalSearches: number;
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Crop Calendars", value: stats.totalCalendars },
    { label: "Crops Tracked", value: stats.totalCrops },
    { label: "Countries", value: stats.totalCountries },
    { label: "Total Searches", value: stats.totalSearches },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <div className="text-3xl font-bold text-green-700">{item.value}</div>
          <div className="text-sm text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
