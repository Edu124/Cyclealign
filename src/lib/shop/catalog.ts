import type { PhaseKey } from '@/types/models';

/**
 * Dopamine Shop catalogue — every product from the client's
 * "CycleAlign Dopamine Shop" brief, one entry per item or variant the brief
 * lists. Brands are fictional; photos are Unsplash (free licence) and are
 * never reused. Prices are the midpoint of the brief's indicative ranges.
 */

export type ShopCategory =
  | 'accessories' | 'jewellery' | 'self-care' | 'stationery' | 'comfort'
  | 'snacks' | 'sweet-treats' | 'drinks' | 'bundles';

export type ShopMood = 'treat' | 'me-time' | 'cute' | 'productive' | 'comfort';

export interface ShopProduct {
  id: string;
  emoji: string;
  name: string;
  /** Fictional brand — no real trademarks in the dopamine shop. */
  brand: string;
  price: number;
  tag?: string;
  /** Product photo (Unsplash CDN); the emoji is the loading / failure fallback. */
  image: string;
  category: ShopCategory;
  moods: ShopMood[];
  /** The cycle phase it's suggested for first ("Picked for your phase"). */
  phase: PhaseKey;
  /** Short line for the card and details, from the brief's examples column. */
  description: string;
  food: boolean;
  /** Food only: true = vegetarian, false = contains gelatin, undefined = check the label. */
  veg?: boolean | null;
  /** Bundles only: what's in the box. */
  includes?: string[];
  /** 'limited' = fresh items the brief allows only where storage and delivery permit. */
  availability: 'in-stock' | 'limited';
}

/** Section 4 navigation order, with the brief's labels. */
export const CATEGORIES: { key: ShopCategory; label: string; emoji: string }[] = [
  { key: 'accessories', label: 'Accessories', emoji: '🎀' },
  { key: 'jewellery', label: 'Jewellery', emoji: '💍' },
  { key: 'self-care', label: 'Self-care', emoji: '🧖‍♀️' },
  { key: 'stationery', label: 'Stationery', emoji: '📓' },
  { key: 'comfort', label: 'Comfort', emoji: '🧸' },
  { key: 'snacks', label: 'Snacks', emoji: '🥨' },
  { key: 'sweet-treats', label: 'Sweet Treats', emoji: '🍫' },
  { key: 'drinks', label: 'Drinks', emoji: '☕' },
  { key: 'bundles', label: 'Bundles', emoji: '🎁' },
];

/** Section 4 "Shop by mood", in the brief's words. */
export const MOODS: { key: ShopMood; label: string }[] = [
  { key: 'treat', label: 'I need a little treat' },
  { key: 'me-time', label: 'I need some me-time' },
  { key: 'cute', label: 'I want something cute' },
  { key: 'productive', label: 'I want to feel productive' },
  { key: 'comfort', label: 'I need comfort today' },
];

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

export const SHOP_CATALOG: ShopProduct[] = [
  { id: "m14", emoji: "🎀", name: "Satin Sleep Bonnet", brand: "Gilt & Grace", price: 219, image: img("1706120475559-119ef9294109"), category: "accessories", moods: ["comfort", "me-time"], phase: "menstrual", description: "Satin-look bonnet that protects your hair while you sleep.", food: false, tag: "New", availability: "in-stock" },
  { id: "m15", emoji: "😴", name: "Silky Sleep Mask", brand: "Cloud Nine Living", price: 149, image: img("1687435703153-88f6bc0cdcff"), category: "comfort", moods: ["me-time", "comfort"], phase: "menstrual", description: "Soft, comfortable sleep mask.", food: false, availability: "in-stock" },
  { id: "m16", emoji: "🧦", name: "Cozy Sock Trio", brand: "Hearth & Haven", price: 149, image: img("1730448111621-c0524e75b0e8"), category: "comfort", moods: ["comfort", "cute"], phase: "menstrual", description: "Soft socks in a giftable set of three.", food: false, availability: "in-stock" },
  { id: "m17", emoji: "🌡️", name: "Knit Hot-Water Bottle", brand: "Hearth & Haven", price: 349, image: img("1773747608435-0fa80d11a32f"), category: "comfort", moods: ["comfort"], phase: "menstrual", description: "Reusable hot-water bottle with a soft knit cover.", food: false, tag: "Cozy Pick", availability: "in-stock" },
  { id: "m18", emoji: "🐰", name: "Mini Bunny Plush", brand: "Cloud Nine Living", price: 349, image: img("1567169866456-a0759b6bb0c8"), category: "comfort", moods: ["comfort", "cute"], phase: "menstrual", description: "A small, huggable comfort gift.", food: false, availability: "in-stock" },
  { id: "m19", emoji: "🧂", name: "Bath Salts", brand: "Bloom & Ember", price: 269, image: img("1636333885549-86304699925f"), category: "self-care", moods: ["me-time", "comfort"], phase: "menstrual", description: "Bath salts for a slow, soothing soak.", food: false, availability: "in-stock" },
  { id: "m20", emoji: "💋", name: "Nourishing Lip Balm", brand: "Aster Skin", price: 169, image: img("1768235146463-328c98e7234d"), category: "self-care", moods: ["me-time", "comfort"], phase: "menstrual", description: "Everyday lip balm to keep lips soft.", food: false, availability: "in-stock" },
  { id: "m21", emoji: "🎁", name: "Period Comfort Kit", brand: "CycleAlign Edit", price: 599, image: img("1513201099705-a9746e1e201f"), category: "bundles", moods: ["comfort"], phase: "menstrual", description: "A curated comfort set for period days.", food: false, tag: "Bundle", includes: ["Hot-water bottle", "cozy socks", "tea", "chocolate", "a comfort card"], availability: "in-stock" },
  { id: "m22", emoji: "🛁", name: "Me-Time Box", brand: "CycleAlign Edit", price: 599, image: img("1762411245614-e0f145ba7183"), category: "bundles", moods: ["me-time"], phase: "menstrual", description: "A cosy evening in, in a box.", food: false, tag: "Bundle", includes: ["Hot chocolate", "cookies", "candle", "sleep mask"], availability: "in-stock" },
  { id: "m23", emoji: "👄", name: "Overnight Lip Mask", brand: "Aster Skin", price: 169, image: img("1780400357777-b4025c8ac516"), category: "self-care", moods: ["me-time"], phase: "menstrual", description: "Rich lip mask to wear overnight.", food: false, availability: "in-stock" },
  { id: "m24", emoji: "🫧", name: "Shower Steamers", brand: "Bloom & Ember", price: 269, image: img("1690583368332-c1931e70e53e"), category: "self-care", moods: ["me-time"], phase: "menstrual", description: "Shower steamers that turn a shower into a mini spa.", food: false, availability: "in-stock" },
  { id: "m25", emoji: "🛋️", name: "Mini Cushion", brand: "Cloud Nine Living", price: 349, image: img("1629949008265-af1bcaf59786"), category: "comfort", moods: ["comfort"], phase: "menstrual", description: "Small, soft cushion for your bed or desk.", food: false, availability: "in-stock" },
  { id: "f14", emoji: "📓", name: "Everyday Gratitude Journal", brand: "Paper Petal", price: 219, image: img("1591195852468-03a01d1375d6"), category: "stationery", moods: ["me-time", "productive"], phase: "follicular", description: "Gratitude journal with gentle daily prompts.", food: false, tag: "New", availability: "in-stock" },
  { id: "f15", emoji: "🖍️", name: "Pen & Highlighter Set", brand: "Paper Petal", price: 139, image: img("1771868421764-a3de7fd9c4c1"), category: "stationery", moods: ["productive"], phase: "follicular", description: "Colourful pens and highlighters.", food: false, availability: "in-stock" },
  { id: "f16", emoji: "🌈", name: "Washi Tape Set", brand: "Paper Petal", price: 139, image: img("1777401085816-0192a4e2a7b0"), category: "stationery", moods: ["cute", "productive"], phase: "follicular", description: "Decorative washi tapes for journals and planners.", food: false, availability: "in-stock" },
  { id: "f17", emoji: "🗂️", name: "Compact Desk Organiser", brand: "Paper Petal", price: 269, image: img("1777917845221-f92884c1b61b"), category: "stationery", moods: ["productive"], phase: "follicular", description: "Compact organiser to tidy your desk.", food: false, availability: "in-stock" },
  { id: "f18", emoji: "💌", name: "Affirmation Card Deck", brand: "Paper Petal", price: 169, image: img("1779238226253-5ad05931521c"), category: "stationery", moods: ["me-time", "comfort"], phase: "follicular", description: "Positive prompts to start your day.", food: false, availability: "in-stock" },
  { id: "f19", emoji: "✅", name: "Mini Habit Planner", brand: "Paper Petal", price: 219, image: img("1632772998001-cc9bf6f7c852"), category: "stationery", moods: ["productive"], phase: "follicular", description: "Mini habit tracker planner.", food: false, availability: "in-stock" },
  { id: "f20", emoji: "👜", name: "Everyday Tote Bag", brand: "Hearth & Haven", price: 269, image: img("1544816155-12df9643f363"), category: "accessories", moods: ["productive"], phase: "follicular", description: "Roomy everyday tote for work, errands and more.", food: false, availability: "in-stock" },
  { id: "f21", emoji: "🎯", name: "Focus Mode Box", brand: "CycleAlign Edit", price: 449, image: img("1506784983877-45594efa4cbe"), category: "bundles", moods: ["productive"], phase: "follicular", description: "Everything for a focused work session.", food: false, tag: "Bundle", includes: ["Mini planner", "pens", "coffee sachets", "a snack"], availability: "in-stock" },
  { id: "f22", emoji: "📒", name: "Everyday Notebook", brand: "Paper Petal", price: 219, image: img("1554757387-fa0367573d09"), category: "stationery", moods: ["productive"], phase: "follicular", description: "Simple everyday notebook.", food: false, availability: "in-stock" },
  { id: "f23", emoji: "🖍️", name: "Colour Pencil Set", brand: "Paper Petal", price: 139, image: img("1782495385091-72b93539fccf"), category: "stationery", moods: ["productive", "treat"], phase: "follicular", description: "A colourful pencil set for doodles and notes.", food: false, availability: "in-stock" },
  { id: "f24", emoji: "💮", name: "Decorative Sticker Pack", brand: "Paper Petal", price: 139, image: img("1633533452206-8ab246b00e30"), category: "stationery", moods: ["cute", "treat"], phase: "follicular", description: "Fun decorative stickers.", food: false, availability: "in-stock" },
  { id: "f25", emoji: "🗃️", name: "Pen Holder", brand: "Paper Petal", price: 269, image: img("1767116291082-8a34a33554d9"), category: "stationery", moods: ["productive"], phase: "follicular", description: "A pen holder to keep your desk neat.", food: false, availability: "in-stock" },
  { id: "f26", emoji: "🪞", name: "Self-Reflection Prompt Cards", brand: "Paper Petal", price: 169, image: img("1779238227496-832e967d63db"), category: "stationery", moods: ["me-time"], phase: "follicular", description: "Self-reflection cards for quiet moments.", food: false, availability: "in-stock" },
  { id: "f27", emoji: "🗓️", name: "Weekly Planner", brand: "Paper Petal", price: 219, image: img("1768055105012-4c53791b2877"), category: "stationery", moods: ["productive"], phase: "follicular", description: "Weekly planner to map out your week.", food: false, availability: "in-stock" },
  { id: "f28", emoji: "👝", name: "Makeup Pouch", brand: "Hearth & Haven", price: 269, image: img("1538022890810-8f4000ca9a10"), category: "accessories", moods: ["cute", "productive"], phase: "follicular", description: "Compact pouch to keep makeup and essentials organised.", food: false, availability: "in-stock" },
  { id: "o14", emoji: "✨", name: "Neutral Claw Clip", brand: "Gilt & Grace", price: 149, image: img("1635423759716-53ccaa71b3fa"), category: "accessories", moods: ["cute"], phase: "ovulation", description: "Classic claw clip in a neutral shade — large enough for thick hair.", food: false, tag: "New", availability: "in-stock" },
  { id: "o15", emoji: "🎀", name: "Hair Bow & Tie Set", brand: "Gilt & Grace", price: 139, image: img("1776267033953-25f51bc59120"), category: "accessories", moods: ["cute"], phase: "ovulation", description: "Bows and hair ties in one easy set.", food: false, availability: "in-stock" },
  { id: "o16", emoji: "💎", name: "Minimal Stud Earrings", brand: "Gilt & Grace", price: 219, image: img("1693212793204-bcea856c75fe"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "Minimal everyday studs.", food: false, tag: "Trending", availability: "in-stock" },
  { id: "o17", emoji: "🤍", name: "Heart Pendant Necklace", brand: "Gilt & Grace", price: 349, image: img("1589128777073-263566ae5e4d"), category: "jewellery", moods: ["cute", "treat"], phase: "ovulation", description: "Minimal pendant necklace with a small heart.", food: false, availability: "in-stock" },
  { id: "o18", emoji: "💍", name: "Adjustable Ring Set", brand: "Gilt & Grace", price: 219, image: img("1543294001-f7cd5d7fb516"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "Adjustable rings in a simple set.", food: false, availability: "in-stock" },
  { id: "o19", emoji: "🐚", name: "Charm Bracelet", brand: "Gilt & Grace", price: 269, image: img("1786052337516-9fb23fcf36de"), category: "jewellery", moods: ["cute", "treat"], phase: "ovulation", description: "Charm bracelet with delicate details.", food: false, availability: "in-stock" },
  { id: "o20", emoji: "🌟", name: "Dainty Anklet", brand: "Gilt & Grace", price: 219, image: img("1744722091259-ed1cf11ac97f"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "Minimal anklet with a delicate chain.", food: false, availability: "in-stock" },
  { id: "o21", emoji: "🧸", name: "Cute Bag Charm", brand: "Gilt & Grace", price: 169, image: img("1778278553445-9cb87c89c60f"), category: "accessories", moods: ["cute", "treat"], phase: "ovulation", description: "A cute charm to clip onto your bag.", food: false, availability: "in-stock" },
  { id: "o22", emoji: "💅", name: "Press-On Nails", brand: "Aster Skin", price: 199, image: img("1754799670410-b282791342c3"), category: "self-care", moods: ["cute", "treat"], phase: "ovulation", description: "Press-on nails for an instant manicure.", food: false, availability: "in-stock" },
  { id: "o23", emoji: "🏆", name: "Little-Win Celebration Box", brand: "CycleAlign Edit", price: 499, image: img("1608755728617-aefab37d2edd"), category: "bundles", moods: ["treat", "cute"], phase: "ovulation", description: "Celebrate a small win.", food: false, tag: "Bundle", includes: ["Chocolate", "a small accessory", "an achievement card"], availability: "in-stock" },
  { id: "o24", emoji: "🌸", name: "Pastel Mini Claw Clips", brand: "Gilt & Grace", price: 149, image: img("1588489976274-368bab745eaa"), category: "accessories", moods: ["cute", "treat"], phase: "ovulation", description: "Mini claw clips in soft pastel colours.", food: false, tag: "New", availability: "in-stock" },
  { id: "o25", emoji: "🌼", name: "Decorative Hair Clips", brand: "Gilt & Grace", price: 139, image: img("1758723208958-c18fa48aaff3"), category: "accessories", moods: ["cute", "treat"], phase: "ovulation", description: "Decorative clips to dress up any hairstyle.", food: false, availability: "in-stock" },
  { id: "o26", emoji: "⭕", name: "Everyday Hoop Earrings", brand: "Gilt & Grace", price: 219, image: img("1708220040824-b273dd0a17cc"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "Easy-to-wear everyday hoops.", food: false, availability: "in-stock" },
  { id: "o27", emoji: "🌙", name: "Layered Necklace", brand: "Gilt & Grace", price: 349, image: img("1599643478518-a784e5dc4c8f"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "Layered-style necklace for a polished look.", food: false, availability: "in-stock" },
  { id: "o28", emoji: "⛓️", name: "Everyday Chain Bracelet", brand: "Gilt & Grace", price: 269, image: img("1777999802051-f6f0296e76af"), category: "jewellery", moods: ["cute"], phase: "ovulation", description: "A fine chain bracelet for every day.", food: false, availability: "in-stock" },
  { id: "o29", emoji: "🦶", name: "Decorative Anklet", brand: "Gilt & Grace", price: 219, image: img("1774978237834-237b7aa7bd6c"), category: "jewellery", moods: ["cute", "treat"], phase: "ovulation", description: "Decorative anklet for festive days.", food: false, availability: "in-stock" },
  { id: "o30", emoji: "🔑", name: "Cute Keychain", brand: "Gilt & Grace", price: 169, image: img("1762587596660-738308fe432e"), category: "accessories", moods: ["cute", "treat"], phase: "ovulation", description: "Playful keychain accessory for your keys or bag.", food: false, availability: "in-stock" },
  { id: "o31", emoji: "✨", name: "Nail Art Stickers", brand: "Aster Skin", price: 199, image: img("1607779097040-26e80aa78e66"), category: "self-care", moods: ["cute", "treat"], phase: "ovulation", description: "Nail stickers for easy nail art at home.", food: false, availability: "in-stock" },
  { id: "l14", emoji: "🎗️", name: "Satin Scrunchie Pack", brand: "Gilt & Grace", price: 149, image: img("1788079961873-e1663ddf5ec0"), category: "accessories", moods: ["cute", "comfort"], phase: "luteal", description: "Gentle satin scrunchies — single pieces and multi-packs.", food: false, tag: "New", availability: "in-stock" },
  { id: "l15", emoji: "🌸", name: "Skincare Headband", brand: "Gilt & Grace", price: 149, image: img("1782776852521-77b0aed8831d"), category: "accessories", moods: ["me-time"], phase: "luteal", description: "Soft headband that keeps hair back during your skincare routine.", food: false, availability: "in-stock" },
  { id: "l16", emoji: "🌀", name: "Heatless Curling Set", brand: "Gilt & Grace", price: 299, image: img("1516429084384-3aa965e20ff7"), category: "accessories", moods: ["me-time", "cute"], phase: "luteal", description: "Curling rod, scrunchies and accessories for overnight curls — no heat.", food: false, availability: "in-stock" },
  { id: "l17", emoji: "🧖‍♀️", name: "Sheet Mask Duo", brand: "Aster Skin", price: 149, image: img("1670201203270-7bc9b329d2eb"), category: "self-care", moods: ["me-time", "treat"], phase: "luteal", description: "Two single-use face masks for a quick pamper.", food: false, availability: "in-stock" },
  { id: "l18", emoji: "🤲", name: "Travel Hand Cream", brand: "Aster Skin", price: 169, image: img("1619451427882-6aaaded0cc61"), category: "self-care", moods: ["me-time", "productive"], phase: "luteal", description: "Small, travel-friendly hand cream.", food: false, availability: "in-stock" },
  { id: "l19", emoji: "🌷", name: "Body Mist", brand: "Aster Skin", price: 269, image: img("1784902538196-c7d914e3ecce"), category: "self-care", moods: ["me-time", "treat"], phase: "luteal", description: "A fresh body mist to lift your mood.", food: false, availability: "in-stock" },
  { id: "l20", emoji: "☕", name: "Cute Mug", brand: "Hearth & Haven", price: 319, image: img("1702281718578-2d4bd167f375"), category: "comfort", moods: ["cute", "comfort"], phase: "luteal", description: "A cute mug for your favourite warm drink.", food: false, availability: "in-stock" },
  { id: "l21", emoji: "🕯️", name: "Mini Scented Candle", brand: "Bloom & Ember", price: 269, image: img("1640095889747-2090ee12fa7d"), category: "comfort", moods: ["me-time", "comfort"], phase: "luteal", description: "Compact scented candle.", food: false, availability: "in-stock" },
  { id: "l22", emoji: "🌧️", name: "Bad-Day Rescue Box", brand: "CycleAlign Edit", price: 449, image: img("1707944145479-12755f0434d8"), category: "bundles", moods: ["comfort", "treat"], phase: "luteal", description: "A small pick-me-up for a tough day.", food: false, tag: "Bundle", includes: ["A small treat", "sheet mask", "scrunchie", "an uplifting note"], availability: "in-stock" },
  { id: "l23", emoji: "🧴", name: "Body Lotion", brand: "Aster Skin", price: 269, image: img("1763503839418-2b45c3d7a3c3"), category: "self-care", moods: ["me-time", "comfort"], phase: "luteal", description: "Light, everyday body lotion.", food: false, availability: "in-stock" },
  { id: "l24", emoji: "🥤", name: "Reusable Tumbler", brand: "Hearth & Haven", price: 319, image: img("1729192293999-ffbdc97cbac9"), category: "comfort", moods: ["productive"], phase: "luteal", description: "Reusable tumbler for drinks on the go.", food: false, availability: "in-stock" },
  { id: "fm14", emoji: "🍫", name: "Chocolate Bar Trio", brand: "Cocoa Theory", price: 99, image: img("1610450949065-1f2841536c88"), category: "sweet-treats", moods: ["treat"], phase: "menstrual", description: "Milk, dark and assorted chocolate bars.", food: true, tag: "New", veg: true, availability: "in-stock" },
  { id: "fm15", emoji: "🟤", name: "Chocolate Truffle Box", brand: "Cocoa Theory", price: 199, image: img("1757450317518-9d385619f5ee"), category: "sweet-treats", moods: ["treat"], phase: "menstrual", description: "Small box of chocolate truffles.", food: true, veg: true, availability: "in-stock" },
  { id: "fm16", emoji: "🍪", name: "Choc Chip Cookies", brand: "Cocoa Theory", price: 139, image: img("1499636136210-6f4ee915583e"), category: "sweet-treats", moods: ["treat", "comfort"], phase: "menstrual", description: "Chocolate chip cookies.", food: true, veg: null, availability: "in-stock" },
  { id: "fm17", emoji: "🧁", name: "Fudgy Brownies", brand: "Midnight Kitchen", price: 149, image: img("1636743715220-d8f8dd900b87"), category: "sweet-treats", moods: ["treat", "comfort"], phase: "menstrual", description: "Individually wrapped brownies.", food: true, veg: null, availability: "in-stock" },
  { id: "fm18", emoji: "☁️", name: "Marshmallow Pack", brand: "Candy Comet", price: 99, image: img("1518646455738-c17d10184f5e"), category: "sweet-treats", moods: ["treat", "comfort"], phase: "menstrual", description: "Small sealed pack of marshmallows.", food: true, veg: false, availability: "in-stock" },
  { id: "fm19", emoji: "☕", name: "Hot Chocolate Sachets", brand: "Steep Story", price: 99, image: img("1637572815755-c4b80092dce1"), category: "drinks", moods: ["comfort", "me-time"], phase: "menstrual", description: "Hot chocolate — single servings and multi-packs.", food: true, tag: "Cozy Pick", veg: true, availability: "in-stock" },
  { id: "fm20", emoji: "🫖", name: "Herbal Tea Selection", brand: "Steep Story", price: 199, image: img("1766232574096-4c4380105cc7"), category: "drinks", moods: ["comfort", "me-time"], phase: "menstrual", description: "Herbal infusions.", food: true, veg: true, availability: "in-stock" },
  { id: "fm21", emoji: "🍵", name: "Masala Chai Premix", brand: "Steep Story", price: 119, image: img("1761483281417-778013dc0177"), category: "drinks", moods: ["comfort"], phase: "menstrual", description: "Single-serve masala chai sachets.", food: true, veg: true, availability: "in-stock" },
  { id: "fm22", emoji: "🍫", name: "Dark Chocolate Bar", brand: "Cocoa Theory", price: 99, image: img("1772986258634-a729cd51aea4"), category: "sweet-treats", moods: ["treat"], phase: "menstrual", description: "Rich dark chocolate bar.", food: true, veg: true, availability: "in-stock" },
  { id: "fm23", emoji: "🍓", name: "Flavoured Fruit Tea", brand: "Steep Story", price: 199, image: img("1499531011814-14b20e46c785"), category: "drinks", moods: ["me-time"], phase: "menstrual", description: "Flavoured fruit tea.", food: true, veg: true, availability: "in-stock" },
  { id: "ff14", emoji: "🍵", name: "Instant Matcha Mix", brand: "Steep Story", price: 269, image: img("1589698272390-0501a07619bb"), category: "drinks", moods: ["productive"], phase: "follicular", description: "Instant matcha mix.", food: true, tag: "Trending", veg: true, availability: "in-stock" },
  { id: "ff15", emoji: "🧊", name: "Cold-Coffee Mix", brand: "Steep Story", price: 119, image: img("1771210849472-84a07b2e793a"), category: "drinks", moods: ["productive", "treat"], phase: "follicular", description: "Instant cold-coffee mix.", food: true, veg: true, availability: "in-stock" },
  { id: "ff16", emoji: "🍋", name: "Sugar-Free Drink Mix", brand: "Steep Story", price: 119, image: img("1717439062391-1c2932e1c051"), category: "drinks", moods: ["productive"], phase: "follicular", description: "Sugar-free drink mix.", food: true, veg: true, availability: "in-stock" },
  { id: "ff17", emoji: "🥜", name: "Trail Mix Pouch", brand: "Masala Moon", price: 149, image: img("1767877609689-beff32b9c0ac"), category: "snacks", moods: ["productive"], phase: "follicular", description: "Nuts, seeds and dried fruit mix.", food: true, veg: true, availability: "in-stock" },
  { id: "ff18", emoji: "🌰", name: "Roasted Cashews & Mixed Nuts", brand: "Masala Moon", price: 199, image: img("1726771517475-e7acdd34cd8a"), category: "snacks", moods: ["productive"], phase: "follicular", description: "Roasted cashews and mixed nuts.", food: true, veg: true, availability: "in-stock" },
  { id: "ff19", emoji: "🫘", name: "Roasted Chickpeas", brand: "Masala Moon", price: 89, image: img("1776765828683-eb5ec29711e2"), category: "snacks", moods: ["productive"], phase: "follicular", description: "Seasoned crunchy roasted chickpeas.", food: true, veg: true, availability: "in-stock" },
  { id: "ff20", emoji: "🍘", name: "Baked Herb Crackers", brand: "Masala Moon", price: 99, image: img("1764025262245-8fc7d2d72c15"), category: "snacks", moods: ["productive"], phase: "follicular", description: "Sealed savoury baked crackers.", food: true, veg: null, availability: "in-stock" },
  { id: "ff21", emoji: "🧇", name: "Waffle Mix", brand: "Midnight Kitchen", price: 219, image: img("1773533276932-4ee7ea1d6361"), category: "sweet-treats", moods: ["me-time", "treat"], phase: "follicular", description: "Easy-to-prepare waffle mix.", food: true, veg: null, availability: "in-stock" },
  { id: "ff22", emoji: "🌰", name: "Roasted Almonds", brand: "Masala Moon", price: 199, image: img("1608797178974-15b35a64ede9"), category: "snacks", moods: ["productive"], phase: "follicular", description: "Roasted almonds.", food: true, veg: true, availability: "in-stock" },
  { id: "ff23", emoji: "🥞", name: "Pancake Mix", brand: "Midnight Kitchen", price: 219, image: img("1757635964104-67218db55bca"), category: "sweet-treats", moods: ["me-time", "treat"], phase: "follicular", description: "Easy-to-prepare pancake mix.", food: true, veg: null, availability: "in-stock" },
  { id: "fo14", emoji: "🎁", name: "Chocolate Gift Box", brand: "Cocoa Theory", price: 399, image: img("1687795097254-f019f9d7fd17"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Assorted chocolates for gifting.", food: true, tag: "Hot Pick", veg: true, availability: "in-stock" },
  { id: "fo15", emoji: "🐻", name: "Gummy Bear Pack", brand: "Candy Comet", price: 99, image: img("1635342219731-4ae2bf39e1e9"), category: "sweet-treats", moods: ["treat", "cute"], phase: "ovulation", description: "Small sealed pack of gummies.", food: true, veg: false, availability: "in-stock" },
  { id: "fo16", emoji: "🍬", name: "Sour Candy Mix", brand: "Candy Comet", price: 59, image: img("1499195333224-3ce974eecb47"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Assorted sour flavours.", food: true, veg: null, availability: "in-stock" },
  { id: "fo17", emoji: "🍭", name: "Swirl Lollipops", brand: "Candy Comet", price: 59, image: img("1687499466474-df90c4d7a54a"), category: "sweet-treats", moods: ["treat", "cute"], phase: "ovulation", description: "Colourful swirl lollipops.", food: true, veg: null, availability: "in-stock" },
  { id: "fo18", emoji: "🍡", name: "Candy Assortment", brand: "Candy Comet", price: 169, image: img("1696524491699-6754027c14d9"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Mixed sweet treat pack.", food: true, veg: null, availability: "in-stock" },
  { id: "fo19", emoji: "🍿", name: "Flavoured Popcorn", brand: "Masala Moon", price: 89, image: img("1766728905072-ecb543cd6bf5"), category: "snacks", moods: ["treat", "me-time"], phase: "ovulation", description: "Flavoured, ready-to-eat popcorn.", food: true, veg: true, availability: "in-stock" },
  { id: "fo20", emoji: "🫙", name: "Dessert Jar", brand: "Midnight Kitchen", price: 219, image: img("1768203634412-bdcf48b83161"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Dessert jar — only with chilled delivery.", food: true, veg: null, availability: "limited" },
  { id: "fo21", emoji: "🧁", name: "Mini Muffins", brand: "Midnight Kitchen", price: 139, image: img("1767634480773-37e4b962fa1d"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Mini muffins — only where storage and delivery allow.", food: true, veg: null, availability: "limited" },
  { id: "fo22", emoji: "🫘", name: "Jelly Sweets", brand: "Candy Comet", price: 99, image: img("1673291247957-273a4a214dea"), category: "sweet-treats", moods: ["treat", "cute"], phase: "ovulation", description: "Small sealed pack of jelly sweets.", food: true, veg: false, availability: "in-stock" },
  { id: "fo23", emoji: "🍬", name: "Fruit Chews", brand: "Candy Comet", price: 59, image: img("1588756264692-d396bca41fb1"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Chewy fruit sweets.", food: true, veg: null, availability: "in-stock" },
  { id: "fo24", emoji: "🍰", name: "Mini Cakes", brand: "Midnight Kitchen", price: 139, image: img("1530648672449-81f6c723e2f1"), category: "sweet-treats", moods: ["treat"], phase: "ovulation", description: "Mini cakes — only where storage and delivery allow.", food: true, veg: null, availability: "limited" },
  { id: "fl14", emoji: "🤍", name: "Peri-Peri Makhana", brand: "Masala Moon", price: 129, image: img("1710421576768-ff985fa63b60"), category: "snacks", moods: ["treat"], phase: "luteal", description: "Roasted makhana in peri-peri flavour.", food: true, tag: "Most craved", veg: true, availability: "in-stock" },
  { id: "fl15", emoji: "🥔", name: "Masala Chips", brand: "Masala Moon", price: 59, image: img("1760997707695-f0b5527e5de9"), category: "snacks", moods: ["treat"], phase: "luteal", description: "Crunchy masala chips.", food: true, veg: true, availability: "in-stock" },
  { id: "fl16", emoji: "🥨", name: "Namkeen Mini Packs", brand: "Masala Moon", price: 59, image: img("1791989396500-127d525aa9f7"), category: "snacks", moods: ["treat"], phase: "luteal", description: "Popular Indian savoury snacks in mini packs.", food: true, veg: true, availability: "in-stock" },
  { id: "fl17", emoji: "🍫", name: "Chocolate-Coated Almonds", brand: "Cocoa Theory", price: 169, image: img("1646151067116-80a86e5eee69"), category: "sweet-treats", moods: ["treat"], phase: "luteal", description: "Almonds coated in chocolate.", food: true, veg: true, availability: "in-stock" },
  { id: "fl18", emoji: "🟫", name: "Brownie Bites", brand: "Cocoa Theory", price: 149, image: img("1762922425478-7049c54bfbec"), category: "sweet-treats", moods: ["treat", "comfort"], phase: "luteal", description: "Sealed, shelf-stable brownie bites.", food: true, tag: "Fan Fave", veg: null, availability: "in-stock" },
  { id: "fl19", emoji: "🧇", name: "Wafer & Mini Choc Packs", brand: "Cocoa Theory", price: 89, image: img("1772986234414-ada1a1cef8e4"), category: "sweet-treats", moods: ["treat"], phase: "luteal", description: "Single-serve and shareable wafer and mini chocolate packs.", food: true, veg: null, availability: "in-stock" },
  { id: "fl20", emoji: "🍪", name: "Cookie Bites Box", brand: "Midnight Kitchen", price: 139, image: img("1558961363-fa8fdf82db35"), category: "sweet-treats", moods: ["treat"], phase: "luteal", description: "Small treat box of cookie bites.", food: true, veg: null, availability: "in-stock" },
  { id: "fl21", emoji: "☕", name: "Coffee Sachets", brand: "Steep Story", price: 119, image: img("1770123366817-743776f66d6a"), category: "drinks", moods: ["productive"], phase: "luteal", description: "Instant and specialty-style coffee sachets.", food: true, veg: true, availability: "in-stock" },
  { id: "fl22", emoji: "🌶️", name: "Peri-Peri Chips", brand: "Masala Moon", price: 59, image: img("1647764430080-6000fbe7efee"), category: "snacks", moods: ["treat"], phase: "luteal", description: "Crunchy peri-peri chips.", food: true, veg: true, availability: "in-stock" },
  { id: "fl23", emoji: "🍪", name: "Assorted Cookies", brand: "Midnight Kitchen", price: 139, image: img("1582623201359-74e936ed48c4"), category: "sweet-treats", moods: ["treat"], phase: "luteal", description: "Assorted cookies to share — or not.", food: true, veg: null, availability: "in-stock" },
];
