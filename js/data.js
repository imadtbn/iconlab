/* ICONLAB - Default Data */
const DEFAULT_PRODUCTS = [
  {
    id: "rm-home",
    name: "Real Madrid Home 25/26",
    team: "Real Madrid",
    price: 4500,
    oldPrice: 5500,
    stock: 25,
    customizable: true,
    badge: "Best Seller",
    colors: [
      { name: "White", hex: "#f2f2f0" },
      { name: "Black", hex: "#15151a" },
      { name: "Gold Edition", hex: "#d4af37" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "قميص الريال الأساسي بنسخة اللاعبين. خامة أصلية متنفسة، طباعة حرارية عالية الجودة. قم بكتابة اسمك ورقمك المفضل مباشرة على القميص قبل الطلب.",
    pattern: "stripes",
  },
  {
    id: "dz-home",
    name: "Algeria Home 2026",
    team: "Les Fennecs",
    price: 4200,
    oldPrice: null,
    stock: 40,
    customizable: true,
    badge: "New",
    colors: [
      { name: "White", hex: "#f2f2f0" },
      { name: "Green", hex: "#0a6640" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "قميص الخضر الرسمي. اعتز بلونك واكتب اسمك فوق الرقم واحتفل بالفريق الوطني. خامة Dri-Fit أصلية.",
    pattern: "plain",
  },
  {
    id: "psg-away",
    name: "PSG Away 25/26",
    team: "Paris Saint-Germain",
    price: 4800,
    oldPrice: null,
    stock: 18,
    customizable: true,
    badge: null,
    colors: [
      { name: "Navy", hex: "#1b2a4a" },
      { name: "Red", hex: "#b01e28" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "قميص باريس سان جيرمان الخارجي. تصميم فرنسي أنيق بقصّة ضيقة، قابل للتخصيص بالكامل مع اسمك ورقمك.",
    pattern: "plain",
  },
  {
    id: "barca-home",
    name: "Barcelona Home 25/26",
    team: "FC Barcelona",
    price: 4600,
    oldPrice: 5200,
    stock: 0,
    customizable: true,
    badge: "Sold Out",
    colors: [
      { name: "Blue/Red", hex: "#a50044" },
      { name: "Classic", hex: "#004d98" },
    ],
    sizes: ["M", "L", "XL"],
    description:
      "قميص البارسا بخطوط البلوغرانا الشهيرة. نسخة الجماهير مع إمكانية التخصيص الكامل.",
    pattern: "blaugrana",
  },
  {
    id: "mc-third",
    name: "Man City Third 25/26",
    team: "Manchester City",
    price: 4400,
    oldPrice: null,
    stock: 22,
    customizable: true,
    badge: null,
    colors: [
      { name: "Sky", hex: "#6cabdd" },
      { name: "Black", hex: "#15151a" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "قميص السيتي الثالث. سماوي أنيق بتفاصيل ذهبية، مثالي للتخصيص باسمك المفضل.",
    pattern: "plain",
  },
  {
    id: "retro-90",
    name: "Retro Classics 90s",
    team: "IconLab Retro",
    price: 3900,
    oldPrice: null,
    stock: 30,
    customizable: false,
    badge: "Limited",
    colors: [
      { name: "Red", hex: "#b01e28" },
      { name: "White", hex: "#f2f2f0" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "إصدار ريترو كلاسيكي مستوحى من تسعينات القرن الماضي. قطعة جاهزة بتصميم مخملي كلاسيكي بدون تخصيص.",
    pattern: "retro",
  },
];

const FONTS = [
  { id: "bebas", name: "Bebas Neue", css: "'Bebas Neue',sans-serif" },
  { id: "anton", name: "Anton", css: "'Anton',sans-serif" },
  { id: "teko", name: "Teko", css: "'Teko',sans-serif" },
  { id: "oswald", name: "Oswald", css: "'Oswald',sans-serif" },
];
const TEXT_COLORS = [
  { name: "Gold", hex: "#d4af37" },
  { name: "White", hex: "#f2f2f0" },
  { name: "Black", hex: "#15151a" },
  { name: "Red", hex: "#e3222a" },
  { name: "Navy", hex: "#1b2a4a" },
];
const DESIGN_ASSETS = [
  {
    id: "real-madrid-crest",
    name: "Real Madrid Crest",
    type: "club",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Real_Madrid_CF_(ancien_logo).svg"
  },
  {
    id: "psg-crest",
    name: "Paris Saint-Germain Crest",
    type: "club",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paris_Saint-Germain_F.C._logo_(free_version).svg"
  },
  {
    id: "nike-logo",
    name: "Nike",
    type: "brand",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_NIKE.svg"
  },
  {
    id: "emirates-logo",
    name: "Emirates",
    type: "sponsor",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Emirates_Logo.svg"
  },
  {
    id: "spotify-logo",
    name: "Spotify",
    type: "sponsor",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Spotify_2024_logo.svg"
  },
  {
    id: "ucl-logo",
    name: "UEFA Champions League",
    type: "patch",
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/UEFA_Champions_League_logo_no_text.svg"
  }
];

const PATCHES = [
  { id: "none", name: "No Patch" },
  { id: "ucl", name: "UEFA Champions League", assetId: "ucl-logo" },
  { id: "league", name: "League Badge" },
  { id: "star", name: "Star Ball" },
  { id: "wc", name: "World Cup Badge" },
];

const CHEST_LOGOS = [
  { id: "default", name: "Default Team Crest" },
  { id: "real_madrid", name: "Real Madrid Crest", assetId: "real-madrid-crest" },
  { id: "psg", name: "Paris Saint-Germain Crest", assetId: "psg-crest" },
  { id: "iconlab_star", name: "IconLab Star Crest" },
  { id: "none", name: "Empty (No Logo)" },
];

const BRANDS = [
  { id: "iconlab", name: "IconLab" },
  { id: "nike", name: "Nike", assetId: "nike-logo" },
  { id: "none", name: "No Brand" },
];

const SPONSORS = [
  { id: "default", name: "Default Team Sponsor" },
  { id: "iconlab", name: "ICONLAB Streetwear" },
  { id: "fly_emirates", name: "Emirates", assetId: "emirates-logo" },
  { id: "spotify", name: "Spotify", assetId: "spotify-logo" },
  { id: "none", name: "Empty (No Sponsor)" },
];

function getDesignAsset(id) {
  return DESIGN_ASSETS.find((asset) => asset.id === id) || null;
}

function getDefaultCrestForProduct(product) {
  if (product?.team === "Real Madrid") return "real_madrid";
  if (product?.team === "Paris Saint-Germain") return "psg";
  return "default";
}
/* ---------- DELIVERY SETTINGS ----------
   Developer-controlled fixed prices.
   Edit only this array to change companies or shipping fees. */
const DELIVERY_COMPANIES = [
  { id: "yalidine", name: "Yalidine", price: 600, active: true },
  { id: "zr-express", name: "ZR Express", price: 650, active: true },
  { id: "maystro", name: "Maystro Delivery", price: 600, active: true },
];

function getDeliveryCompanies() {
  return DELIVERY_COMPANIES.filter((company) => company.active);
}

function getDeliveryCompany(id) {
  return getDeliveryCompanies().find((company) => company.id === id) || null;
}