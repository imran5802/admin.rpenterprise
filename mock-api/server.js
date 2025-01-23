const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const mockProducts = [
  {
    productID: 1,
    productEnName: "Test Product 1",
    productBnName: "টেস্ট প্রোডাক্ট ১",
    regularPrice: 99.99,
    productStatus: "Active",
    imageUrl: "assets/img/products/stock-img-01.png"
  },
  // Add more mock products as needed
];

app.get('/get_all_product.php', (req, res) => {
  res.json({
    success: true,
    products: mockProducts
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
