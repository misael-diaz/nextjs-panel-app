export interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  badge?: string;
  isNew?: boolean;
  isSale?: boolean;
  category: string;
  stock: number;
  sku: string;
  description: string;
  sizes: string[];
  colors: string[];
  lastUpdated: string;
}

export const products: Product[] = [
  {
    id: "stevie-knee-high-suede",
    name: "New Stevie Knee-high Boots in Suede",
    price: "$348.00",
    image: "/stevie-knee-high-suede.jpg",
    badge: "New",
    isNew: true,
    category: "Boots",
    stock: 45,
    sku: "STV-KH-SUE-001",
    description: "Elegant knee-high boots in premium suede with a classic silhouette",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Brown", "Black", "Tan"],
    lastUpdated: "2024-09-10"
  },
  {
    id: "stevie-ankle-leopard",
    name: "New Stevie Ankle Boots in Leopard-print Calf Hair",
    price: "$199.50",
    originalPrice: "$268.00",
    image: "/stevie-ankle-leopard.jpg",
    badge: "Sale",
    isSale: true,
    category: "Boots",
    stock: 23,
    sku: "STV-AB-LEO-002",
    description: "Bold ankle boots featuring exotic leopard-print calf hair",
    sizes: ["6", "7", "8", "9", "10"],
    colors: ["Leopard Print"],
    lastUpdated: "2024-09-09"
  },
  {
    id: "stevie-ankle-stretch",
    name: "New Stevie Ankle Boots in Stretch Leather",
    price: "$224.50",
    originalPrice: "$298.00",
    image: "/stevie-ankle-stretch.jpg",
    badge: "Sale",
    isSale: true,
    category: "Boots",
    stock: 67,
    sku: "STV-AB-STR-003",
    description: "Comfortable ankle boots in flexible stretch leather",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Black", "Brown", "Navy"],
    lastUpdated: "2024-09-11"
  },
  {
    id: "classic-heel-black",
    name: "Classic Pointed Toe Heels in Black Leather",
    price: "$198.00",
    image: "/classic-heel-black.jpg",
    category: "Heels",
    stock: 89,
    sku: "CLS-HE-BLK-004",
    description: "Timeless pointed toe heels in premium black leather",
    sizes: ["5", "6", "7", "8", "9", "10"],
    colors: ["Black", "Nude", "Red"],
    lastUpdated: "2024-09-08"
  },
  {
    id: "block-heel-nude",
    name: "Comfort Block Heels in Nude Suede",
    price: "$168.00",
    image: "/block-heel-nude-new.jpg",
    category: "Heels",
    stock: 34,
    sku: "BLK-HE-NUD-005",
    description: "Comfortable block heels in soft nude suede",
    sizes: ["6", "7", "8", "9", "10"],
    colors: ["Nude", "Black", "Beige"],
    lastUpdated: "2024-09-07"
  },
  {
    id: "ballet-flat-black",
    name: "Classic Ballet Flats in Black Leather",
    price: "$98.00",
    image: "/ballet-flat-black-fixed.jpg",
    category: "Flats",
    stock: 156,
    sku: "BLT-FL-BLK-006",
    description: "Versatile ballet flats in supple black leather",
    sizes: ["5", "6", "7", "8", "9", "10", "11"],
    colors: ["Black", "Navy", "Red", "Brown"],
    lastUpdated: "2024-09-11"
  },
  {
    id: "canvas-sneaker-white",
    name: "Classic Canvas Sneakers in White",
    price: "$78.00",
    image: "/canvas-sneaker-white-new.jpg",
    category: "Sneakers",
    stock: 234,
    sku: "CNV-SN-WHT-007",
    description: "Clean and comfortable canvas sneakers in white",
    sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
    colors: ["White", "Black", "Navy", "Pink"],
    lastUpdated: "2024-09-10"
  },
  {
    id: "leather-sandal-brown",
    name: "Leather Strappy Sandals in Brown",
    price: "$128.00",
    image: "/leather-sandal-brown.jpg",
    category: "Sandals",
    stock: 78,
    sku: "LTH-SD-BRN-008",
    description: "Elegant strappy sandals in rich brown leather",
    sizes: ["6", "7", "8", "9", "10"],
    colors: ["Brown", "Black", "Tan"],
    lastUpdated: "2024-09-09"
  }
];

export const getProductsByCategory = (category: string) => {
  return products.filter(product => product.category === category);
};

export const getLowStockProducts = (threshold: number = 50) => {
  return products.filter(product => product.stock <= threshold);
};

export const getTotalInventoryValue = () => {
  return products.reduce((total, product) => {
    const price = parseFloat(product.price.replace('$', ''));
    return total + (price * product.stock);
  }, 0);
};

export const getTotalStockCount = () => {
  return products.reduce((total, product) => total + product.stock, 0);
};
