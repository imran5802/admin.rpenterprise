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

// Restore original products endpoint
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

// Restore original sales endpoint
app.get('/api/sales', (req, res) => {
  const query = `
    SELECT o.orderID, o.orderNumber, o.orderDate, o.totalAmount, o.discountAmount, 
           IFNULL(ph.paidAmount, 0) as paidAmount, 
           o.totalAmount - IFNULL(ph.paidAmount, 0) as dueAmount,
           o.orderStatus, o.customerID, o.shippingAddress, o.plusCode,
           o.latitude, o.longitude, o.paymentMethod, o.paymentStatus,
           o.createdAt, u.userName as customerName, u.userEmail as customerEmail,
           u.userPhone as customerPhone, u.userAddress as customerAddress
    FROM orders o
    LEFT JOIN users u ON o.customerID = u.userID
    LEFT JOIN (SELECT orderID, SUM(amount) AS paidAmount FROM payment_history GROUP BY orderID) ph 
    ON o.orderID = ph.orderID
    ORDER BY o.orderDate DESC
  `;

  db.query(query, (err, orders) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message,
        details: 'Error fetching sales data'
      });
    }

    const orderIds = orders.map(order => order.orderID);
    if (orderIds.length === 0) {
      return res.json({ success: true, sales: [] });
    }

    const productQuery = `
      SELECT op.orderID, p.productID, p.productEnName, p.productBnName, 
             p.productUnit, op.price, op.quantity, (op.quantity * op.price) as totalCost
      FROM order_details op
      LEFT JOIN product_list p ON op.productID = p.productID
      WHERE op.orderID IN (?)
    `;

    db.query(productQuery, [orderIds], (err, products) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message,
          details: 'Error fetching product data'
        });
      }

      const sales = orders.map(order => {
        return {
          ...order,
          products: products.filter(product => product.orderID === order.orderID)
        };
      });

      res.json({ success: true, sales });
    });
  });
});

// Add endpoint to update order status
app.patch('/api/sales/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status || !['Confirmed', 'Processing', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status value' 
    });
  }

  const updateOrderStatus = (paymentStatus) => {
    db.query(
      'UPDATE orders SET orderStatus = ?, paymentStatus = ? WHERE orderID = ?',
      [status, paymentStatus, orderId],
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
  };

  if (status === 'Cancelled') {
    db.query('DELETE FROM payment_history WHERE orderID = ?', [orderId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      updateOrderStatus('Cancelled');
    });
  } else {
    db.query('SELECT orderStatus, paymentStatus FROM orders WHERE orderID = ?', [orderId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      const currentStatus = results[0].orderStatus;
      const currentPaymentStatus = results[0].paymentStatus;
      const paymentStatus = currentStatus === 'Cancelled' ? 'Unpaid' : currentPaymentStatus;
      updateOrderStatus(paymentStatus);
    });
  }
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

// Restore original payments endpoint
app.get('/api/payments', (req, res) => {
  const query = `
    SELECT 
      ph.paymentID,
      ph.amount,
      ph.paymentMethod,
      ph.paymentDate,
      ph.note,
      ph.referenceNumber,
      ph.createdAt,
      o.customerID,
      o.orderNumber,
      u.userName as customerName
    FROM payment_history ph
    LEFT JOIN orders o ON ph.orderID = o.orderID
    LEFT JOIN users u ON o.customerID = u.userID
    ORDER BY ph.paymentDate DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({ 
      success: true, 
      payments: results 
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

// Delete payment endpoint
app.delete('/api/payments/:id', (req, res) => {
  const paymentId = req.params.id;

  // Start a transaction
  db.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    // First get the payment and order details
    const getPaymentQuery = `
      SELECT ph.*, o.totalAmount 
      FROM payment_history ph
      JOIN orders o ON ph.orderID = o.orderID
      WHERE ph.paymentID = ?
    `;

    db.query(getPaymentQuery, [paymentId], (err, paymentResults) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ success: false, error: err.message });
        });
      }

      if (paymentResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ success: false, error: 'Payment not found' });
        });
      }

      const { orderID, totalAmount } = paymentResults[0];

      // Delete the payment
      db.query('DELETE FROM payment_history WHERE paymentID = ?', [paymentId], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ success: false, error: err.message });
          });
        }

        // Calculate remaining total paid amount
        db.query(
          'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payment_history WHERE orderID = ?',
          [orderID],
          (err, totalPaidResults) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, error: err.message });
              });
            }

            const totalPaid = totalPaidResults[0].totalPaid;
            
            // Determine new payment status
            let paymentStatus = 'Unpaid';
            if (totalPaid >= totalAmount) {
              paymentStatus = 'Paid';
            } else if (totalPaid > 0) {
              paymentStatus = 'Partial';
            }

            // Update order payment status
            db.query(
              'UPDATE orders SET paymentStatus = ? WHERE orderID = ?',
              [paymentStatus, orderID],
              (err) => {
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
                    message: 'Payment deleted successfully',
                    paymentStatus,
                    remainingPaid: totalPaid
                  });
                });
              }
            );
          }
        );
      });
    });
  });
});

// Todo API endpoints
app.get('/api/todos', (req, res) => {
  db.query('SELECT * FROM todos ORDER BY createdAt DESC', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    // Convert MySQL tinyint (0/1) to boolean for isImportant
    const todos = results.map(todo => ({
      ...todo,
      isImportant: Boolean(todo.isImportant)
    }));
    res.json({ success: true, todos });
  });
});

app.post('/api/todos', (req, res) => {
  const { title, tag, priority, status, description } = req.body;
  
  const todo = {
    title,
    tag,
    priority,
    status,
    description,
    createdAt: new Date()
  };

  db.query('INSERT INTO todos SET ?', todo, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      todo: { ...todo, id: results.insertId }
    });
  });
});

app.put('/api/todos/:id', (req, res) => {
  const todoId = req.params.id;
  const updates = req.body;

  db.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      todo: { ...updates, id: todoId }
    });
  });
});

// Change delete endpoint to update status instead
app.delete('/api/todos/:id', (req, res) => {
  const todoId = req.params.id;
  const updates = { status: 'deleted' };

  db.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: 'Todo moved to trash successfully'
    });
  });
});

// Add new endpoint for permanent deletion
app.delete('/api/todos/:id/permanent', (req, res) => {
  const todoId = req.params.id;

  db.query('DELETE FROM todos WHERE id = ?', [todoId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: 'Todo permanently deleted'
    });
  });
});

// Add restore from trash endpoint
app.patch('/api/todos/:id/restore', (req, res) => {
  const todoId = req.params.id;
  const updates = { status: 'pending' };

  db.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: 'Todo restored successfully'
    });
  });
});

// Add new endpoint to get todo counts
app.get('/api/todos/counts', (req, res) => {
  const query = `
    SELECT 
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as inbox,
      COUNT(CASE WHEN status = 'completed' THEN 0 END) as done,
      COUNT(CASE WHEN isImportant = true THEN 1 END) as important,
      COUNT(CASE WHEN status = 'deleted' THEN 0 END) as trash
    FROM todos
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ 
      success: true, 
      counts: results[0]
    });
  });
});

// Get all expenses
app.get('/api/expenses', (req, res) => {
  const query = `
    SELECT t1.*, t2.name AS catName, t2.id AS catId FROM expenses t1 
    LEFT JOIN expense_categories t2 ON t1.category = t2.id 
    WHERE t1.status = 'Active' 
    ORDER BY t1.createdAt DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, expenses: results });
  });
});

// Get single expense
app.get('/api/expenses/:id', (req, res) => {
  const expenseId = req.params.id;
  
  db.query('SELECT * FROM expenses WHERE id = ?', [expenseId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, expense: results[0] });
  });
});

// Create new expense
app.post('/api/expenses', (req, res) => {
  const { 
    category,
    amount,
    reference,
    expenseFor,
    description,
    expenseDate,
    status = 'Active'
  } = req.body;

  const expense = {
    category,
    amount: parseFloat(amount),
    reference,
    expenseFor,
    description,
    expenseDate,
    status,
    createdAt: new Date()
  };

  db.query('INSERT INTO expenses SET ?', expense, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: 'Expense added successfully',
      expense: { ...expense, id: result.insertId }
    });
  });
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const expenseId = req.params.id;
  const updates = req.body;

  if (updates.amount) {
    updates.amount = parseFloat(updates.amount);
  }

  db.query(
    'UPDATE expenses SET ? WHERE id = ?',
    [updates, expenseId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
      }
      res.json({
        success: true,
        message: 'Expense updated successfully',
        expense: { id: expenseId, ...updates }
      });
    }
  );
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const expenseId = req.params.id;

  db.query('DELETE FROM expenses WHERE id = ?', [expenseId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ 
      success: true, 
      message: 'Expense deleted successfully' 
    });
  });
});

// Get all expense categories
app.get('/api/expense-categories', (req, res) => {
  const query = 'SELECT * FROM expense_categories ORDER BY name';
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, categories: results });
  });
});

// Create new expense category
app.post('/api/expense-categories', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  const category = {
    name,
    description,
    createdAt: new Date()
  };

  db.query('INSERT INTO expense_categories SET ?', category, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: 'Category added successfully',
      category: { ...category, id: result.insertId }
    });
  });
});

// Update expense category
app.put('/api/expense-categories/:id', (req, res) => {
  const categoryId = req.params.id;
  const updates = req.body;

  db.query(
    'UPDATE expense_categories SET ? WHERE id = ?',
    [updates, categoryId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({
        success: true,
        message: 'Category updated successfully',
        category: { id: categoryId, ...updates }
      });
    }
  );
});

// Delete expense category
app.delete('/api/expense-categories/:id', (req, res) => {
  const categoryId = req.params.id;

  db.query('DELETE FROM expense_categories WHERE id = ?', [categoryId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  });
});

// Add customers endpoint
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, customers: results });
  });
});

// Get all employees
app.get('/api/employees', (req, res) => {
  const query = `
    SELECT * FROM employees ORDER BY empID ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, employees: results });
  });
});

// Create new employee
app.post('/api/employees', (req, res) => {
  const {
    name,
    address,
    mobile,
    email,
    status = 'Active',
    imageUrl,
    designation,
    joinDate,
    loginName,
    loginPassword
  } = req.body;

  const employee = {
    name,
    address,
    mobile,
    email,
    status,
    imageUrl,
    designation,
    joinDate,
    loginName,
    loginPassword,
    lastLoginTime: null
  };

  db.query('INSERT INTO employees SET ?', employee, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({
      success: true, 
      message: 'Employee created successfully',
      employee: { ...employee, empId: result.insertId }
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});