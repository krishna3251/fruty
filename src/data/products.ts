export type Category = "All fruit" | "Tropical" | "Berries" | "Citrus";
export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: Category;
  price: number;
  weight: string;
  image: string;
  color: string;
  label: string;
  available: boolean;
  origin: string;
  description: string;
  storage: string;
}
export const products: Product[] = [
  {
    id: "mango",
    name: "Alphonso Mangoes",
    subtitle: "A little sunshine in every bite.",
    category: "Tropical",
    price: 649,
    weight: "1 kg · 4–5 pieces",
    image: "mango",
    color: "#ecddb0",
    label: "SEASONAL FAVORITE",
    available: true,
    origin: "Ratnagiri, Maharashtra",
    description:
      "Golden, fragrant, and wonderfully creamy. Our sample Alphonso selection celebrates the king of fruits at its sweetest.",
    storage:
      "Ripen at room temperature. Refrigerate once soft and enjoy within 2–3 days.",
  },
  {
    id: "strawberry",
    name: "Sweet Strawberries",
    subtitle: "Small berries. Big joy.",
    category: "Berries",
    price: 249,
    weight: "250 g · 1 punnet",
    image: "strawberry",
    color: "#ead7dc",
    label: "BERRY SPECIAL",
    available: true,
    origin: "Mahabaleshwar, Maharashtra",
    description:
      "Bright ruby berries with a fresh, sweet-tart bite. Beautiful on breakfast bowls, even better straight from the punnet.",
    storage:
      "Keep refrigerated. Wash just before eating; best enjoyed within 2 days.",
  },
  {
    id: "blueberry",
    name: "Blueberry Bliss",
    subtitle: "Your daily handful of happy.",
    category: "Berries",
    price: 399,
    weight: "125 g · 1 punnet",
    image: "blueberry",
    color: "#d7e2eb",
    label: "BESTSELLER",
    available: true,
    origin: "Imported · sample selection",
    description:
      "Plump little blueberries with a delicate bloom and a satisfying pop. Made for slow mornings and spontaneous snacking.",
    storage:
      "Refrigerate unwashed. Rinse before eating and enjoy within 4 days.",
  },
  {
    id: "orange",
    name: "Sunshine Oranges",
    subtitle: "Freshly squeezed happiness.",
    category: "Citrus",
    price: 189,
    weight: "1 kg · 5–6 pieces",
    image: "orange",
    color: "#eddcc9",
    label: "EVERYDAY GOODNESS",
    available: true,
    origin: "Nagpur, Maharashtra",
    description:
      "Juicy, cheerful citrus with a beautifully balanced sweetness. A bright addition to your table or your morning glass.",
    storage: "Store in a cool spot, or refrigerate for up to one week.",
  },
  {
    id: "lemon",
    name: "Zesty Lemons",
    subtitle: "A bright little finishing touch.",
    category: "Citrus",
    price: 89,
    weight: "250 g · 4–5 pieces",
    image: "lemon",
    color: "#e9e6c6",
    label: "KITCHEN ESSENTIAL",
    available: true,
    origin: "Andhra Pradesh",
    description:
      "A lively squeeze for dressings, drinks, and everyday cooking. Thin-skinned, aromatic lemons with plenty of personality.",
    storage: "Refrigerate in a breathable bag and wash before use.",
  },
  {
    id: "avocado",
    name: "Creamy Avocados",
    subtitle: "Good things take time to ripen.",
    category: "Tropical",
    price: 349,
    weight: "2 pieces · approx. 400 g",
    image: "avocado",
    color: "#dce3d1",
    label: "BACK SOON",
    available: false,
    origin: "Karnataka",
    description:
      "Buttery avocados for toast, salads, and all your good-food rituals. This sample item is currently unavailable.",
    storage:
      "Ripen on the counter. Once ripe, refrigerate and enjoy within 2 days.",
  },
];
export const categories: Category[] = [
  "All fruit",
  "Tropical",
  "Berries",
  "Citrus",
];
export const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
export const asset = (name: string) => `/images/${name}.webp`;
