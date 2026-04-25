/* eslint-disable @typescript-eslint/no-require-imports */
const XL = require("xlsx");
const path = require("path");

const wb = XL.readFile(path.join(__dirname, "..", "data", "crops-5000.xlsx"));
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XL.utils.sheet_to_json(sheet) as Record<string, unknown>[];

console.log("Total rows:", rows.length);
console.log("Columns:", Object.keys(rows[0]));
console.log("\nFirst 3 rows:");
for (const r of rows.slice(0, 3)) console.log(JSON.stringify(r));
console.log("\nLast row:");
console.log(JSON.stringify(rows[rows.length - 1]));

const states = new Set<string>();
const crops = new Set<string>();
const districts = new Set<string>();
for (const r of rows) {
  states.add(String(r.State));
  crops.add(String(r.Crop));
  districts.add(String(r.State) + "/" + String(r.Region));
}
console.log("\nUnique states:", states.size);
console.log("Unique crops:", crops.size);
console.log("Unique state/district combos:", districts.size);
