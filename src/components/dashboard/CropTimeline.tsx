"use client";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PHASE_COLORS: Record<string, string> = {
  sowing: "bg-amber-400",
  growing: "bg-green-500",
  harvesting: "bg-orange-500",
  idle: "bg-gray-100",
};

const PHASE_TEXT_COLORS: Record<string, string> = {
  sowing: "text-amber-800",
  growing: "text-green-900",
  harvesting: "text-orange-900",
  idle: "text-gray-400",
};

interface Phase {
  month: number;
  phase: string;
}

interface CalendarEntry {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  phases: Phase[];
}

export default function CropTimeline({ calendars }: { calendars: CalendarEntry[] }) {
  if (calendars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <p className="text-gray-500 text-lg">No crop calendars found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-6">
        <span className="text-sm font-medium text-gray-600">Legend:</span>
        {Object.entries(PHASE_COLORS)
          .filter(([k]) => k !== "idle")
          .map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-sm capitalize text-gray-700">{phase}</span>
            </div>
          ))}
      </div>

      {/* Timeline cards */}
      {calendars.map((cal) => (
        <div key={cal._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800">{cal.cropName}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{cal.country}</span>
                <span>/</span>
                <span>{cal.state}</span>
                <span>/</span>
                <span>{cal.region}</span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {cal.season}
                </span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-12 gap-1">
              {MONTHS.map((m, i) => {
                const phase = cal.phases?.find((p) => p.month === i + 1);
                const phaseType = phase?.phase || "idle";
                return (
                  <div key={m} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{m}</div>
                    <div
                      className={`h-10 rounded-lg ${PHASE_COLORS[phaseType]} flex items-center justify-center transition-all hover:scale-105`}
                      title={`${m}: ${phaseType}`}
                    >
                      <span className={`text-xs font-medium ${PHASE_TEXT_COLORS[phaseType]}`}>
                        {phaseType !== "idle" ? phaseType.charAt(0).toUpperCase() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
