/* eslint-disable @typescript-eslint/no-require-imports */
const mg = require("mongoose");
const bc = require("bcryptjs");
const XL = require("xlsx");
const path = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agrisphere";
const TENANT_ID = "default-tenant";

// ── Schemas ──
const UserSchema = new mg.Schema({ email: { type: String, required: true, unique: true, lowercase: true }, password: String, name: String, role: { type: String, default: "user" }, tenantId: String }, { timestamps: true });
const CropSchema = new mg.Schema({ name: String, category: { type: String, default: "General" }, description: { type: String, default: "" }, tenantId: String }, { timestamps: true });
const RegionSchema = new mg.Schema({ country: String, state: String, region: String, agroEcologicalZone: { type: String, default: "" }, latitude: Number, longitude: Number, tenantId: String }, { timestamps: true });
const CropCalendarSchema = new mg.Schema({ cropId: mg.Schema.Types.ObjectId, regionId: mg.Schema.Types.ObjectId, cropName: String, country: String, state: String, region: String, season: String, phases: [{ month: Number, phase: String }], sowingMonths: [Number], growingMonths: [Number], harvestingMonths: [Number], tenantId: String }, { timestamps: true });
const UsageEventSchema = new mg.Schema({ eventType: String, cropName: String, country: String, filters: mg.Schema.Types.Mixed, tenantId: String, userId: String }, { timestamps: true });

const User = mg.model("User", UserSchema);
const Crop = mg.model("Crop", CropSchema);
const Region = mg.model("Region", RegionSchema);
const CropCalendar = mg.model("CropCalendar", CropCalendarSchema);
const UsageEvent = mg.model("UsageEvent", UsageEventSchema);

// ── Approximate district coordinates (state → district → [lat, lon]) ──
const DISTRICT_COORDS: Record<string, Record<string, [number, number]>> = {
  Bihar: { _default: [25.6, 85.1], Arwal: [25.16, 84.69], Araria: [26.15, 87.51], Aurangabad: [24.75, 84.37], Banka: [24.89, 86.92], Begusarai: [25.42, 86.13], Bhagalpur: [25.24, 86.97], Bhojpur: [25.56, 84.45], Buxar: [25.56, 83.98], Darbhanga: [26.17, 85.9], Gaya: [24.8, 85.0], Gopalganj: [26.47, 84.43], Jamui: [24.93, 86.22], Jehanabad: [25.21, 84.99], Kaimur: [25.04, 83.58], Katihar: [25.53, 87.58], Khagaria: [25.5, 86.47], Kishanganj: [26.09, 87.95], Lakhisarai: [25.16, 86.1], Madhepura: [25.92, 86.79], Madhubani: [26.35, 86.07], Munger: [25.38, 86.47], Muzaffarpur: [26.12, 85.4], Nalanda: [25.13, 85.44], Nawada: [24.89, 85.54], Pashchim: [26.28, 84.85], Patna: [25.61, 85.14], Purba: [26.25, 85.43], Purnia: [25.78, 87.47], Rohtas: [24.97, 83.81], Saharsa: [25.88, 86.6], Samastipur: [25.86, 85.78], Saran: [25.87, 84.78], Sheikhpura: [25.14, 85.84], Sheohar: [26.52, 85.3], Sitamarhi: [26.59, 85.49], Siwan: [26.22, 84.36], Supaul: [26.12, 86.6], Vaishali: [25.69, 85.22] },
  Jharkhand: { _default: [23.35, 85.33], Bokaro: [23.67, 86.15], Chatra: [24.21, 84.87], Deoghar: [24.49, 86.7], Dhanbad: [23.8, 86.43], Dumka: [24.27, 87.25], "East Singhbhum": [22.8, 86.2], Garhwa: [24.17, 83.8], Giridih: [24.19, 86.3], Godda: [24.83, 87.22], Gumla: [23.04, 84.54], Hazaribag: [23.99, 85.36], Jamtara: [23.96, 86.8], Khunti: [23.07, 85.28], Koderma: [24.47, 85.59], Latehar: [23.74, 84.5], Lohardaga: [23.44, 84.68], Pakur: [24.63, 87.84], Palamu: [24.03, 84.05], Ramgarh: [23.63, 85.56], Ranchi: [23.35, 85.33], Sahebganj: [24.99, 87.65], "Saraikela Kharsawan": [22.7, 85.93], Simdega: [22.62, 84.51], "West Singhbhum": [22.37, 85.82] },
  Orissa: { _default: [20.27, 84.27], Angul: [20.84, 85.1], Balasore: [21.49, 86.93], Bargarh: [21.33, 83.62], Bhadrak: [21.05, 86.5], Bolangir: [20.7, 83.48], Boudh: [20.84, 84.32], Cuttack: [20.46, 85.88], Deogarh: [21.54, 84.73], Dhenkanal: [20.67, 85.6], Gajapati: [19.21, 84.13], Ganjam: [19.39, 84.68], Jagatsinghpur: [20.26, 86.17], Jajpur: [20.84, 86.34], Jharsuguda: [21.86, 84.01], Kalahandi: [19.91, 83.17], Kandhamal: [20.47, 84.07], Kendrapara: [20.5, 86.42], Keonjhar: [21.63, 85.58], Khurda: [20.18, 85.62], Koraput: [18.81, 82.71], Malkangiri: [18.35, 81.88], Mayurbhanj: [21.93, 86.72], Nabarangpur: [19.23, 82.55], Nayagarh: [20.13, 85.1], Nuapada: [20.78, 82.55], Puri: [19.81, 85.83], Rayagada: [19.17, 83.42], Sambalpur: [21.47, 83.97], Sonepur: [20.83, 83.9], Sundargarh: [22.12, 84.04] },
  Gujarat: { _default: [22.31, 72.13], Ahmedabad: [23.02, 72.57], Amreli: [21.6, 71.22], Anand: [22.56, 72.95], Banaskantha: [24.17, 72.43], Bharuch: [21.7, 72.97], Bhavnagar: [21.77, 72.15], Dahod: [22.84, 74.25], Gandhinagar: [23.22, 72.64], Jamnagar: [22.47, 70.07], Junagadh: [21.52, 70.46], Kachchh: [23.73, 69.86], Kheda: [22.75, 72.68], Mehsana: [23.59, 72.38], Narmada: [21.88, 73.5], Navsari: [20.95, 72.93], Panchmahal: [22.75, 73.6], Patan: [23.85, 72.13], Porbandar: [21.64, 69.6], Rajkot: [22.3, 70.78], Sabarkantha: [23.62, 73.05], Surat: [21.17, 72.83], Surendranagar: [22.73, 71.68], Vadodara: [22.3, 73.19], Valsad: [20.63, 72.93] },
  Rajashthan: { _default: [26.45, 73.11], Ajmer: [26.45, 74.64], Alwar: [27.56, 76.6], Banswara: [23.55, 74.44], Baran: [25.1, 76.51], Barmer: [25.75, 71.39], Bharatpur: [27.22, 77.49], Bhilwara: [25.35, 74.64], Bikaner: [28.02, 73.31], Bundi: [25.44, 75.64], Chittorgarh: [24.88, 74.63], Churu: [28.3, 74.97], Dausa: [26.88, 76.34], Dholpur: [26.7, 77.89], Dungarpur: [23.84, 73.71], Hanumangarh: [29.58, 74.33], Jaipur: [26.92, 75.79], Jaisalmer: [26.91, 70.91], Jalore: [25.34, 72.62], Jhalawar: [24.6, 76.16], Jhunjhunu: [28.13, 75.4], Jodhpur: [26.24, 73.02], Karauli: [26.49, 77.02], Kota: [25.18, 75.83], Nagaur: [27.2, 73.73], Pali: [25.77, 73.33], Pratapgarh: [24.03, 74.78], Rajsamand: [25.07, 73.88], "Sawai Madhopur": [26.02, 76.35], Sikar: [27.61, 75.14], Sirohi: [24.88, 72.86], "Sri Ganganagar": [29.91, 73.88], Tonk: [26.17, 75.79], Udaipur: [24.58, 73.68] },
  HP: { _default: [31.1, 77.17], Bilaspur: [31.34, 76.76], Chamba: [32.56, 76.13], Hamirpur: [31.68, 76.52], Kangra: [32.1, 76.27], Kinnaur: [31.58, 78.17], Kullu: [31.96, 77.11], "Lahaul Spiti": [32.57, 77.03], Mandi: [31.72, 76.93], Shimla: [31.1, 77.17], Sirmaur: [30.57, 77.3], Solan: [30.91, 77.1], Una: [31.47, 76.27] },
  UP: { _default: [26.85, 80.91], Agra: [27.18, 78.02], Aligarh: [27.88, 78.08], Allahabad: [25.43, 81.85], Ambedkarnagar: [26.45, 82.55], Amethi: [26.15, 81.81], Amroha: [28.9, 78.47], Auraiya: [26.47, 79.52], Azamgarh: [26.07, 83.19], Baghpat: [28.95, 77.22], Bahraich: [27.57, 81.6], Ballia: [25.76, 84.15], Balrampur: [27.43, 82.18], Banda: [25.48, 80.34], Barabanki: [26.93, 81.17], Bareilly: [28.37, 79.42], Basti: [26.8, 82.76], Bijnor: [29.37, 78.13], Budaun: [28.04, 79.12], Bulandshahr: [28.41, 77.85], Chandauli: [25.26, 83.27], Chitrakoot: [25.2, 80.89], Deoria: [26.5, 83.79], Etah: [27.56, 78.66], Etawah: [26.78, 79.02], Faizabad: [26.77, 82.14], Farrukhabad: [27.39, 79.58], Fatehpur: [25.93, 80.81], Firozabad: [27.15, 78.4], Gautam: [28.57, 77.36], Ghaziabad: [28.67, 77.42], Ghazipur: [25.58, 83.58], Gonda: [27.13, 81.96], Gorakhpur: [26.76, 83.37], Hamirpur: [25.95, 80.15], Hardoi: [27.4, 80.13], Hathras: [27.6, 78.05], Jalaun: [26.15, 79.34], Jaunpur: [25.75, 82.68], Jhansi: [25.45, 78.57], Kannauj: [27.06, 79.92], "Kanpur Dehat": [26.4, 79.95], "Kanpur Nagar": [26.45, 80.35], Kaushambi: [25.53, 81.38], Kushinagar: [26.74, 83.89], "Lakhimpur Kheri": [27.95, 80.78], Lalitpur: [24.69, 78.42], Lucknow: [26.85, 80.95], Maharajganj: [27.13, 83.56], Mahoba: [25.29, 79.87], Mainpuri: [27.23, 79.03], Mathura: [27.49, 77.67], Mau: [25.94, 83.56], Meerut: [28.98, 77.71], Mirzapur: [25.15, 82.58], Moradabad: [28.83, 78.78], Muzaffarnagar: [29.47, 77.7], Pilibhit: [28.63, 79.8], Pratapgarh: [25.9, 81.95], "Rae Bareli": [26.23, 81.24], Rampur: [28.81, 79.03], Saharanpur: [29.97, 77.55], Sambhal: [28.58, 78.57], "Sant Kabir Nagar": [26.79, 83.04], "Sant Ravi Dass Nagar": [25.37, 82.57], Shahjahanpur: [27.88, 79.91], Shamli: [29.45, 77.31], Shravasti: [27.5, 82.05], Siddharthnagar: [27.29, 83.09], Sitapur: [27.57, 80.68], Sonbhadra: [24.69, 83.07], Sultanpur: [26.26, 82.07], Unnao: [26.55, 80.49], Varanasi: [25.32, 83.01] },
  Uttarakhand: { _default: [30.07, 79.02], Almora: [29.6, 79.66], Bageshwar: [29.84, 79.77], Chamoli: [30.4, 79.32], Champawat: [29.34, 80.09], Dehradun: [30.32, 78.03], Haridwar: [29.95, 78.16], Nainital: [29.38, 79.45], "Pauri Garhwal": [30.15, 78.78], Pithoragarh: [29.58, 80.22], Rudraprayag: [30.28, 78.98], "Tehri Garhwal": [30.39, 78.48], "Udham Singh Nagar": [28.99, 79.41], Uttarkashi: [30.73, 78.44] },
};

// ── Parse month from text like "15th June", "1st Mar.", "First fortnight of October" ──
const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

function extractMonths(text: string): number[] {
  if (!text || text === "From              To") return [];
  const cleaned = text.toLowerCase().replace(/\./g, "").replace(/\n/g, " ");
  const found: number[] = [];
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (cleaned.includes(name)) {
      if (!found.includes(num)) found.push(num);
    }
  }
  return found.sort((a, b) => a - b);
}

function expandMonthRange(fromMonths: number[], toMonths: number[]): number[] {
  if (fromMonths.length === 0 && toMonths.length === 0) return [];
  const start = fromMonths.length > 0 ? Math.min(...fromMonths) : (toMonths.length > 0 ? Math.min(...toMonths) : 0);
  const end = toMonths.length > 0 ? Math.max(...toMonths) : (fromMonths.length > 0 ? Math.max(...fromMonths) : 0);
  if (start === 0 || end === 0) return [...new Set([...fromMonths, ...toMonths])];
  const months: number[] = [];
  if (start <= end) {
    for (let m = start; m <= end; m++) months.push(m);
  } else {
    // Wraps around year (e.g., Oct to Feb)
    for (let m = start; m <= 12; m++) months.push(m);
    for (let m = 1; m <= end; m++) months.push(m);
  }
  return months;
}

function parsePeriod(periodText: string): number[] {
  if (!periodText || periodText === "From              To") return [];
  // Try to split by common separators: "-", "–", "—", "to"
  const parts = periodText.split(/\s*[-–—]\s*|\s+to\s+/i);
  if (parts.length >= 2) {
    const fromMonths = extractMonths(parts[0]);
    const toMonths = extractMonths(parts[parts.length - 1]);
    return expandMonthRange(fromMonths, toMonths);
  }
  return extractMonths(periodText);
}

function normalizeSeason(raw: string): string {
  const s = raw.trim().replace(/[:\n]/g, " ").replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (lower.includes("kharif")) return "Kharif";
  if (lower.includes("rabi") && lower.includes("boro")) return "Rabi (Boro)";
  if (lower.includes("rabi") && lower.includes("lotni")) return "Rabi (Lotni)";
  if (lower.includes("rabi")) return "Rabi";
  if (lower.includes("summer") || lower.includes("zaid")) return "Summer";
  if (lower.includes("autumn")) return "Autumn";
  if (lower.includes("spring")) return "Spring";
  return s || "Kharif";
}

function normalizeState(raw: string): string {
  const map: Record<string, string> = {
    "HP": "Himachal Pradesh",
    "UP": "Uttar Pradesh",
    "Rajashthan": "Rajasthan",
    "Orissa": "Odisha",
  };
  return map[raw] || raw;
}

async function seed() {
  await mg.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clean
  await Promise.all([
    User.deleteMany({}),
    Crop.deleteMany({}),
    Region.deleteMany({}),
    CropCalendar.deleteMany({}),
    UsageEvent.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create users
  const adminPwd = await bc.hash("admin123", 12);
  const userPwd = await bc.hash("user123", 12);
  await User.create([
    { email: "admin@agrisphere.com", password: adminPwd, name: "Admin User", role: "admin", tenantId: TENANT_ID },
    { email: "user@agrisphere.com", password: userPwd, name: "Demo User", role: "user", tenantId: TENANT_ID },
  ]);
  console.log("Created users");

  // ── Read XLSX ──
  const xlsxPath = path.join(__dirname, "..", "New_Crop_Calendar.xlsx");
  const wb = XL.readFile(xlsxPath);

  // Collect all rows from all sheets
  const allRows: any[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data = XL.utils.sheet_to_json(sheet, { defval: "" });
    for (const row of data) {
      const slNo = row["Sl. No."];
      const state = row["State"];
      const district = row["Name of the district (All districts)"];
      const crop = row["Crop"];
      const season = row["Season"];
      const sowingPeriod = row["Sowing Period"];
      const harvestingPeriod = row["Harvesting period"];

      // Skip header/empty rows
      if (!slNo || !state || !crop || typeof slNo !== "number") continue;
      // Skip category headers like "Pulses:", "OILSEEDS", etc.
      if (crop.endsWith(":") || crop === crop.toUpperCase() && crop.length > 3) continue;

      const sowingMonths = parsePeriod(String(sowingPeriod));
      const harvestingMonths = parsePeriod(String(harvestingPeriod));

      if (sowingMonths.length === 0 && harvestingMonths.length === 0) continue;

      allRows.push({
        state: normalizeState(String(state)),
        district: String(district).trim(),
        crop: String(crop).trim(),
        season: normalizeSeason(String(season)),
        sowingMonths,
        harvestingMonths,
      });
    }
  }

  console.log(`Parsed ${allRows.length} valid rows from XLSX`);

  // ── Create unique regions (state + district) ──
  const regionKey = (state: string, district: string) => `${state}|${district}`;
  const uniqueRegions = new Map<string, { state: string; district: string }>();
  for (const row of allRows) {
    const key = regionKey(row.state, row.district);
    if (!uniqueRegions.has(key)) {
      uniqueRegions.set(key, { state: row.state, district: row.district });
    }
  }

  const regionDocs = [];
  for (const { state, district } of uniqueRegions.values()) {
    // Look up coordinates
    const rawState = Object.keys(DISTRICT_COORDS).find(
      (k) => normalizeState(k) === state || k === state
    );
    const stateCoords = rawState ? DISTRICT_COORDS[rawState] : null;
    let lat = 20.59, lon = 78.96; // Default India center
    if (stateCoords) {
      const distCoords = stateCoords[district] || stateCoords._default;
      if (distCoords) { lat = distCoords[0]; lon = distCoords[1]; }
    }

    regionDocs.push({
      country: "India",
      state,
      region: district,
      agroEcologicalZone: "",
      latitude: lat,
      longitude: lon,
      tenantId: TENANT_ID,
    });
  }
  const insertedRegions = await Region.insertMany(regionDocs);
  const regionMap = new Map<string, any>();
  insertedRegions.forEach((r: any) => regionMap.set(regionKey(r.state, r.region), r));
  console.log(`Created ${insertedRegions.length} regions`);

  // ── Create unique crops ──
  const uniqueCrops = [...new Set(allRows.map((r) => r.crop))];
  const insertedCrops = await Crop.insertMany(
    uniqueCrops.map((name) => ({ name, category: "General", tenantId: TENANT_ID }))
  );
  const cropMap = new Map<string, any>();
  insertedCrops.forEach((c: any) => cropMap.set(c.name, c));
  console.log(`Created ${insertedCrops.length} crops`);

  // ── Create crop calendars ──
  const calDocs = [];
  for (const row of allRows) {
    const regionDoc = regionMap.get(regionKey(row.state, row.district));
    const cropDoc = cropMap.get(row.crop);
    if (!regionDoc || !cropDoc) continue;

    // Compute growing months = months between sowing end and harvesting start
    const sowSet = new Set(row.sowingMonths);
    const harvestSet = new Set(row.harvestingMonths);
    const growingMonths: number[] = [];

    if (row.sowingMonths.length > 0 && row.harvestingMonths.length > 0) {
      const sowEnd = Math.max(...row.sowingMonths);
      const harvestStart = Math.min(...row.harvestingMonths);
      // Fill growing months between sowing end and harvest start
      if (sowEnd < harvestStart) {
        for (let m = sowEnd + 1; m < harvestStart; m++) {
          if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
        }
      } else if (sowEnd > harvestStart) {
        // Wraps around year
        for (let m = sowEnd + 1; m <= 12; m++) {
          if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
        }
        for (let m = 1; m < harvestStart; m++) {
          if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
        }
      }
    }

    const phases = [];
    for (let m = 1; m <= 12; m++) {
      if (sowSet.has(m)) phases.push({ month: m, phase: "sowing" });
      else if (growingMonths.includes(m)) phases.push({ month: m, phase: "growing" });
      else if (harvestSet.has(m)) phases.push({ month: m, phase: "harvesting" });
      else phases.push({ month: m, phase: "idle" });
    }

    calDocs.push({
      cropId: cropDoc._id,
      regionId: regionDoc._id,
      cropName: row.crop,
      country: "India",
      state: row.state,
      region: row.district,
      season: row.season,
      phases,
      sowingMonths: row.sowingMonths,
      growingMonths,
      harvestingMonths: row.harvestingMonths,
      tenantId: TENANT_ID,
    });
  }

  // Insert in batches of 500
  for (let i = 0; i < calDocs.length; i += 500) {
    await CropCalendar.insertMany(calDocs.slice(i, i + 500));
  }
  console.log(`Created ${calDocs.length} crop calendars`);

  // ── Create sample usage events for analytics ──
  const topCrops = ["Rice", "Wheat", "Maize", "Arhar", "Gram", "Sugarcane", "Mustard", "Urad", "Barley", "Lentil"];
  const events: any[] = [];
  for (const crop of topCrops) {
    const count = Math.floor(Math.random() * 40) + 10;
    for (let i = 0; i < count; i++) {
      events.push({
        eventType: "crop_search",
        cropName: crop,
        country: "India",
        tenantId: TENANT_ID,
      });
    }
  }
  await UsageEvent.insertMany(events);
  console.log(`Created ${events.length} usage events`);

  console.log("\n✅ Seed complete!");
  console.log("  Admin: admin@agrisphere.com / admin123");
  console.log("  User:  user@agrisphere.com / user123");
  console.log(`  Regions: ${insertedRegions.length} | Crops: ${insertedCrops.length} | Calendars: ${calDocs.length}`);

  await mg.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
