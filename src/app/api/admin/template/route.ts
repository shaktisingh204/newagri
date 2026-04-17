import { requireAdmin } from "@/lib/auth";
import * as XLSX from "xlsx";

type TemplateRow = Record<string, string | number>;

const HEADERS: string[] = [
  "Country",
  "State",
  "Region",
  "Crop",
  "Season",
  "Sowing Months",
  "Growing Months",
  "Harvesting Months",
  "Duration Days",
  "Soil Type",
  "Water Requirement",
  "Temperature Min",
  "Temperature Max",
  "Rainfall",
  "Fertilizer",
  "Pests",
  "Yield",
  "Profit",
  "Image",
  "Description",
];

const EXAMPLE_ROWS: TemplateRow[] = [
  {
    Country: "India",
    State: "Rajasthan",
    Region: "Jaipur",
    Crop: "Wheat",
    Season: "Rabi",
    "Sowing Months": "10,11",
    "Growing Months": "12,1,2",
    "Harvesting Months": "3,4",
    "Duration Days": 120,
    "Soil Type": "Loamy",
    "Water Requirement": "medium",
    "Temperature Min": 10,
    "Temperature Max": 25,
    Rainfall: "50-100mm annually",
    Fertilizer: "NPK 60:30:30",
    Pests: "Rust,Aphids",
    Yield: "3.5 t/ha",
    Profit: "Rs 30,000/acre",
    Image: "",
    Description: "A cool-season cereal grain.",
  },
  {
    Country: "India",
    State: "Punjab",
    Region: "Ludhiana",
    Crop: "Rice",
    Season: "Kharif",
    "Sowing Months": "5,6",
    "Growing Months": "7,8,9",
    "Harvesting Months": "10",
    "Duration Days": 140,
    "Soil Type": "Clay loam",
    "Water Requirement": "high",
    "Temperature Min": 20,
    "Temperature Max": 35,
    Rainfall: ">100mm",
    Fertilizer: "NPK 100:50:50",
    Pests: "Blast,Stem borer",
    Yield: "5 t/ha",
    Profit: "Rs 45,000/acre",
    Image: "",
    Description: "Staple food crop, grown in flooded paddies.",
  },
];

export async function GET(_request: Request): Promise<Response> {
  void _request;
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const worksheet = XLSX.utils.json_to_sheet(EXAMPLE_ROWS, { header: HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CropCalendar");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="crop-calendar-template.xlsx"',
    },
  });
}
