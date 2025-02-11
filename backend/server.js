const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3006;
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

app.use(cors());
// Replace the single connection with a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rpbazaar_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000, // 10 seconds
  timeout: 10000, // 10 seconds
});

// Add connection monitoring
let isConnected = true;
const maxRetries = 3;
const retryInterval = 2000; // 2 seconds

pool.on('connection', (connection) => {
  isConnected = true;
  console.log('Database connection established');
});

pool.on('error', (err) => {
  isConnected = false;
  console.error('Database pool error:', err);
});

// Wrapper function for database queries with retry logic
const executeQuery = async (query, params = [], retries = maxRetries) => {
  try {
    const connection = await pool.promise().getConnection();
    try {
      const [results] = await connection.query(query, params);
      connection.release();
      isConnected = true;
      return results;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    if (error.message?.includes('closed state') && retries > 0) {
      console.log(`Retrying query, ${retries} attempts remaining...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      return executeQuery(query, params, retries - 1);
    }
    throw error;
  }
};

// Middleware to check database connection
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      // Test the connection
      await pool.promise().query('SELECT 1');
      isConnected = true;
      next();
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: 'Database connection lost. Please try again in a moment.',
        retryAfter: retryInterval / 1000
      });
    }
  } else {
    next();
  }
});

// Convert pool to use promises
const promisePool = pool.promise();

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
app.get('/api/products', async (req, res) => {
  try {
    const results = await executeQuery('SELECT * FROM product_list');
    res.json({ success: true, products: results });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      retryable: err.message?.includes('closed state')
    });
  }
});

// Individual Product
app.get('/api/product_details/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const [results] = await promisePool.query('SELECT * FROM product_list WHERE productID = ?', [productId]);
    res.json({ success: true, product: results[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Product with Image
app.put('/api/update_product/:id', upload.single('file'), async (req, res) => {
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

  try {
    await promisePool.query('UPDATE product_list SET ? WHERE productID = ?', [productData, productId]);
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      imageUrl: productData.imageUrl,
      updatedData: productData
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create new product endpoint
app.post('/api/products', upload.single('file'), async (req, res) => {
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

  try {
    const [results] = await promisePool.query('INSERT INTO product_list SET ?', dataToInsert);
    res.json({ 
      success: true, 
      message: 'Product created successfully',
      productId: results.insertId,
      product: {
        ...dataToInsert,
        productID: results.insertId
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Update Product Status endpoint
app.patch('/api/products/:id/status', async (req, res) => {
  const productId = req.params.id;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status value. Must be either "Active" or "Inactive"' 
    });
  }

  try {
    const [results] = await promisePool.query(
      'UPDATE product_list SET productStatus = ? WHERE productID = ?',
      [status, productId]
    );

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
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Categories API endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const [results] = await promisePool.query('SELECT * FROM categories WHERE catStatus = "Active"');
    res.json({ success: true, categories: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { catName, catStatus = 'Active' } = req.body;
  
  if (!catName) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    const [results] = await promisePool.query(
      'INSERT INTO categories (catName, catStatus) VALUES (?, ?)',
      [catName, catStatus]
    );
    res.json({ 
      success: true, 
      message: 'Category added successfully',
      category: { id: results.insertId, catName, catStatus }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Units API endpoints
app.get('/api/units', async (req, res) => {
  try {
    const [results] = await promisePool.query('SELECT * FROM units WHERE unitStatus = "Active"');
    res.json({ success: true, units: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/units', async (req, res) => {
  const { unitName, unitStatus = 'Active' } = req.body;
  
  if (!unitName) {
    return res.status(400).json({ success: false, error: 'Unit name is required' });
  }

  try {
    const [results] = await promisePool.query(
      'INSERT INTO units (unitName, unitStatus) VALUES (?, ?)',
      [unitName, unitStatus]
    );
    res.json({ 
      success: true, 
      message: 'Unit added successfully',
      unit: { id: results.insertId, unitName, unitStatus }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore original sales endpoint
app.get('/api/sales', async (req, res) => {
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

  try {
    const [orders] = await promisePool.query(query);

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

    const [products] = await promisePool.query(productQuery, [orderIds]);

    const sales = orders.map(order => {
      return {
        ...order,
        products: products.filter(product => product.orderID === order.orderID)
      };
    });

    res.json({ success: true, sales });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: 'Error fetching sales data'
    });
  }
});

// Add endpoint to update order status
app.patch('/api/sales/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status || !['Confirmed', 'Processing', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status value' 
    });
  }

  const updateOrderStatus = async (paymentStatus) => {
    try {
      const [results] = await promisePool.query(
        'UPDATE orders SET orderStatus = ?, paymentStatus = ? WHERE orderID = ?',
        [status, paymentStatus, orderId]
      );
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({ success: true, message: 'Order status updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  if (status === 'Cancelled') {
    try {
      await promisePool.query('DELETE FROM payment_history WHERE orderID = ?', [orderId]);
      // Accounts ledger entry for refund, find sum of amount from payment history table using order id
      const [results] = await promisePool.query('SELECT SUM(amount) as total FROM payment_history WHERE orderID = ?', [orderId]);
      const refundAmount = results[0].total;
      if (refundAmount > 0) {
      await promisePool.query(
        'INSERT INTO accounts (account_name, credit, debit, description, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['Refund', 0, refundAmount, `Refund for order #${orderId}`]
      );
      }
      updateOrderStatus('Cancelled');
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    try {
      const [results] = await promisePool.query('SELECT orderStatus, paymentStatus FROM orders WHERE orderID = ?', [orderId]);
      if (results.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      const currentStatus = results[0].orderStatus;
      const currentPaymentStatus = results[0].paymentStatus;
      const paymentStatus = currentStatus === 'Cancelled' ? 'Unpaid' : currentPaymentStatus;
      updateOrderStatus(paymentStatus);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Add payment endpoint
app.post('/api/sales/:id/payment', async (req, res) => {
  const orderId = req.params.id;
  const { amount, paymentMethod, note } = req.body;

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    // First insert the payment record
    const paymentQuery = `
      INSERT INTO payment_history (orderID, amount, paymentMethod, paymentDate, note)
      VALUES (?, ?, ?, NOW(), ?)
    `;

    const [paymentResult] = await connection.query(paymentQuery, [orderId, amount, paymentMethod, note]);

    // Then Add Paid Amount to accounts ledger
    const ledgerQuery = `INSERT INTO accounts (account_name, credit, debit, description, created_at) VALUES (?, ?, ?, ?, NOW())`;
    await connection.query(ledgerQuery, ['Sales', amount, 0, `Payment received for order #${orderId} via ${paymentMethod}`]);    

    // Then get the current total paid amount for this order
    const totalPaidQuery = `
      SELECT SUM(amount) as totalPaid
      FROM payment_history
      WHERE orderID = ?
    `;

    const [totalPaidResult] = await connection.query(totalPaidQuery, [orderId]);

    // Get order total amount
    const orderQuery = `
      SELECT totalAmount FROM orders WHERE orderID = ?
    `;

    const [orderResult] = await connection.query(orderQuery, [orderId]);

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

    await connection.query(updateQuery, [paymentStatus, orderId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: paymentResult.insertId,
      paymentStatus: paymentStatus,
      totalPaid: totalPaid
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
});

// Restore original payments endpoint
app.get('/api/payments', async (req, res) => {
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

  try {
    const [results] = await promisePool.query(query);
    res.json({ 
      success: true, 
      payments: results 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get payment history for an order
app.get('/api/sales/:id/payments', async (req, res) => {
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

  try {
    const [results] = await promisePool.query(query, [orderId]);
    res.json({ 
      success: true, 
      payments: results 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete payment endpoint
app.delete('/api/payments/:id', async (req, res) => {
  const paymentId = req.params.id;

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // First get the payment and order details
    const getPaymentQuery = `
      SELECT ph.*, o.totalAmount 
      FROM payment_history ph
      JOIN orders o ON ph.orderID = o.orderID
      WHERE ph.paymentID = ?
    `;

    const [paymentResults] = await connection.query(getPaymentQuery, [paymentId]);

    if (paymentResults.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const { orderID, totalAmount } = paymentResults[0];

    // Delete the payment
    await connection.query('DELETE FROM payment_history WHERE paymentID = ?', [paymentId]);

    // Then Debit the accounts ledger
    await connection.query(
      'INSERT INTO accounts (account_name, credit, debit, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      ['Sales', 0, paymentResults[0].amount, `Payment deleted for order #${orderID}`]
    );    

    // Calculate remaining total paid amount
    const [totalPaidResults] = await connection.query(
      'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payment_history WHERE orderID = ?',
      [orderID]
    );

    const totalPaid = totalPaidResults[0].totalPaid;
    
    // Determine new payment status
    let paymentStatus = 'Unpaid';
    if (totalPaid >= totalAmount) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partial';
    }

    // Update order payment status
    await connection.query(
      'UPDATE orders SET paymentStatus = ? WHERE orderID = ?',
      [paymentStatus, orderID]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Payment deleted successfully',
      paymentStatus,
      remainingPaid: totalPaid
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
});

// Todo API endpoints
app.get('/api/todos', async (req, res) => {
  try {
    const [results] = await promisePool.query('SELECT * FROM todos ORDER BY createdAt DESC');
    // Convert MySQL tinyint (0/1) to boolean for isImportant
    const todos = results.map(todo => ({
      ...todo,
      isImportant: Boolean(todo.isImportant)
    }));
    res.json({ success: true, todos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/todos', async (req, res) => {
  const { title, tag, priority, status, description } = req.body;
  
  const todo = {
    title,
    tag,
    priority,
    status,
    description,
    createdAt: new Date()
  };

  try {
    const [results] = await promisePool.query('INSERT INTO todos SET ?', todo);
    res.json({
      success: true,
      todo: { ...todo, id: results.insertId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const todoId = req.params.id;
  const updates = req.body;

  try {
    await promisePool.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId]);
    res.json({
      success: true,
      todo: { ...updates, id: todoId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change delete endpoint to update status instead
app.delete('/api/todos/:id', async (req, res) => {
  const todoId = req.params.id;
  const updates = { status: 'deleted' };

  try {
    await promisePool.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId]);
    res.json({
      success: true,
      message: 'Todo moved to trash successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new endpoint for permanent deletion
app.delete('/api/todos/:id/permanent', async (req, res) => {
  const todoId = req.params.id;

  try {
    await promisePool.query('DELETE FROM todos WHERE id = ?', [todoId]);
    res.json({
      success: true,
      message: 'Todo permanently deleted'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add restore from trash endpoint
app.patch('/api/todos/:id/restore', async (req, res) => {
  const todoId = req.params.id;
  const updates = { status: 'pending' };

  try {
    await promisePool.query('UPDATE todos SET ? WHERE id = ?', [updates, todoId]);
    res.json({
      success: true,
      message: 'Todo restored successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new endpoint to get todo counts
app.get('/api/todos/counts', async (req, res) => {
  const query = `
    SELECT 
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as inbox,
      COUNT(CASE WHEN status = 'completed' THEN 0 END) as done,
      COUNT(CASE WHEN isImportant = true THEN 1 END) as important,
      COUNT(CASE WHEN status = 'deleted' THEN 0 END) as trash
    FROM todos
  `;

  try {
    const [results] = await promisePool.query(query);
    res.json({ 
      success: true, 
      counts: results[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  const query = `
    SELECT t1.*, t2.name AS catName, t2.id AS catId FROM expenses t1 
    LEFT JOIN expense_categories t2 ON t1.category = t2.id 
    WHERE t1.status = 'Active' 
    ORDER BY t1.createdAt DESC
  `;
  
  try {
    const [results] = await promisePool.query(query);
    res.json({ success: true, expenses: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single expense
app.get('/api/expenses/:id', async (req, res) => {
  const expenseId = req.params.id;
  
  try {
    const [results] = await promisePool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, expense: results[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new expense
app.post('/api/expenses', async (req, res) => {
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

  // Start a transaction to ensure data consistency
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert the expense into the expenses table
    const [expenseResult] = await connection.query('INSERT INTO expenses SET ?', expense);

    // Update the accounts ledger with the expense
    const ledgerQuery = `
      INSERT INTO accounts (account_name, credit, debit, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await connection.query(ledgerQuery, ['Expenses', 0, amount, `Expense for ${expenseFor}`, expenseDate]);

    // Commit the transaction if both queries succeed
    await connection.commit();

    // Return the response with the inserted expense
    res.json({
      success: true,
      message: 'Expense added successfully',
      expense: { ...expense, id: expenseResult.insertId }
    });
  } catch (err) {
    // Rollback the transaction in case of an error
    await connection.rollback();
    console.error('Error adding expense and ledger entry:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
});


// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  const expenseId = req.params.id;
  const updates = req.body;

  if (updates.amount) {
    updates.amount = parseFloat(updates.amount);
  }

  try {
    const [result] = await promisePool.query(
      'UPDATE expenses SET ? WHERE id = ?',
      [updates, expenseId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: { id: expenseId, ...updates }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  const expenseId = req.params.id;

  try {
    const [result] = await promisePool.query('DELETE FROM expenses WHERE id = ?', [expenseId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ 
      success: true, 
      message: 'Expense deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all expense categories
app.get('/api/expense-categories', async (req, res) => {
  const query = 'SELECT * FROM expense_categories ORDER BY name';
  
  try {
    const [results] = await promisePool.query(query);
    res.json({ success: true, categories: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new expense category
app.post('/api/expense-categories', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  const category = {
    name,
    description,
    createdAt: new Date()
  };

  try {
    const [result] = await promisePool.query('INSERT INTO expense_categories SET ?', category);
    res.json({
      success: true,
      message: 'Category added successfully',
      category: { ...category, id: result.insertId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update expense category
app.put('/api/expense-categories/:id', async (req, res) => {
  const categoryId = req.params.id;
  const updates = req.body;

  try {
    const [result] = await promisePool.query(
      'UPDATE expense_categories SET ? WHERE id = ?',
      [updates, categoryId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({
      success: true,
      message: 'Category updated successfully',
      category: { id: categoryId, ...updates }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete expense category
app.delete('/api/expense-categories/:id', async (req, res) => {
  const categoryId = req.params.id;

  try {
    const [result] = await promisePool.query('DELETE FROM expense_categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add customers endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const [results] = await promisePool.query('SELECT * FROM users');
    res.json({ success: true, customers: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
  const query = `
    SELECT * FROM employees ORDER BY empID ASC
  `;
  
  try {
    const [results] = await promisePool.query(query);
    res.json({ success: true, employees: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new employee
app.post('/api/employees', async (req, res) => {
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

  try {
    const [result] = await promisePool.query('INSERT INTO employees SET ?', employee);
    res.json({
      success: true, 
      message: 'Employee created successfully',
      employee: { ...employee, empId: result.insertId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Employee login endpoint
app.post('/api/employees/login', async (req, res) => {
  const { loginName, password } = req.body;

  const query = `
    SELECT * 
    FROM employees 
    WHERE loginName = ? AND loginPassword = ? AND status = 'Active'
  `;
  
  try {
    const [results] = await promisePool.query(query, [loginName, password]);
    if (results.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid login credentials' 
      });
    }

    // Update last login time
    const employee = results[0];
    await promisePool.query(
      'UPDATE employees SET lastLoginTime = NOW() WHERE empID = ?',
      [employee.empID]
    );

    res.json({ 
      success: true, 
      employee: {
        empID: employee.empId,
        name: employee.name,
        address: employee.address,
        mobile: employee.mobile,
        email: employee.email,
        designation: employee.designation,
        imageUrl: employee.imageUrl,
        loginName: employee.loginName,
        loginPassword: employee.loginPassword
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update employee profile endpoint
app.put('/api/employees/:id', async (req, res) => {
  const employeeId = req.params.id;
  const updates = req.body;

  try {
    const [result] = await promisePool.query(
      'UPDATE employees SET ? WHERE empID = ?',
      [updates, employeeId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }
    res.json({
      success: true,
      message: 'Profile updated successfully',
      employee: { ...updates, empId: employeeId }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  const queries = {
    totalSales: 'SELECT COALESCE(SUM(totalAmount), 0) as total FROM orders WHERE orderStatus != "Cancelled"',
    totalExpense: 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = "Active"',
    totalCustomers: 'SELECT COUNT(*) as total FROM users',
    totalInvoices: 'SELECT COUNT(*) as total FROM orders WHERE orderStatus != "Cancelled"'
  };

  try {
    const stats = {};
    await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const [results] = await promisePool.query(query);
        stats[key] = results[0].total;
      })
    );

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Dashboard graph data endpoint
app.get('/api/dashboard/graph', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  
  const query = `
    SELECT 
      MONTH(orderDate) as month,
      COALESCE(SUM(totalAmount), 0) as total
    FROM orders 
    WHERE 
      YEAR(orderDate) = ? 
      AND orderStatus != 'Cancelled'
    GROUP BY MONTH(orderDate)
    ORDER BY month
  `;

  try {
    const [results] = await promisePool.query(query, [year]);
    
    // Initialize array with zeros for all 12 months
    const monthlyData = Array(12).fill(0);

    // Fill in actual data where we have it
    results.forEach(row => {
      monthlyData[row.month - 1] = Number(row.total);
    });

    res.json({
      success: true,
      data: {
        series: [{
          name: 'Sales',
          data: monthlyData
        }]
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get available years from orders
app.get('/api/dashboard/years', async (req, res) => {
  const query = `
    SELECT DISTINCT YEAR(orderDate) as year 
    FROM orders 
    WHERE orderStatus != 'Cancelled'
    ORDER BY year DESC
  `;

  try {
    const [results] = await promisePool.query(query);
    const years = results.map(row => row.year);
    res.json({
      success: true,
      years: years.length > 0 ? years : [new Date().getFullYear()]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Delivery Dashboard
app.get('/api/dashboard/delivery-stats', async (req, res) => {
  const queries = {
    canceledDeliveries: 'SELECT COUNT(*) as total FROM orders WHERE orderStatus = "Cancelled"',
    completedDeliveries: 'SELECT COUNT(*) as total FROM orders WHERE orderStatus = "Completed"',
    pendingDeliveries: 'SELECT COUNT(*) as total FROM orders WHERE orderStatus = "Processing"',
    totalDeliveries: 'SELECT COUNT(*) as total FROM orders WHERE orderStatus != "Cancelled"'
  };

  try {
    const stats = {};
    await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const [results] = await promisePool.query(query);
        stats[key] = results[0].total;
      })
    );

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  const query = `
    SELECT 
      n.*,
      CASE WHEN nr.notificationId IS NOT NULL THEN true ELSE false END as isRead
    FROM notifications n
    LEFT JOIN notification_reads nr ON n.id = nr.notificationId 
    ORDER BY n.createdAt DESC
    LIMIT 50
  `;
  
  try {
    const [results] = await promisePool.query(query);
    res.json({ success: true, notifications: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM notifications n 
    LEFT JOIN notification_reads nr ON n.id = nr.notificationId
    WHERE nr.notificationId IS NULL
  `;
  
  try {
    const [results] = await promisePool.query(query);
    res.json({ success: true, count: results[0].count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.body.userId;

  const query = `
    INSERT IGNORE INTO notification_reads (notificationId, userId, readAt)
    VALUES (?, ?, NOW())
  `;
  
  try {
    await promisePool.query(query, [notificationId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('error', console.error);
});

// Function to broadcast new notifications
const broadcastNotification = (notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'NEW_NOTIFICATION', notification }));
    }
  });
};

// Add a health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await executeQuery('SELECT 1');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database pool:', err);
    process.exit(1);
  }
});

// Add unique order number generator
const generateUniqueOrderNumber = async (connection, orderDate) => {
  // Format orderDate as RPYYYYMM
  const year = orderDate.getFullYear();
  const month = ('0' + (orderDate.getMonth() + 1)).slice(-2);
  const prefix = "RP" + year + month;
  const searchString = prefix + '%';
  
  const [rows] = await connection.query(
    'SELECT COUNT(*) as count FROM orders WHERE orderNumber LIKE ?',
    [searchString]
  );
  const count = rows[0]?.count || 0;
  return prefix + String(count + 1).padStart(4, '0');
};

app.post('/api/sales', async (req, res) => {
  const {
    totalAmount,
    discountAmount,
    orderStatus,
    customerID,
    shippingAddress,
    plusCode,
    latitude,
    longitude,
    paymentMethod,
    paymentStatus,
    products
  } = req.body;

  console.log('Received sales data:', req.body); // Log the entire request body

  // Validate required fields
  if (!customerID || !products || !products.length) {
    const errorMessage = 'Missing required fields: customerID and products are required';
    console.error(errorMessage);
    return res.status(400).json({ success: false, error: errorMessage });
  }

  // Validate products structure
  for (const product of products) {
    if (!product.productID || !product.quantity || !product.price) {
      const errorMessage = 'Invalid product data: each product must have productID, quantity, and price';
      console.error(errorMessage);
      return res.status(400).json({ success: false, error: errorMessage });
    }
  }
  
  const orderDate = new Date();
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Generate orderNumber
    const orderNumber = await generateUniqueOrderNumber(connection, orderDate);
    console.log('Generated order number:', orderNumber);
    
    // Insert order record
    // Correct column names here
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        orderNumber, orderDate, totalAmount, discountAmount, 
        orderStatus, customerID, shippingAddress, plusCode, 
        latitude, longitude, paymentMethod, paymentStatus
      ) VALUES (?, Now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        totalAmount || 0,
        discountAmount || 0,
        orderStatus || 'Confirmed',
        customerID,
        shippingAddress || '',
        plusCode || '',
        latitude || 0,
        longitude || 0,
        paymentMethod || 'Cash on Delivery',
        paymentStatus || 'Unpaid'
      ]
    );
    
    const insertedOrderID = orderResult.insertId;
    console.log('Inserted order ID:', insertedOrderID);
    
    // Insert order details
    const orderDetailsQuery = `
      INSERT INTO order_details (orderID, productID, quantity, price)
      VALUES ?
    `;
    const orderDetailsValues = products.map(product => [
      insertedOrderID,
      product.productID,
      product.quantity,
      product.price
    ]);

    console.log('Order details values:', orderDetailsValues);

    await connection.query(orderDetailsQuery, [orderDetailsValues]);
    
    await connection.commit();
    res.json({ 
      success: true, 
      orderID: insertedOrderID, 
      orderNumber 
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error creating sale:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating sale: ' + err.message
    });
  } finally {
    connection.release();
  }
});

// Replace app.listen with server.listen
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});