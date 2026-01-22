import Report from '../models/Report.model.js';
import { queryRAG } from '../services/pinecone.service.js';
import { generateExplanation } from '../services/gemini.service.js';

export const getBiomarkerDetails = async (req, res) => {
  try {
    const { testName, reportId } = req.query;

    if (!testName || !reportId) {
      return res.status(400).json({ message: 'testName and reportId are required' });
    }

    // Find the report and biomarker
    const report = await Report.findOne({
      _id: reportId,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const biomarker = report.biomarkers.find(
      b => b.testName.toLowerCase() === testName.toLowerCase()
    );

    if (!biomarker) {
      return res.status(404).json({ message: 'Biomarker not found in report' });
    }

    // Only get RAG context for abnormal values
    let ragContext = {};
    if (biomarker.status !== 'NORMAL') {
      ragContext = await queryRAG(biomarker.testName);
    }

    // Generate explanation if abnormal
    let explanation = null;
    if (biomarker.status !== 'NORMAL') {
      try {
        explanation = await generateExplanation(
          biomarker,
          ragContext,
          req.user.profile || {}
        );
      } catch (error) {
        console.error('Explanation generation error:', error);
        // Continue without explanation
      }
    }

    res.json({
      biomarker,
      explanation,
      ragContext: biomarker.status !== 'NORMAL' ? ragContext : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAbnormalBiomarkers = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ reportDate: -1 });

    const abnormalBiomarkers = [];

    reports.forEach(report => {
      report.biomarkers.forEach(biomarker => {
        if (biomarker.status !== 'NORMAL') {
          abnormalBiomarkers.push({
            testName: biomarker.testName,
            value: biomarker.value,
            unit: biomarker.unit,
            referenceRange: biomarker.referenceRange,
            status: biomarker.status,
            reportId: report._id,
            reportDate: report.reportDate
          });
        }
      });
    });

    res.json({ abnormalBiomarkers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

