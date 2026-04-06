import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              AgriSphere
            </h1>
            <p className="mt-6 text-xl text-green-100 max-w-3xl mx-auto">
              Agricultural intelligence platform — explore crop calendars across countries and
              agro-ecological zones, compare crops side-by-side, and visualize seasonal patterns on
              interactive maps.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/auth/register"
                className="bg-white text-green-800 font-semibold px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">Platform Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Crop Calendar Explorer",
                  desc: "Search across 8 countries and hundreds of agro-ecological zones with powerful multi-filter search.",
                },
                {
                  title: "12-Month Timeline",
                  desc: "Color-coded visualization of sowing, growing, and harvesting phases for every crop-region combination.",
                },
                {
                  title: "Crop Comparison",
                  desc: "Overlay up to three crops side-by-side for cross-crop planning and seasonal analysis.",
                },
                {
                  title: "Interactive Map",
                  desc: "Leaflet-powered map with coordinate-based markers and popups showing regional crop coverage.",
                },
                {
                  title: "Analytics Dashboard",
                  desc: "Track most popular crops by query volume through responsive bar charts and demand signals.",
                },
                {
                  title: "Admin Ingestion",
                  desc: "Upload PDF and XLSX files — parse, normalize, validate with flagged-row reporting, and preview before commit.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">{f.title}</h3>
                  <p className="text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
