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
const PATCHES = [
  { id: "none", name: "No Patch" },
  { id: "ucl", name: "Champions League" },
  { id: "league", name: "League Badge" },
  { id: "star", name: "Star Ball" },
  { id: "wc", name: "World Cup Badge" },
];
const CHEST_LOGOS = [
  { id: "default", name: "Default Team Crest" },
  { id: "qt_dragon", name: "QT Dragon Emblem" },
  { id: "iconlab_star", name: "IconLab Star Crest" },
  { id: "none", name: "Empty (No Logo)" },
];
const SPONSORS = [
  { id: "default", name: "Default Team Sponsor" },
  { id: "iconlab", name: "ICONLAB Streetwear" },
  { id: "fly_emirates", name: "Emirates / Fly Better" },
  { id: "spotify", name: "Spotify" },
  { id: "none", name: "Empty (No Sponsor)" },
];
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