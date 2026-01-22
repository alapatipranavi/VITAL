import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getTrends,
  getAllTrends,
  getDoctorSummary
} from '../controllers/trend.controller.js';

const router = express.Router();

router.get('/summary/doctor', authenticate, getDoctorSummary);
router.get('/:testName', authenticate, getTrends);
router.get('/', authenticate, getAllTrends);

export default router;

