import mongoose from 'mongoose';

const biomarkerSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  referenceRange: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['NORMAL', 'HIGH', 'LOW'],
    default: 'NORMAL'
  },
  extractedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  biomarkers: [biomarkerSchema],
  fileName: String,
  fileType: String,
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ userId: 1, reportDate: -1 });
reportSchema.index({ 'biomarkers.testName': 1 });

export default mongoose.model('Report', reportSchema);

