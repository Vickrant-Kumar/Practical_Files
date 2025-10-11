// Import mongoose
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/ecommerceDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.log("❌ Connection error:", err));

// Define the Variant Schema (Nested Document)
const variantSchema = new mongoose.Schema({
  color: String,
  size: String,
  stock: Number
});

// Define the Product Schema (Parent Document)
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  variants: [variantSchema]  // <-- Nested Array of Subdocuments
});

// Create the Product Model
const Product = mongoose.model("Product", productSchema);

// Function to insert sample data
async function insertSampleData() {
  await Product.deleteMany(); // clear old data

  const products = [
    {
      name: "T-Shirt",
      price: 499,
      category: "Clothing",
      variants: [
        { color: "Red", size: "M", stock: 20 },
        { color: "Blue", size: "L", stock: 15 }
      ]
    },
    {
      name: "Laptop",
      price: 55000,
      category: "Electronics",
      variants: [
        { color: "Silver", size: "15-inch", stock: 10 },
        { color: "Black", size: "14-inch", stock: 5 }
      ]
    },
    {
      name: "Shoes",
      price: 2999,
      category: "Footwear",
      variants: [
        { color: "White", size: "8", stock: 12 },
        { color: "Black", size: "9", stock: 7 }
      ]
    }
  ];

  await Product.insertMany(products);
  console.log("✅ Sample products inserted successfully!");
}

// Function to run queries
async function runQueries() {
  console.log("\n--- All Products ---");
  const allProducts = await Product.find();
  console.log(allProducts);

  console.log("\n--- Filter Products by Category: 'Electronics' ---");
  const electronics = await Product.find({ category: "Electronics" });
  console.log(electronics);

  console.log("\n--- Project Specific Variant Details (Name + Variants Only) ---");
  const variantsOnly = await Product.find({}, { name: 1, variants: 1, _id: 0 });
  console.log(variantsOnly);
}

// Run the functions
(async () => {
  await insertSampleData();
  await runQueries();
  mongoose.connection.close();
})();
