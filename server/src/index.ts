import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { connectDB } from './db.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import skuMasterRoutes from './routes/skuMasterRoutes.js';
import { swaggerDocument } from './swagger.js';
import { seedSkuMasterCatalogue } from './seed.js';
import { SkuMaster } from './models/SkuMaster.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically for preview
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Auth Middleware
app.use(authMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/match', matchRoutes);
app.use('/summary', summaryRoutes);
app.use('/masters/sku', skuMasterRoutes);

// Error Handling Middleware (no stack traces leaked)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  await connectDB();

  // Seed SKU Master catalogue reference if empty, but leave document collections empty for user uploads
  const count = await SkuMaster.countDocuments();
  if (count === 0) {
    console.log('Seeding SKU Master catalogue reference...');
    await seedSkuMasterCatalogue();
  }

  app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Swagger UI Docs available at http://localhost:${PORT}/api-docs`);
    console.log(`================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
