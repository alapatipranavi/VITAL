// 🔥 Load environment variables FIRST
import './env.js';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/report.routes.js';
import biomarkerRoutes from './routes/biomarker.routes.js';
import trendRoutes from './routes/trend.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   🔍 ENV VALIDATION
========================= */
const requiredEnvVars = [
  'MONGO_URI',
  'GEMINI_API_KEY',
  'PINECONE_API_KEY',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(
  (key) => !process.env[key]
);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

// Optional warnings
if (process.env.GEMINI_API_KEY.length < 20) {
  console.warn('⚠️ GEMINI_API_KEY looks too short');
}
if (!process.env.PINECONE_API_KEY.startsWith('pcsk_')) {
  console.warn('⚠️ PINECONE_API_KEY format may be incorrect');
}

/* =========================
   🧩 MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   🗄️ MONGODB CONNECTION
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

/* =========================
   🚏 ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/biomarkers', biomarkerRoutes);
app.use('/api/trends', trendRoutes);

/* =========================
   ❤️ HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'VitalSense API is running',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      port: PORT,
      mongoConnected: mongoose.connection.readyState === 1,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasPineconeKey: !!process.env.PINECONE_API_KEY
    }
  });
});

/* =========================
   ❌ ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 VitalSense server running on port ${PORT}`);
});
