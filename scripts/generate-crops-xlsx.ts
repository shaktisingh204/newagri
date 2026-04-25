/* eslint-disable @typescript-eslint/no-require-imports */
const XL = require("xlsx");
const fs = require("fs");
const path = require("path");

const HEADERS = [
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
] as const;

type Season = "Kharif" | "Rabi" | "Summer" | "Autumn" | "Spring";
type Water = "low" | "medium" | "high";

interface CropProfile {
  name: string;
  season: Season;
  sowing: number[];
  growing: number[];
  harvesting: number[];
  durationRange: [number, number];
  soils: string[];
  water: Water;
  tempMin: [number, number];
  tempMax: [number, number];
  rainfall: string[];
  fertilizers: string[];
  pests: string[][];
  yieldRange: [number, number, string];
  profitRange: [number, number];
  description: string;
}

const CROPS: CropProfile[] = [
  {
    name: "Wheat",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1, 2],
    harvesting: [3, 4],
    durationRange: [110, 145],
    soils: ["Loamy", "Clay loam", "Sandy loam", "Alluvial"],
    water: "medium",
    tempMin: [5, 12],
    tempMax: [22, 28],
    rainfall: ["50-100mm annually", "75-110mm during growth", "Light winter rain"],
    fertilizers: ["NPK 60:30:30", "NPK 80:40:40", "Urea + DAP + MOP", "Organic compost + NPK"],
    pests: [["Rust", "Aphids"], ["Termites", "Stem borer"], ["Karnal bunt", "Loose smut"]],
    yieldRange: [3.0, 5.5, "t/ha"],
    profitRange: [22000, 42000],
    description: "A cool-season cereal grain widely grown in winter.",
  },
  {
    name: "Rice",
    season: "Kharif",
    sowing: [5, 6],
    growing: [7, 8, 9],
    harvesting: [10, 11],
    durationRange: [120, 150],
    soils: ["Clay loam", "Alluvial", "Heavy clay"],
    water: "high",
    tempMin: [18, 25],
    tempMax: [30, 38],
    rainfall: [">100mm monthly", "150-200mm during tillering", "Heavy monsoon rains"],
    fertilizers: ["NPK 100:50:50", "NPK 120:60:60", "Urea + SSP + MOP"],
    pests: [["Blast", "Stem borer"], ["Brown plant hopper", "Sheath blight"], ["Leaf folder", "Gundhi bug"]],
    yieldRange: [4.0, 6.5, "t/ha"],
    profitRange: [30000, 55000],
    description: "Staple food crop grown in flooded paddies.",
  },
  {
    name: "Maize",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9],
    harvesting: [10, 11],
    durationRange: [90, 120],
    soils: ["Sandy loam", "Loamy", "Well-drained alluvial"],
    water: "medium",
    tempMin: [15, 21],
    tempMax: [28, 33],
    rainfall: ["60-100mm during growth", "Moderate monsoon"],
    fertilizers: ["NPK 120:60:40", "Urea + DAP", "FYM + NPK"],
    pests: [["Fall armyworm", "Stem borer"], ["Shoot fly", "Pink borer"]],
    yieldRange: [2.5, 5.0, "t/ha"],
    profitRange: [18000, 35000],
    description: "Versatile cereal used for food, feed, and industry.",
  },
  {
    name: "Cotton",
    season: "Kharif",
    sowing: [4, 5, 6],
    growing: [7, 8, 9],
    harvesting: [10, 11, 12],
    durationRange: [150, 200],
    soils: ["Black cotton soil", "Deep clay", "Loamy"],
    water: "medium",
    tempMin: [16, 22],
    tempMax: [30, 38],
    rainfall: ["50-100mm", "Moderate well-distributed"],
    fertilizers: ["NPK 80:40:40", "Urea + SSP + MOP", "Boron + NPK"],
    pests: [["Bollworm", "Whitefly"], ["Pink bollworm", "Aphids"], ["Jassids", "Thrips"]],
    yieldRange: [1.5, 3.0, "t/ha"],
    profitRange: [40000, 75000],
    description: "Major fibre crop; long-duration kharif.",
  },
  {
    name: "Sugarcane",
    season: "Spring",
    sowing: [2, 3],
    growing: [4, 5, 6, 7, 8, 9, 10, 11],
    harvesting: [12, 1, 2],
    durationRange: [300, 365],
    soils: ["Loamy", "Heavy alluvial", "Clay loam"],
    water: "high",
    tempMin: [15, 22],
    tempMax: [30, 38],
    rainfall: [">150mm monthly during growth", "Heavy irrigation needed"],
    fertilizers: ["NPK 250:115:115", "Urea + DAP + MOP", "Press mud + NPK"],
    pests: [["Top borer", "Pyrilla"], ["Early shoot borer", "Whitefly"]],
    yieldRange: [60, 95, "t/ha"],
    profitRange: [80000, 140000],
    description: "Long-duration cash crop for sugar and jaggery.",
  },
  {
    name: "Soybean",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9],
    harvesting: [10, 11],
    durationRange: [90, 110],
    soils: ["Black soil", "Loamy", "Well-drained"],
    water: "medium",
    tempMin: [18, 22],
    tempMax: [28, 32],
    rainfall: ["60-100mm during pod fill"],
    fertilizers: ["NPK 30:60:30", "DAP + MOP", "Rhizobium + NPK"],
    pests: [["Girdle beetle", "Stem fly"], ["Semilooper", "Leaf miner"]],
    yieldRange: [1.5, 2.8, "t/ha"],
    profitRange: [20000, 38000],
    description: "Important oilseed and protein source.",
  },
  {
    name: "Mustard",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1],
    harvesting: [2, 3],
    durationRange: [100, 130],
    soils: ["Loamy", "Sandy loam", "Light alluvial"],
    water: "low",
    tempMin: [8, 15],
    tempMax: [22, 28],
    rainfall: ["25-50mm during growth"],
    fertilizers: ["NPK 60:40:40", "Urea + SSP", "FYM + NPK"],
    pests: [["Aphids", "Painted bug"], ["Sawfly", "White rust"]],
    yieldRange: [1.0, 2.0, "t/ha"],
    profitRange: [18000, 32000],
    description: "Rabi oilseed grown widely in north India.",
  },
  {
    name: "Groundnut",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9],
    harvesting: [10, 11],
    durationRange: [100, 130],
    soils: ["Sandy loam", "Well-drained loamy", "Red soil"],
    water: "medium",
    tempMin: [20, 25],
    tempMax: [28, 32],
    rainfall: ["50-100mm well distributed"],
    fertilizers: ["NPK 25:50:75", "Gypsum + NPK", "Rhizobium inoculation"],
    pests: [["Leaf miner", "Aphids"], ["Tikka leaf spot", "White grub"]],
    yieldRange: [1.5, 3.0, "t/ha"],
    profitRange: [22000, 42000],
    description: "Major kharif oilseed, also grown in summer.",
  },
  {
    name: "Bajra",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8],
    harvesting: [9, 10],
    durationRange: [70, 90],
    soils: ["Sandy", "Light loamy", "Drought-prone"],
    water: "low",
    tempMin: [18, 24],
    tempMax: [32, 40],
    rainfall: ["40-60mm scattered"],
    fertilizers: ["NPK 40:20:0", "Urea + SSP", "FYM"],
    pests: [["Downy mildew", "Smut"], ["Shoot fly", "Stem borer"]],
    yieldRange: [1.2, 2.5, "t/ha"],
    profitRange: [12000, 22000],
    description: "Hardy millet grown in arid regions.",
  },
  {
    name: "Jowar",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9],
    harvesting: [10, 11],
    durationRange: [100, 120],
    soils: ["Black soil", "Red loam", "Medium-deep"],
    water: "low",
    tempMin: [16, 22],
    tempMax: [28, 35],
    rainfall: ["50-80mm well distributed"],
    fertilizers: ["NPK 80:40:40", "Urea + DAP"],
    pests: [["Shoot fly", "Stem borer"], ["Midge", "Earhead bug"]],
    yieldRange: [1.5, 3.0, "t/ha"],
    profitRange: [14000, 26000],
    description: "Drought-tolerant cereal and fodder crop.",
  },
  {
    name: "Chickpea",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1],
    harvesting: [2, 3],
    durationRange: [95, 120],
    soils: ["Loamy", "Black soil", "Sandy loam"],
    water: "low",
    tempMin: [10, 15],
    tempMax: [25, 30],
    rainfall: ["30-60mm during growth"],
    fertilizers: ["NPK 20:40:20", "Rhizobium + DAP"],
    pests: [["Pod borer", "Wilt"], ["Cutworm", "Aphids"]],
    yieldRange: [1.2, 2.2, "t/ha"],
    profitRange: [25000, 45000],
    description: "Important pulse crop of the rabi season.",
  },
  {
    name: "Pigeon Pea",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9, 10, 11],
    harvesting: [12, 1, 2],
    durationRange: [150, 200],
    soils: ["Loamy", "Well-drained", "Black soil"],
    water: "low",
    tempMin: [18, 22],
    tempMax: [30, 35],
    rainfall: ["60-100mm scattered"],
    fertilizers: ["NPK 25:50:25", "Rhizobium + DAP", "FYM"],
    pests: [["Pod borer", "Pod fly"], ["Wilt", "Sterility mosaic"]],
    yieldRange: [0.9, 1.8, "t/ha"],
    profitRange: [20000, 38000],
    description: "Long-duration pulse, drought tolerant.",
  },
  {
    name: "Onion",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1, 2],
    harvesting: [3, 4],
    durationRange: [120, 150],
    soils: ["Sandy loam", "Loamy", "Well-drained"],
    water: "medium",
    tempMin: [12, 18],
    tempMax: [25, 30],
    rainfall: ["Limited; mostly irrigated"],
    fertilizers: ["NPK 100:50:50", "FYM + NPK", "Sulphur + NPK"],
    pests: [["Thrips", "Purple blotch"], ["Stemphylium", "Onion fly"]],
    yieldRange: [20, 35, "t/ha"],
    profitRange: [60000, 130000],
    description: "Major bulb crop; staple culinary vegetable.",
  },
  {
    name: "Potato",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1],
    harvesting: [2, 3],
    durationRange: [90, 110],
    soils: ["Sandy loam", "Loamy", "Well-drained"],
    water: "medium",
    tempMin: [10, 15],
    tempMax: [20, 25],
    rainfall: ["Mostly irrigated; light rain"],
    fertilizers: ["NPK 150:80:100", "FYM + NPK", "Urea + DAP + MOP"],
    pests: [["Late blight", "Aphids"], ["Early blight", "Cutworm"]],
    yieldRange: [20, 35, "t/ha"],
    profitRange: [50000, 110000],
    description: "Tuber crop, key winter vegetable.",
  },
  {
    name: "Tomato",
    season: "Rabi",
    sowing: [9, 10],
    growing: [11, 12],
    harvesting: [1, 2, 3],
    durationRange: [100, 130],
    soils: ["Sandy loam", "Loamy", "Well-drained"],
    water: "medium",
    tempMin: [12, 18],
    tempMax: [25, 32],
    rainfall: ["Irrigated; moderate rain ok"],
    fertilizers: ["NPK 120:60:60", "FYM + NPK"],
    pests: [["Fruit borer", "Whitefly"], ["Early blight", "Leaf curl virus"]],
    yieldRange: [25, 50, "t/ha"],
    profitRange: [80000, 180000],
    description: "Widely grown vegetable; multiple seasons.",
  },
  {
    name: "Banana",
    season: "Spring",
    sowing: [2, 3],
    growing: [4, 5, 6, 7, 8, 9, 10],
    harvesting: [11, 12, 1],
    durationRange: [300, 360],
    soils: ["Loamy", "Alluvial", "Rich organic"],
    water: "high",
    tempMin: [18, 22],
    tempMax: [30, 35],
    rainfall: ["100-180mm monthly"],
    fertilizers: ["NPK 200:60:300", "FYM + NPK", "Urea + MOP"],
    pests: [["Bunchy top", "Sigatoka"], ["Stem weevil", "Nematodes"]],
    yieldRange: [40, 70, "t/ha"],
    profitRange: [150000, 280000],
    description: "Perennial fruit crop with high water demand.",
  },
  {
    name: "Mango",
    season: "Spring",
    sowing: [6, 7],
    growing: [8, 9, 10, 11, 12, 1],
    harvesting: [4, 5, 6],
    durationRange: [330, 365],
    soils: ["Loamy", "Well-drained alluvial"],
    water: "medium",
    tempMin: [15, 22],
    tempMax: [30, 38],
    rainfall: ["75-150mm well distributed"],
    fertilizers: ["NPK 500:250:500 g/tree", "FYM + NPK"],
    pests: [["Hopper", "Powdery mildew"], ["Fruit fly", "Anthracnose"]],
    yieldRange: [8, 15, "t/ha"],
    profitRange: [100000, 250000],
    description: "Premier fruit crop of India.",
  },
  {
    name: "Turmeric",
    season: "Kharif",
    sowing: [5, 6],
    growing: [7, 8, 9, 10, 11, 12],
    harvesting: [1, 2, 3],
    durationRange: [240, 300],
    soils: ["Loamy", "Sandy loam", "Well-drained"],
    water: "medium",
    tempMin: [18, 22],
    tempMax: [30, 35],
    rainfall: ["100-150mm monthly"],
    fertilizers: ["NPK 60:50:120", "FYM + NPK"],
    pests: [["Rhizome rot", "Leaf spot"], ["Shoot borer", "Scale"]],
    yieldRange: [6, 12, "t/ha"],
    profitRange: [70000, 140000],
    description: "Spice rhizome with high-value market.",
  },
  {
    name: "Chilli",
    season: "Kharif",
    sowing: [6, 7],
    growing: [8, 9],
    harvesting: [10, 11, 12],
    durationRange: [150, 200],
    soils: ["Sandy loam", "Loamy", "Black soil"],
    water: "medium",
    tempMin: [18, 22],
    tempMax: [30, 35],
    rainfall: ["60-100mm well distributed"],
    fertilizers: ["NPK 100:50:50", "FYM + NPK"],
    pests: [["Thrips", "Mites"], ["Anthracnose", "Fruit rot"]],
    yieldRange: [1.5, 3.0, "t/ha"],
    profitRange: [60000, 140000],
    description: "Important spice and vegetable crop.",
  },
  {
    name: "Barley",
    season: "Rabi",
    sowing: [10, 11],
    growing: [12, 1, 2],
    harvesting: [3, 4],
    durationRange: [110, 130],
    soils: ["Loamy", "Sandy loam", "Light alluvial"],
    water: "low",
    tempMin: [8, 12],
    tempMax: [22, 28],
    rainfall: ["40-80mm during growth"],
    fertilizers: ["NPK 60:30:20", "Urea + DAP"],
    pests: [["Aphids", "Yellow rust"], ["Loose smut", "Root rot"]],
    yieldRange: [2.5, 4.0, "t/ha"],
    profitRange: [16000, 28000],
    description: "Hardy rabi cereal also used for malting.",
  },
];

const STATE_DISTRICTS: Record<string, string[]> = {
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
  "Haryana": ["Ambala", "Bhiwani", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkarnagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Shahjahanpur", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Dahod", "Gandhinagar", "Jamnagar", "Junagadh", "Kachchh", "Kheda", "Mehsana", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Vadodara", "Valsad"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar", "Jogulamba", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tamil Nadu": ["Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Odisha": ["Angul", "Balasore", "Bargarh", "Bhadrak", "Bolangir", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Khurda", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundargarh"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
};

// ── Helpers ──
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const rand = makeRng(42);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function intBetween(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function jitterMonths(months: number[]): number[] {
  const out = new Set<number>();
  for (const m of months) {
    if (rand() < 0.85) out.add(m);
  }
  if (out.size === 0) out.add(months[0]);
  if (rand() < 0.25) {
    const neighbour = months[months.length - 1] + (rand() < 0.5 ? -1 : 1);
    if (neighbour >= 1 && neighbour <= 12) out.add(neighbour);
  }
  return Array.from(out).sort((a, b) => a - b);
}

function fmtMonths(months: number[]): string {
  return months.join(",");
}

function fmtYield(profile: CropProfile): string {
  const [lo, hi, unit] = profile.yieldRange;
  const v = lo + rand() * (hi - lo);
  const decimals = unit === "t/ha" && hi < 10 ? 1 : 0;
  return `${v.toFixed(decimals)} ${unit}`;
}

function fmtProfit(profile: CropProfile): string {
  const [lo, hi] = profile.profitRange;
  const v = Math.round((lo + rand() * (hi - lo)) / 500) * 500;
  return `Rs ${v.toLocaleString("en-IN")}/acre`;
}

const STATES = Object.keys(STATE_DISTRICTS);

const TARGET_ROWS = 5000;
const rows: Record<string, string | number>[] = [];

while (rows.length < TARGET_ROWS) {
  const state = pick(STATES);
  const district = pick(STATE_DISTRICTS[state]);
  const profile = pick(CROPS);

  const sowing = jitterMonths(profile.sowing);
  const harvesting = jitterMonths(profile.harvesting);
  const growing = jitterMonths(profile.growing);

  const tMin = intBetween(profile.tempMin[0], profile.tempMin[1]);
  const tMax = intBetween(profile.tempMax[0], profile.tempMax[1]);

  const pests = pick(profile.pests).join(",");

  rows.push({
    Country: "India",
    State: state,
    Region: district,
    Crop: profile.name,
    Season: profile.season,
    "Sowing Months": fmtMonths(sowing),
    "Growing Months": fmtMonths(growing),
    "Harvesting Months": fmtMonths(harvesting),
    "Duration Days": intBetween(profile.durationRange[0], profile.durationRange[1]),
    "Soil Type": pick(profile.soils),
    "Water Requirement": profile.water,
    "Temperature Min": tMin,
    "Temperature Max": tMax,
    Rainfall: pick(profile.rainfall),
    Fertilizer: pick(profile.fertilizers),
    Pests: pests,
    Yield: fmtYield(profile),
    Profit: fmtProfit(profile),
    Image: "",
    Description: profile.description,
  });
}

const worksheet = XL.utils.json_to_sheet(rows, { header: HEADERS as unknown as string[] });
const workbook = XL.utils.book_new();
XL.utils.book_append_sheet(workbook, worksheet, "CropCalendar");

const outDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "crops-5000.xlsx");

XL.writeFile(workbook, outPath);
console.log(`Wrote ${rows.length} rows -> ${outPath}`);
