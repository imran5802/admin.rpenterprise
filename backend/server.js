const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3006;
const cors = require('cors');
const multer = require('multer');
const path = require('path');

app.use(cors());
// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rpbazaar_main'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Change path to point to root public directory
    cb(null, '../public/assets/img/product');
  },
  filename: (req, file, cb) => {
    // Use the provided filename from the client
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Add middleware to serve static files
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Define a route to fetch all product
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM product_list', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, products: results });
  });
});

// Individual Product
app.get('/api/product_details/:id', (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM product_list WHERE productID = ?', [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, product: results[0] });
  });
});

// Update Product with Image
app.put('/api/update_product/:id', upload.single('file'), (req, res) => {
  const productId = req.params.id;
  const productData = req.body;

  // Convert numeric fields
  productData.regularPrice = parseFloat(productData.regularPrice);
  productData.discountPrice = parseFloat(productData.discountPrice);

  if (req.file) {
    // Update imageUrl to use the correct path
    const imageUrl = `/assets/img/product/${req.file.filename}`;
    productData.imageUrl = imageUrl;
  }

  // Remove any undefined or invalid fields
  Object.keys(productData).forEach(key => {
    if (productData[key] === undefined || productData[key] === 'undefined' || productData[key] === '') {
      delete productData[key];
    }
  });

  db.query('UPDATE product_list SET ? WHERE productID = ?', [productData, productId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    } 
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      imageUrl: productData.imageUrl,
      updatedData: productData
    });
  });
});

// Create new product endpoint
app.post('/api/products', upload.single('file'), (req, res) => {
  const productData = req.body;
  let imageUrl = null;

  // If there's an uploaded file, set the imageUrl
  if (req.file) {
    imageUrl = `/assets/img/product/${req.file.filename}`;
  }

  // Prepare the data for insertion
  const dataToInsert = {
    productEnName: productData.productEnName,
    productBnName: productData.productBnName,
    productUnit: productData.productUnit,
    regularPrice: parseFloat(productData.regularPrice),
    discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
    searchTag: productData.searchTag,
    productStatus: productData.productStatus || 'Active',
    productCategory: productData.productCategory,
    imageUrl: imageUrl
  };

  // Remove any undefined values
  Object.keys(dataToInsert).forEach(key => {
    if (dataToInsert[key] === undefined) {
      delete dataToInsert[key];
    }
  });

  db.query('INSERT INTO product_list SET ?', dataToInsert, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Product created successfully',
      productId: results.insertId,
      product: {
        ...dataToInsert,
        productID: results.insertId
      }
    });
  });
});

// Update Product Status endpoint
app.patch('/api/products/:id/status', (req, res) => {
  const productId = req.params.id;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status value. Must be either "Active" or "Inactive"' 
    });
  }

  db.query(
    'UPDATE product_list SET productStatus = ? WHERE productID = ?',
    [status, productId],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Product status updated successfully',
        status: status
      });
    }
  );
});

// Categories API endpoints
app.get('/api/categories', (req, res) => {
  db.query('SELECT * FROM categories WHERE catStatus = "Active"', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, categories: results });
  });
});

app.post('/api/categories', (req, res) => {
  const { catName, catStatus = 'Active' } = req.body;
  
  if (!catName) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  db.query(
    'INSERT INTO categories (catName, catStatus) VALUES (?, ?)',
    [catName, catStatus],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ 
        success: true, 
        message: 'Category added successfully',
        category: { id: results.insertId, catName, catStatus }
      });
    }
  );
});

// Units API endpoints
app.get('/api/units', (req, res) => {
  db.query('SELECT * FROM units WHERE unitStatus = "Active"', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, units: results });
  });
});

app.post('/api/units', (req, res) => {
  const { unitName, unitStatus = 'Active' } = req.body;
  
  if (!unitName) {
    return res.status(400).json({ success: false, error: 'Unit name is required' });
  }

  db.query(
    'INSERT INTO units (unitName, unitStatus) VALUES (?, ?)',
    [unitName, unitStatus],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ 
        success: true, 
        message: 'Unit added successfully',
        unit: { id: results.insertId, unitName, unitStatus }
      });
    }
  );
});

// Define a route to fetch all sales with user info
app.get('/api/sales', (req, res) => {
  const query = `
    SELECT o.orderID, o.orderNumber, o.orderDate, o.totalAmount, 
           o.orderStatus, o.customerID, o.shippingAddress, o.plusCode,
           o.latitude, o.longitude, o.paymentMethod, o.paymentStatus,
           o.createdAt, u.userName as customerName, u.userEmail as customerEmail,
           u.userPhone as customerPhone, u.userAddress as customerAddress
    FROM orders o
    LEFT JOIN users u ON o.customerID = u.userID
    ORDER BY o.orderDate DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message,
        details: 'Error fetching sales data'
      });
    }
    
    res.json({ 
      success: true, 
      sales: results 
    });
  });
});

// Add endpoint to update order status
app.patch('/api/sales/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status || !['Pending', 'Processing', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status value' 
    });
  }

  db.query(
    'UPDATE orders SET orderStatus = ? WHERE orderID = ?',
    [status, orderId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({ success: true, message: 'Order status updated successfully' });
    }
  );
});

// Add payment endpoint
app.post('/api/sales/:id/payment', (req, res) => {
  const orderId = req.params.id;
  const { amount, paymentMethod, note } = req.body;

  // Start a transaction
  db.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    // First insert the payment record
    const paymentQuery = `
      INSERT INTO payment_history (orderID, amount, paymentMethod, paymentDate, note)
      VALUES (?, ?, ?, NOW(), ?)
    `;

    db.query(paymentQuery, [orderId, amount, paymentMethod, note], (err, paymentResult) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ success: false, error: err.message });
        });
      }

      // Then get the current total paid amount for this order
      const totalPaidQuery = `
        SELECT SUM(amount) as totalPaid
        FROM payment_history
        WHERE orderID = ?
      `;

      db.query(totalPaidQuery, [orderId], (err, totalPaidResult) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ success: false, error: err.message });
          });
        }

        // Get order total amount
        const orderQuery = `
          SELECT totalAmount FROM orders WHERE orderID = ?
        `;

        db.query(orderQuery, [orderId], (err, orderResult) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ success: false, error: err.message });
            });
          }

          const totalPaid = totalPaidResult[0].totalPaid;
          const orderTotal = orderResult[0].totalAmount;
          
          // Determine payment status
          let paymentStatus = 'Unpaid';
          if (totalPaid >= orderTotal) {
            paymentStatus = 'Paid';
          } else if (totalPaid > 0) {
            paymentStatus = 'Partial';
          }

          // Update order payment status
          const updateQuery = `
            UPDATE orders 
            SET paymentStatus = ?
            WHERE orderID = ?
          `;

          db.query(updateQuery, [paymentStatus, orderId], (err, updateResult) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, error: err.message });
              });
            }

            // Commit the transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ success: false, error: err.message });
                });
              }

              res.json({
                success: true,
                message: 'Payment recorded successfully',
                paymentId: paymentResult.insertId,
                paymentStatus: paymentStatus,
                totalPaid: totalPaid
              });
            });
          });
        });
      });
    });
  });
});

// Get payment history for an order
app.get('/api/sales/:id/payments', (req, res) => {
  const orderId = req.params.id;

  const query = `
    SELECT 
      ph.paymentID,
      ph.amount,
      ph.paymentMethod,
      ph.paymentDate,
      ph.note,
      ph.referenceNumber,
      ph.createdAt
    FROM payment_history ph
    WHERE ph.orderID = ?
    ORDER BY ph.paymentDate DESC
  `;

  db.query(query, [orderId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({ 
      success: true, 
      payments: results 
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});