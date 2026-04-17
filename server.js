import express from 'express'
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from "url";

// import categoryRoutes from './src/routes/categories.js';

import categoryRoutes from './routes/category.routes.js'
import productRoutes from './routes/products.routes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT  = process.env.PORT || 3000;

// App Setup
app.use(cors());
app.use(express.json())

// 🔥 Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

//Serve API'S
app.use('/api/categories', categoryRoutes)
app.use('/api/categories/:catId/products', productRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Stockr Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
