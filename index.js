// server.js - Update with proper CORS and fix route order
require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 8000;
const connectDB = require('./config/db_connection');
const cookieParser = require('cookie-parser');
const path = require('path');
const server = require('http').createServer(app);

// IMPORTANT: Configure CORS BEFORE other middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your React dev server port
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser(process.env.COOKIEPARSER_SECRET));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Import routes
const mobile_route = require('./routes/mobileRoute');
const admin_route = require('./routes/adminRoute');
// In server.js, add these imports:
const orderRoutes = require('./routes/orderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/admin/orders', orderRoutes);
app.use('/admin/services', serviceRoutes);
app.use('/admin/users', userRoutes);



// Import middlewares
const { jwt_check_middleware } = require('./middlewares/jwt_check_middleware');

// Important: Apply jwt_check_middleware ONLY to protected routes
// NOT to login route
// app.use('/admin/loginCheck', admin_route); // Login route without JWT middleware
app.use('/', jwt_check_middleware, mobile_route, admin_route); // Other routes with JWT middleware

connectDB();

// Add error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, msg: 'Internal server error' });
});

server.listen(PORT, '0.0.0.0', () => {  // Listen on all interfaces
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🚀 Server also accessible on http://127.0.0.1:${PORT}`);
  console.log(`📡 Waiting for connections...`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  }
  console.error('Server error:', error);
});










// require('dotenv').config()
// const express = require('express');
// const app = express();
// const cors = require('cors');
// const PORT = process.env.PORT || 8000;
// const connectDB = require('./config/db_connection');
// const cookieParser = require('cookie-parser');
// const path = require('path');
// const server = require('http').createServer(app);
// const multer = require('multer'); // Add multer

// const user_module = require('./model/user_module');

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use(cookieParser(process.env.COOKIEPARSER_SECRET));


// app.use((req, res, next) => {
//     console.log('Path:', req.path);
//     next();
// });

// // Import routes
// const mobile_route = require('./routes/mobileRoute');
// const admin_route = require('./routes/adminRoute');

// // Import middlewares
// const { jwt_check_middleware } = require('./middlewares/jwt_check_middleware');
// // Routes middleware
// app.use('/', jwt_check_middleware, mobile_route, admin_route);

// connectDB();

// server.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });
