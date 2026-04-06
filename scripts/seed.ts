/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agrisphere";

// ── Schemas (inline to avoid TS module issues in script) ──
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const CropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const RegionSchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    state: { type: String, required: true },
    region: { type: String, required: true },
    agroEcologicalZone: { type: String, default: "" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const CropCalendarSchema = new mongoose.Schema(
  {
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
    regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
    cropName: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    region: { type: String, required: true },
    season: { type: String, required: true },
    phases: [{ month: Number, phase: String }],
    sowingMonths: [Number],
    growingMonths: [Number],
    harvestingMonths: [Number],
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const UsageEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true },
    cropName: String,
    country: String,
    filters: mongoose.Schema.Types.Mixed,
    tenantId: { type: String, required: true },
    userId: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Crop = mongoose.model("Crop", CropSchema);
const Region = mongoose.model("Region", RegionSchema);
const CropCalendar = mongoose.model("CropCalendar", CropCalendarSchema);
const UsageEvent = mongoose.model("UsageEvent", UsageEventSchema);

const TENANT_ID = "default-tenant";

// ── Seed Data ──
const regionsData = [
  // India
  { country: "India", state: "Punjab", region: "Ludhiana", aez: "Indo-Gangetic Plain", lat: 30.9, lon: 75.85 },
  { country: "India", state: "Punjab", region: "Amritsar", aez: "Indo-Gangetic Plain", lat: 31.63, lon: 74.87 },
  { country: "India", state: "Maharashtra", region: "Nagpur", aez: "Deccan Plateau", lat: 21.15, lon: 79.09 },
  { country: "India", state: "Maharashtra", region: "Pune", aez: "Western Ghats Transition", lat: 18.52, lon: 73.86 },
  { country: "India", state: "Uttar Pradesh", region: "Lucknow", aez: "Indo-Gangetic Plain", lat: 26.85, lon: 80.95 },
  { country: "India", state: "Tamil Nadu", region: "Thanjavur", aez: "Cauvery Delta", lat: 10.79, lon: 79.14 },
  // Brazil
  { country: "Brazil", state: "Mato Grosso", region: "Sorriso", aez: "Cerrado", lat: -12.55, lon: -55.71 },
  { country: "Brazil", state: "Paraná", region: "Londrina", aez: "Atlantic Forest Transition", lat: -23.31, lon: -51.16 },
  { country: "Brazil", state: "Rio Grande do Sul", region: "Porto Alegre", aez: "Pampa", lat: -30.03, lon: -51.23 },
  // USA
  { country: "USA", state: "Iowa", region: "Des Moines", aez: "Corn Belt", lat: 41.6, lon: -93.61 },
  { country: "USA", state: "Kansas", region: "Wichita", aez: "Great Plains", lat: 37.69, lon: -97.34 },
  { country: "USA", state: "California", region: "Sacramento Valley", aez: "Mediterranean", lat: 38.58, lon: -121.49 },
  // Nigeria
  { country: "Nigeria", state: "Kano", region: "Kano Central", aez: "Sudan Savanna", lat: 12.0, lon: 8.52 },
  { country: "Nigeria", state: "Benue", region: "Makurdi", aez: "Guinea Savanna", lat: 7.73, lon: 8.52 },
  { country: "Nigeria", state: "Ogun", region: "Abeokuta", aez: "Forest-Savanna Mosaic", lat: 7.16, lon: 3.35 },
  // China
  { country: "China", state: "Heilongjiang", region: "Harbin", aez: "Northeast Plain", lat: 45.75, lon: 126.65 },
  { country: "China", state: "Sichuan", region: "Chengdu", aez: "Sichuan Basin", lat: 30.57, lon: 104.07 },
  { country: "China", state: "Guangdong", region: "Guangzhou", aez: "South China Tropical", lat: 23.13, lon: 113.26 },
  // Kenya
  { country: "Kenya", state: "Rift Valley", region: "Nakuru", aez: "Highland", lat: -0.3, lon: 36.07 },
  { country: "Kenya", state: "Western", region: "Kakamega", aez: "Lake Basin", lat: 0.28, lon: 34.75 },
  { country: "Kenya", state: "Eastern", region: "Meru", aez: "Semi-Arid", lat: 0.05, lon: 37.65 },
  // Australia
  { country: "Australia", state: "New South Wales", region: "Moree", aez: "Northern Slopes", lat: -29.47, lon: 149.85 },
  { country: "Australia", state: "Western Australia", region: "Geraldton", aez: "Mid West", lat: -28.77, lon: 114.62 },
  { country: "Australia", state: "Queensland", region: "Emerald", aez: "Central Highlands", lat: -23.53, lon: 148.16 },
  // Thailand
  { country: "Thailand", state: "Chiang Mai", region: "Mae Rim", aez: "Northern Highland", lat: 18.86, lon: 98.86 },
  { country: "Thailand", state: "Nakhon Ratchasima", region: "Pak Chong", aez: "Khorat Plateau", lat: 14.71, lon: 101.42 },
  { country: "Thailand", state: "Surat Thani", region: "Chaiya", aez: "Southern Coastal", lat: 9.38, lon: 99.19 },
];

interface CalendarData {
  crop: string;
  category: string;
  regionIndex: number;
  season: string;
  sowing: number[];
  growing: number[];
  harvesting: number[];
}

const calendarsData: CalendarData[] = [
  // India - Punjab - Ludhiana
  { crop: "Wheat", category: "Cereal", regionIndex: 0, season: "Rabi", sowing: [10, 11], growing: [12, 1, 2], harvesting: [3, 4] },
  { crop: "Rice", category: "Cereal", regionIndex: 0, season: "Kharif", sowing: [6, 7], growing: [7, 8, 9], harvesting: [10, 11] },
  { crop: "Maize", category: "Cereal", regionIndex: 0, season: "Kharif", sowing: [6], growing: [7, 8, 9], harvesting: [9, 10] },
  // India - Punjab - Amritsar
  { crop: "Wheat", category: "Cereal", regionIndex: 1, season: "Rabi", sowing: [10, 11], growing: [12, 1, 2], harvesting: [3, 4] },
  { crop: "Cotton", category: "Fiber", regionIndex: 1, season: "Kharif", sowing: [4, 5], growing: [6, 7, 8, 9], harvesting: [10, 11] },
  // India - Maharashtra - Nagpur
  { crop: "Soybean", category: "Oilseed", regionIndex: 2, season: "Kharif", sowing: [6], growing: [7, 8, 9], harvesting: [10] },
  { crop: "Cotton", category: "Fiber", regionIndex: 2, season: "Kharif", sowing: [5, 6], growing: [7, 8, 9, 10], harvesting: [11, 12] },
  { crop: "Orange", category: "Fruit", regionIndex: 2, season: "Perennial", sowing: [6, 7], growing: [8, 9, 10, 11], harvesting: [12, 1, 2] },
  // India - Maharashtra - Pune
  { crop: "Sugarcane", category: "Cash Crop", regionIndex: 3, season: "Annual", sowing: [1, 2], growing: [3, 4, 5, 6, 7, 8, 9, 10], harvesting: [11, 12] },
  { crop: "Onion", category: "Vegetable", regionIndex: 3, season: "Rabi", sowing: [10, 11], growing: [12, 1], harvesting: [2, 3] },
  // India - UP - Lucknow
  { crop: "Rice", category: "Cereal", regionIndex: 4, season: "Kharif", sowing: [6], growing: [7, 8, 9], harvesting: [10, 11] },
  { crop: "Wheat", category: "Cereal", regionIndex: 4, season: "Rabi", sowing: [11], growing: [12, 1, 2], harvesting: [3, 4] },
  { crop: "Potato", category: "Tuber", regionIndex: 4, season: "Rabi", sowing: [10], growing: [11, 12, 1], harvesting: [2, 3] },
  // India - Tamil Nadu - Thanjavur
  { crop: "Rice", category: "Cereal", regionIndex: 5, season: "Samba", sowing: [8, 9], growing: [10, 11, 12], harvesting: [1, 2] },
  { crop: "Rice", category: "Cereal", regionIndex: 5, season: "Kuruvai", sowing: [6], growing: [7, 8], harvesting: [9] },
  // Brazil - Mato Grosso - Sorriso
  { crop: "Soybean", category: "Oilseed", regionIndex: 6, season: "Main", sowing: [9, 10], growing: [11, 12, 1], harvesting: [2, 3] },
  { crop: "Maize", category: "Cereal", regionIndex: 6, season: "Safrinha", sowing: [2, 3], growing: [4, 5, 6], harvesting: [7, 8] },
  { crop: "Cotton", category: "Fiber", regionIndex: 6, season: "Main", sowing: [12, 1], growing: [2, 3, 4, 5], harvesting: [6, 7] },
  // Brazil - Paraná - Londrina
  { crop: "Soybean", category: "Oilseed", regionIndex: 7, season: "Main", sowing: [10, 11], growing: [12, 1, 2], harvesting: [3, 4] },
  { crop: "Wheat", category: "Cereal", regionIndex: 7, season: "Winter", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  // Brazil - RS - Porto Alegre
  { crop: "Rice", category: "Cereal", regionIndex: 8, season: "Main", sowing: [10, 11], growing: [12, 1, 2], harvesting: [3, 4] },
  // USA - Iowa - Des Moines
  { crop: "Maize", category: "Cereal", regionIndex: 9, season: "Spring", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  { crop: "Soybean", category: "Oilseed", regionIndex: 9, season: "Spring", sowing: [5], growing: [6, 7, 8], harvesting: [9, 10] },
  // USA - Kansas - Wichita
  { crop: "Wheat", category: "Cereal", regionIndex: 10, season: "Winter", sowing: [9, 10], growing: [11, 12, 1, 2, 3, 4], harvesting: [6, 7] },
  { crop: "Sorghum", category: "Cereal", regionIndex: 10, season: "Spring", sowing: [5, 6], growing: [7, 8], harvesting: [9, 10] },
  // USA - California - Sacramento
  { crop: "Rice", category: "Cereal", regionIndex: 11, season: "Spring", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  { crop: "Tomato", category: "Vegetable", regionIndex: 11, season: "Spring", sowing: [3, 4], growing: [5, 6, 7], harvesting: [7, 8, 9] },
  // Nigeria - Kano
  { crop: "Millet", category: "Cereal", regionIndex: 12, season: "Rainy", sowing: [6], growing: [7, 8, 9], harvesting: [10] },
  { crop: "Groundnut", category: "Oilseed", regionIndex: 12, season: "Rainy", sowing: [6, 7], growing: [8, 9], harvesting: [10, 11] },
  { crop: "Cowpea", category: "Legume", regionIndex: 12, season: "Rainy", sowing: [7], growing: [8, 9], harvesting: [10] },
  // Nigeria - Benue
  { crop: "Yam", category: "Tuber", regionIndex: 13, season: "Rainy", sowing: [3, 4], growing: [5, 6, 7, 8, 9], harvesting: [10, 11] },
  { crop: "Rice", category: "Cereal", regionIndex: 13, season: "Rainy", sowing: [6], growing: [7, 8, 9], harvesting: [10, 11] },
  // Nigeria - Ogun
  { crop: "Cassava", category: "Tuber", regionIndex: 14, season: "Annual", sowing: [3, 4], growing: [5, 6, 7, 8, 9, 10, 11], harvesting: [12, 1, 2] },
  { crop: "Maize", category: "Cereal", regionIndex: 14, season: "Early", sowing: [3, 4], growing: [5, 6], harvesting: [7] },
  // China - Heilongjiang - Harbin
  { crop: "Rice", category: "Cereal", regionIndex: 15, season: "Spring", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  { crop: "Soybean", category: "Oilseed", regionIndex: 15, season: "Spring", sowing: [5], growing: [6, 7, 8], harvesting: [9, 10] },
  { crop: "Maize", category: "Cereal", regionIndex: 15, season: "Spring", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  // China - Sichuan - Chengdu
  { crop: "Rice", category: "Cereal", regionIndex: 16, season: "Summer", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9] },
  { crop: "Rapeseed", category: "Oilseed", regionIndex: 16, season: "Winter", sowing: [9, 10], growing: [11, 12, 1, 2], harvesting: [3, 4] },
  // China - Guangdong - Guangzhou
  { crop: "Rice", category: "Cereal", regionIndex: 17, season: "Early", sowing: [2, 3], growing: [4, 5, 6], harvesting: [7] },
  { crop: "Rice", category: "Cereal", regionIndex: 17, season: "Late", sowing: [7], growing: [8, 9, 10], harvesting: [11] },
  // Kenya - Rift Valley - Nakuru
  { crop: "Wheat", category: "Cereal", regionIndex: 18, season: "Long Rains", sowing: [3, 4], growing: [5, 6, 7], harvesting: [8, 9] },
  { crop: "Maize", category: "Cereal", regionIndex: 18, season: "Long Rains", sowing: [3], growing: [4, 5, 6, 7], harvesting: [8] },
  // Kenya - Western - Kakamega
  { crop: "Maize", category: "Cereal", regionIndex: 19, season: "Long Rains", sowing: [3], growing: [4, 5, 6], harvesting: [7, 8] },
  { crop: "Sugarcane", category: "Cash Crop", regionIndex: 19, season: "Annual", sowing: [3, 4], growing: [5, 6, 7, 8, 9, 10, 11, 12], harvesting: [1, 2] },
  { crop: "Tea", category: "Beverage", regionIndex: 19, season: "Perennial", sowing: [3], growing: [4, 5, 6, 7, 8, 9, 10, 11], harvesting: [12, 1, 2] },
  // Kenya - Eastern - Meru
  { crop: "Millet", category: "Cereal", regionIndex: 20, season: "Short Rains", sowing: [10], growing: [11, 12, 1], harvesting: [2] },
  { crop: "Green Gram", category: "Legume", regionIndex: 20, season: "Short Rains", sowing: [10], growing: [11, 12], harvesting: [1] },
  // Australia - NSW - Moree
  { crop: "Wheat", category: "Cereal", regionIndex: 21, season: "Winter", sowing: [5, 6], growing: [7, 8, 9, 10], harvesting: [11, 12] },
  { crop: "Cotton", category: "Fiber", regionIndex: 21, season: "Summer", sowing: [10, 11], growing: [12, 1, 2, 3], harvesting: [4, 5] },
  // Australia - WA - Geraldton
  { crop: "Wheat", category: "Cereal", regionIndex: 22, season: "Winter", sowing: [5], growing: [6, 7, 8, 9], harvesting: [10, 11] },
  { crop: "Canola", category: "Oilseed", regionIndex: 22, season: "Winter", sowing: [4, 5], growing: [6, 7, 8, 9], harvesting: [10, 11] },
  // Australia - QLD - Emerald
  { crop: "Sorghum", category: "Cereal", regionIndex: 23, season: "Summer", sowing: [9, 10], growing: [11, 12, 1, 2], harvesting: [3, 4] },
  { crop: "Chickpea", category: "Legume", regionIndex: 23, season: "Winter", sowing: [4, 5], growing: [6, 7, 8], harvesting: [9, 10] },
  // Thailand - Chiang Mai
  { crop: "Rice", category: "Cereal", regionIndex: 24, season: "Wet", sowing: [5, 6], growing: [7, 8, 9], harvesting: [10, 11] },
  { crop: "Longan", category: "Fruit", regionIndex: 24, season: "Perennial", sowing: [1], growing: [2, 3, 4, 5, 6], harvesting: [7, 8] },
  // Thailand - Nakhon Ratchasima
  { crop: "Rice", category: "Cereal", regionIndex: 25, season: "Wet", sowing: [5, 6], growing: [7, 8, 9, 10], harvesting: [11, 12] },
  { crop: "Cassava", category: "Tuber", regionIndex: 25, season: "Annual", sowing: [4, 5], growing: [6, 7, 8, 9, 10, 11], harvesting: [12, 1, 2] },
  { crop: "Maize", category: "Cereal", regionIndex: 25, season: "Dry", sowing: [11, 12], growing: [1, 2, 3], harvesting: [4] },
  // Thailand - Surat Thani
  { crop: "Oil Palm", category: "Oilseed", regionIndex: 26, season: "Perennial", sowing: [1, 2], growing: [3, 4, 5, 6, 7, 8, 9, 10], harvesting: [11, 12] },
  { crop: "Rubber", category: "Industrial", regionIndex: 26, season: "Perennial", sowing: [5, 6], growing: [7, 8, 9, 10, 11, 12, 1, 2], harvesting: [3, 4] },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
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
  const adminPwd = await bcrypt.hash("admin123", 12);
  const userPwd = await bcrypt.hash("user123", 12);
  await User.create([
    { email: "admin@agrisphere.com", password: adminPwd, name: "Admin User", role: "admin", tenantId: TENANT_ID },
    { email: "user@agrisphere.com", password: userPwd, name: "Demo User", role: "user", tenantId: TENANT_ID },
  ]);
  console.log("Created users");

  // Create regions
  const regionDocs = await Region.insertMany(
    regionsData.map((r) => ({
      country: r.country,
      state: r.state,
      region: r.region,
      agroEcologicalZone: r.aez,
      latitude: r.lat,
      longitude: r.lon,
      tenantId: TENANT_ID,
    }))
  );
  console.log(`Created ${regionDocs.length} regions`);

  // Create crops (unique names)
  const cropNames = [...new Set(calendarsData.map((c) => c.crop))];
  const cropDocs = await Crop.insertMany(
    cropNames.map((name) => ({
      name,
      category: calendarsData.find((c) => c.crop === name)!.category,
      tenantId: TENANT_ID,
    }))
  );
  const cropMap = Object.fromEntries(cropDocs.map((c: { name: string; _id: unknown }) => [c.name, c._id]));
  console.log(`Created ${cropDocs.length} crops`);

  // Create calendars
  const calDocs = calendarsData.map((cal) => {
    const regionDoc = regionDocs[cal.regionIndex];
    const phases = [];
    for (let m = 1; m <= 12; m++) {
      if (cal.sowing.includes(m)) phases.push({ month: m, phase: "sowing" });
      else if (cal.growing.includes(m)) phases.push({ month: m, phase: "growing" });
      else if (cal.harvesting.includes(m)) phases.push({ month: m, phase: "harvesting" });
      else phases.push({ month: m, phase: "idle" });
    }
    return {
      cropId: cropMap[cal.crop],
      regionId: regionDoc._id,
      cropName: cal.crop,
      country: regionDoc.country,
      state: regionDoc.state,
      region: regionDoc.region,
      season: cal.season,
      phases,
      sowingMonths: cal.sowing,
      growingMonths: cal.growing,
      harvestingMonths: cal.harvesting,
      tenantId: TENANT_ID,
    };
  });
  await CropCalendar.insertMany(calDocs);
  console.log(`Created ${calDocs.length} crop calendars`);

  // Create some usage events for analytics
  const sampleSearches = [
    { crop: "Rice", count: 45 },
    { crop: "Wheat", count: 38 },
    { crop: "Maize", count: 32 },
    { crop: "Soybean", count: 28 },
    { crop: "Cotton", count: 22 },
    { crop: "Sorghum", count: 15 },
    { crop: "Millet", count: 12 },
    { crop: "Cassava", count: 10 },
    { crop: "Sugarcane", count: 8 },
    { crop: "Potato", count: 7 },
  ];

  const events = [];
  for (const s of sampleSearches) {
    for (let i = 0; i < s.count; i++) {
      events.push({
        eventType: "crop_search",
        cropName: s.crop,
        country: regionsData[Math.floor(Math.random() * regionsData.length)].country,
        tenantId: TENANT_ID,
      });
    }
  }
  await UsageEvent.insertMany(events);
  console.log(`Created ${events.length} usage events`);

  console.log("\nSeed complete! Login credentials:");
  console.log("  Admin: admin@agrisphere.com / admin123");
  console.log("  User:  user@agrisphere.com / user123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
