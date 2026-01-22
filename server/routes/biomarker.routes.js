import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getBiomarkerDetails,
  getAbnormalBiomarkers
} from '../controllers/biomarker.controller.js';

const router = express.Router();

router.get('/details', authenticate, getBiomarkerDetails);
router.get('/abnormal', authenticate, getAbnormalBiomarkers);

export default router;

