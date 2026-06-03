const Product = require("../models/Product");

const DEMO_PRODUCTS = [
  {
    name: "Tractor",
    price: 500,
    description: "50 HP tractor for ploughing and hauling",
    image: "tractor.jpg",
    location: "Delhi",
    hasDriver: true,
    driverPrice: 200,
  },
  {
    name: "Drone",
    price: 1000,
    description: "Crop spraying and field survey drone",
    image: "Drone.jpg",
    location: "Mumbai",
    hasDriver: false,
    driverPrice: 0,
  },
  {
    name: "Harvester",
    price: 2000,
    description: "Combine harvester for wheat and rice",
    image: "Harvester.jpg",
    location: "Punjab",
    hasDriver: true,
    driverPrice: 400,
  },
  {
    name: "Rotavator",
    price: 300,
    description: "Soil preparation rotavator",
    image: "Rotavator.jpg",
    location: "Delhi",
    hasDriver: false,
    driverPrice: 0,
  },
  {
    name: "Seeder",
    price: 400,
    description: "Seed drill for uniform sowing",
    image: "seeder.jpg",
    location: "Mumbai",
    hasDriver: false,
    driverPrice: 0,
  },
  {
    name: "Plough",
    price: 350,
    description: "Heavy-duty mouldboard plough",
    image: "plough.jpg",
    location: "Haryana",
    hasDriver: false,
    driverPrice: 0,
  },
  {
    name: "Sprayer",
    price: 250,
    description: "Pesticide sprayer for field crops",
    image: "sparayer.jpg",
    location: "Mumbai",
    hasDriver: false,
    driverPrice: 0,
  },
  {
    name: "Power Tiller",
    price: 800,
    description: "Compact tiller for small farms",
    image: "tiller.jpg",
    location: "Delhi",
    hasDriver: true,
    driverPrice: 150,
  },
];

async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();
  if (count > 0) {
    return count;
  }
  await Product.insertMany(DEMO_PRODUCTS);
  console.log(`Seeded ${DEMO_PRODUCTS.length} demo products`);
  return DEMO_PRODUCTS.length;
}

module.exports = seedProductsIfEmpty;
