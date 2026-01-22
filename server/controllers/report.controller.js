import Report from '../models/Report.model.js';
import { extractBiomarkers } from '../services/gemini.service.js';
import { determineStatus, normalizeUnit } from '../utils/biomarker.util.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadReport = async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded',
        error: 'Please select a PDF or image file to upload'
      });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ 
        message: 'Uploaded file not found',
        error: 'File upload failed. Please try again.'
      });
    }

    // Extract biomarkers using Gemini Vision
    let extractedBiomarkers;
    try {
      extractedBiomarkers = await extractBiomarkers(filePath, mimeType);
    } catch (error) {
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      // Return user-friendly error message
      const errorMessage = error.message || 'Failed to extract biomarkers from report';
      return res.status(500).json({ 
        message: 'Failed to extract biomarkers from report',
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    // Validate extracted biomarkers
    if (!Array.isArray(extractedBiomarkers) || extractedBiomarkers.length === 0) {
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(400).json({ 
        message: 'No biomarkers found in report',
        error: 'Could not extract any biomarker data from the uploaded file. Please ensure the file is a clear, readable lab report.'
      });
    }

    // Process biomarkers: determine status and normalize
    const processedBiomarkers = extractedBiomarkers
      .filter(biomarker => {
        // Validate required fields
        return biomarker.testName && 
               biomarker.value !== undefined && 
               biomarker.value !== null &&
               biomarker.unit &&
               biomarker.referenceRange;
      })
      .map(biomarker => {
        const value = parseFloat(biomarker.value);
        if (isNaN(value)) {
          console.warn(`Invalid value for ${biomarker.testName}: ${biomarker.value}`);
          return null;
        }
        return {
          testName: String(biomarker.testName).trim(),
          value: value,
          unit: normalizeUnit(String(biomarker.unit)),
          referenceRange: String(biomarker.referenceRange).trim(),
          status: determineStatus(value, biomarker.referenceRange)
        };
      })
      .filter(biomarker => biomarker !== null);

    // Check if we have valid biomarkers after processing
    if (processedBiomarkers.length === 0) {
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(400).json({ 
        message: 'Invalid biomarker data',
        error: 'Could not process biomarker data from the report. Please ensure the report contains valid test results.'
      });
    }

    // Create report
    const report = new Report({
      userId: req.user._id,
      reportDate: new Date(), // In production, extract from PDF if available
      biomarkers: processedBiomarkers,
      fileName: req.file.originalname,
      fileType: mimeType
    });

    await report.save();

    // Clean up uploaded file (we don't store raw files)
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
        // Don't fail the request if cleanup fails
      }
    }

    res.status(201).json({
      message: 'Report processed successfully',
      report: {
        id: report._id,
        reportDate: report.reportDate,
        biomarkers: report.biomarkers,
        processedAt: report.processedAt
      }
    });
  } catch (error) {
    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    console.error('Upload report error:', error);
    res.status(500).json({ 
      message: 'An error occurred while processing the report',
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ reportDate: -1 })
      .select('-__v');

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

