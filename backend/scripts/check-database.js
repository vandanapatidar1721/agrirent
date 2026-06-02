const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkDatabase() {
  try {
    console.log(' Checking database connection...');
    console.log('MongoDB URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to MongoDB');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('Database name:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(' Collections found:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check products collection
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments();
    console.log(` Products count: ${productCount}`);
    
    if (productCount > 0) {
      const products = await Product.find().limit(3);
      console.log('Sample products:');
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ₹${product.price}`);
      });
    }
    
    // Check users collection
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    console.log(` Users count: ${userCount}`);
    
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
}

checkDatabase();
