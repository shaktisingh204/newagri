/**
 * PDF/print helpers for single-crop reports.
 *
 * We intentionally do not import the mongoose model here to avoid pulling
 * server-only code into client components. Instead we declare a structural
 * type that mirrors the fields of `ICropCalendar` that we care about.
 */

export interface PhaseLike {
  month: number;
  phase: string;
}

export interface TemperatureRangeLike {
  min?: number;
  max?: number;
}

export interface ICropCalendarLike {
  cropName: string;
  country: string;
  state: string;
  region?: string;
  season: string;
  phases?: PhaseLike[];
  sowingMonths?: number[];
  growingMonths?: number[];
  harvestingMonths?: number[];
  durationDays?: number;
  soilType?: string;
  waterRequirement?: "low" | "medium" | "high" | string;
  temperatureRange?: TemperatureRangeLike;
  rainfallRequirement?: string;
  fertilizerRecommendation?: string;
  pests?: string[];
  yieldInfo?: string;
  profitEstimate?: string;
  description?: string;
}

const FULL_MONTHS: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS: readonly string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PHASE_FILLS: Record<string, string> = {
  sowing: "#fbbf24",
  growing: "#22c55e",
  harvesting: "#f97316",
  idle: "#f3f4f6",
};

const PHASE_TEXT: Record<string, string> = {
  sowing: "#78350f",
  growing: "#064e3b",
  harvesting: "#7c2d12",
  idle: "#9ca3af",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMonthList(months: number[] | undefined): string {
  if (!months || months.length === 0) return "Not specified";
  return months
    .filter((m) => m >= 1 && m <= 12)
    .map((m) => FULL_MONTHS[m - 1])
    .join(", ");
}

function formatText(value: string | undefined | null): string {
  if (value === undefined || value === null) return "Not specified";
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return "Not specified";
  return escapeHtml(trimmed);
}

function formatTemperatureRange(range: TemperatureRangeLike | undefined): string {
  if (!range) return "Not specified";
  const { min, max } = range;
  if (typeof min === "number" && typeof max === "number") {
    return `${min}&deg;C &ndash; ${max}&deg;C`;
  }
  if (typeof min === "number") return `Min ${min}&deg;C`;
  if (typeof max === "number") return `Max ${max}&deg;C`;
  return "Not specified";
}

function formatPestList(pests: string[] | undefined): string {
  if (!pests || pests.length === 0) return "Not specified";
  const cleaned = pests.map((p) => p.trim()).filter((p) => p.length > 0);
  if (cleaned.length === 0) return "Not specified";
  return cleaned.map(escapeHtml).join(", ");
}

function formatDuration(durationDays: number | undefined): string {
  if (typeof durationDays !== "number" || Number.isNaN(durationDays)) {
    return "Not specified";
  }
  return `${durationDays} days`;
}

function renderPhaseStrip(phases: PhaseLike[] | undefined): string {
  const cells: string[] = [];
  for (let i = 1; i <= 12; i += 1) {
    const match = phases?.find((p) => p.month === i);
    const phase = match?.phase ?? "idle";
    const fill = PHASE_FILLS[phase] ?? PHASE_FILLS.idle;
    const text = PHASE_TEXT[phase] ?? PHASE_TEXT.idle;
    const label = phase === "idle" ? "" : phase.slice(0, 3).toUpperCase();
    cells.push(
      `<td class="phase-cell" style="background:${fill};color:${text};">` +
        `<div class="phase-month">${SHORT_MONTHS[i - 1]}</div>` +
        `<div class="phase-label">${label}</div>` +
        `</td>`,
    );
  }
  return `<table class="phase-strip"><tr>${cells.join("")}</tr></table>`;
}

export function cropToPrintableHtml(calendar: ICropCalendarLike): string {
  const cropName = formatText(calendar.cropName);
  const country = formatText(calendar.country);
  const state = formatText(calendar.state);
  const region = formatText(calendar.region);
  const season = formatText(calendar.season);
  const sowing = formatMonthList(calendar.sowingMonths);
  const growing = formatMonthList(calendar.growingMonths);
  const harvesting = formatMonthList(calendar.harvestingMonths);
  const duration = formatDuration(calendar.durationDays);
  const soil = formatText(calendar.soilType);
  const water = formatText(calendar.waterRequirement);
  const temperature = formatTemperatureRange(calendar.temperatureRange);
  const rainfall = formatText(calendar.rainfallRequirement);
  const fertilizer = formatText(calendar.fertilizerRecommendation);
  const pests = formatPestList(calendar.pests);
  const yieldInfo = formatText(calendar.yieldInfo);
  const profit = formatText(calendar.profitEstimate);
  const description = formatText(calendar.description);
  const phaseStrip = renderPhaseStrip(calendar.phases);

  const title = `${cropName} Crop Report`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.5;
  }
  .page { padding: 0; max-width: 800px; margin: 0 auto; }
  header.report-header {
    border-bottom: 2px solid #111827;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  h1.title {
    font-family: "Georgia", "Times New Roman", Times, serif;
    font-size: 28pt;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: #111827;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-size: 11pt;
    color: #4b5563;
    margin: 0;
  }
  .location-block {
    margin-top: 8px;
    font-size: 10.5pt;
    color: #374151;
  }
  .season-chip {
    display: inline-block;
    padding: 2px 10px;
    border: 1px solid #111827;
    border-radius: 999px;
    font-size: 9.5pt;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin-top: 6px;
  }
  section {
    margin: 20px 0;
    page-break-inside: avoid;
  }
  h2.section-title {
    font-family: "Georgia", "Times New Roman", Times, serif;
    font-size: 14pt;
    font-weight: 700;
    margin: 0 0 10px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #d1d5db;
    color: #111827;
  }
  dl.kv {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 6px 16px;
    margin: 0;
  }
  dl.kv dt {
    font-weight: 600;
    color: #374151;
    font-size: 10.5pt;
  }
  dl.kv dd {
    margin: 0;
    color: #111827;
    font-size: 10.5pt;
  }
  p.description {
    margin: 0;
    font-size: 11pt;
    color: #1f2937;
    white-space: pre-line;
  }
  table.phase-strip {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 8px;
  }
  table.phase-strip td.phase-cell {
    width: 8.333%;
    padding: 8px 2px;
    text-align: center;
    border: 1px solid #ffffff;
    vertical-align: middle;
  }
  .phase-month {
    font-size: 9pt;
    font-weight: 600;
    opacity: 0.85;
  }
  .phase-label {
    font-size: 8.5pt;
    font-weight: 700;
    margin-top: 2px;
    min-height: 11pt;
  }
  .legend {
    margin-top: 10px;
    font-size: 9.5pt;
    color: #4b5563;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .legend-item { display: inline-flex; align-items: center; gap: 6px; }
  .legend-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  footer.report-footer {
    margin-top: 32px;
    padding-top: 8px;
    border-top: 1px solid #d1d5db;
    font-size: 9pt;
    color: #6b7280;
    text-align: center;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <main class="page">
    <header class="report-header">
      <h1 class="title">${cropName}</h1>
      <p class="subtitle">Crop Calendar Report</p>
      <div class="location-block">
        <div><strong>Country:</strong> ${country}</div>
        <div><strong>State:</strong> ${state}</div>
        <div><strong>District / Region:</strong> ${region}</div>
      </div>
      <span class="season-chip">Season: ${season}</span>
    </header>

    <section>
      <h2 class="section-title">12-Month Phase Strip</h2>
      ${phaseStrip}
      <div class="legend">
        <span class="legend-item"><span class="legend-swatch" style="background:${PHASE_FILLS.sowing};"></span>Sowing</span>
        <span class="legend-item"><span class="legend-swatch" style="background:${PHASE_FILLS.growing};"></span>Growing</span>
        <span class="legend-item"><span class="legend-swatch" style="background:${PHASE_FILLS.harvesting};"></span>Harvesting</span>
        <span class="legend-item"><span class="legend-swatch" style="background:${PHASE_FILLS.idle};border:1px solid #d1d5db;"></span>Idle</span>
      </div>
    </section>

    <section>
      <h2 class="section-title">Calendar Overview</h2>
      <dl class="kv">
        <dt>Sowing Months</dt><dd>${sowing}</dd>
        <dt>Growing Months</dt><dd>${growing}</dd>
        <dt>Harvesting Months</dt><dd>${harvesting}</dd>
        <dt>Duration</dt><dd>${duration}</dd>
      </dl>
    </section>

    <section>
      <h2 class="section-title">Growing Conditions</h2>
      <dl class="kv">
        <dt>Soil Type</dt><dd>${soil}</dd>
        <dt>Water Requirement</dt><dd>${water}</dd>
        <dt>Temperature Range</dt><dd>${temperature}</dd>
        <dt>Rainfall Requirement</dt><dd>${rainfall}</dd>
      </dl>
    </section>

    <section>
      <h2 class="section-title">Management</h2>
      <dl class="kv">
        <dt>Fertilizer</dt><dd>${fertilizer}</dd>
        <dt>Common Pests</dt><dd>${pests}</dd>
        <dt>Yield</dt><dd>${yieldInfo}</dd>
        <dt>Profit Estimate</dt><dd>${profit}</dd>
      </dl>
    </section>

    <section>
      <h2 class="section-title">Description</h2>
      <p class="description">${description}</p>
    </section>

    <footer class="report-footer">
      Generated from the crop calendar dashboard. Review local agronomic guidance before acting on these figures.
    </footer>
  </main>
</body>
</html>`;
}
