import Report from '../models/Report.model.js';
import { generateDoctorSummary } from '../services/gemini.service.js';

export const getTrends = async (req, res) => {
  try {
    // NOTE: Route is `/api/trends/:testName` (param), but we also support query (?testName=)
    // Normalize to avoid case/space mismatches (e.g., "GFR Estimated")
    const rawName = (req.params?.testName ?? req.query?.testName ?? '').toString();
    const testName = decodeURIComponent(rawName).trim();

    if (!testName) {
      return res.status(400).json({ message: 'testName is required' });
    }

    // Get all reports for user
    const reports = await Report.find({ userId: req.user._id })
      .sort({ reportDate: 1 })
      .select('reportDate biomarkers');

    // Extract specific biomarker across all reports (case-insensitive)
    const trendData = reports
      .map(report => {
        const biomarker = report.biomarkers.find(
          b => (b?.testName || '').toLowerCase().trim() === testName.toLowerCase()
        );
        if (biomarker) {
          return {
            date: report.reportDate,
            value: biomarker.value,
            unit: biomarker.unit,
            status: biomarker.status,
            referenceRange: biomarker.referenceRange
          };
        }
        return null;
      })
      .filter(Boolean);

    // Calculate trend direction
    let trendDirection = 'stable';
    if (trendData.length >= 2) {
      const first = trendData[0].value;
      const last = trendData[trendData.length - 1].value;
      const change = ((last - first) / first) * 100;

      if (Math.abs(change) < 5) {
        trendDirection = 'stable';
      } else if (change > 0) {
        trendDirection = 'increasing';
      } else {
        trendDirection = 'decreasing';
      }
    }

    // Handle single data point (still render a chart on the frontend)
    if (trendData.length === 1) {
      const single = trendData[0];
      return res.json({
        testName,
        trendData,
        trendDirection: 'stable',
        insight: `Current ${testName} value: ${single.value} ${single.unit}. Upload more reports to see trends.`
      });
    }

    // Generate insight text
    let insight = '';
    if (trendData.length >= 2) {
      const first = trendData[0];
      const last = trendData[trendData.length - 1];
      const change = last.value - first.value;
      const changePercent = ((change / first.value) * 100).toFixed(1);

      if (trendDirection === 'decreasing' && last.status === 'NORMAL') {
        insight = `Your ${testName} decreased from ${first.value} to ${last.value} ${last.unit} (${Math.abs(changePercent)}% decrease) — current lifestyle changes are working.`;
      } else if (trendDirection === 'increasing' && last.status === 'HIGH') {
        insight = `Your ${testName} increased from ${first.value} to ${last.value} ${last.unit} (${changePercent}% increase) — consider consulting your doctor.`;
      } else if (trendDirection === 'stable') {
        insight = `Your ${testName} has remained relatively stable around ${last.value} ${last.unit}.`;
      } else {
        insight = `Your ${testName} shows a ${trendDirection} trend. Current value: ${last.value} ${last.unit}.`;
      }
    }

    res.json({
      testName,
      trendData,
      trendDirection,
      insight
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTrends = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ reportDate: 1 });

    // Get all unique biomarker names
    const biomarkerNames = new Set();
    reports.forEach(report => {
      report.biomarkers.forEach(b => biomarkerNames.add(b.testName));
    });

    // Build trends for each biomarker
    const trends = Array.from(biomarkerNames).map(testName => {
      const trendData = reports
        .map(report => {
          // Use case-insensitive matching to ensure consistency
          const biomarker = report.biomarkers.find(
            b => b.testName.toLowerCase() === testName.toLowerCase()
          );
          if (biomarker) {
            return {
              date: report.reportDate,
              value: biomarker.value,
              unit: biomarker.unit,
              status: biomarker.status
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        testName,
        trendData,
        latestValue: trendData[trendData.length - 1]?.value,
        latestStatus: trendData[trendData.length - 1]?.status
      };
    });

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorSummary = async (req, res) => {
  try {
    // Get all reports
    const reports = await Report.find({ userId: req.user._id })
      .sort({ reportDate: -1 })
      .limit(5) // Last 5 reports
      .lean();

    // Get abnormal biomarkers
    const abnormalBiomarkers = [];
    reports.forEach(report => {
      report.biomarkers.forEach(biomarker => {
        if (biomarker.status !== 'NORMAL') {
          abnormalBiomarkers.push({
            testName: biomarker.testName,
            value: biomarker.value,
            unit: biomarker.unit,
            status: biomarker.status,
            reportDate: report.reportDate
          });
        }
      });
    });

    // Generate summary using Gemini
    let summary = [];
    try {
      summary = await generateDoctorSummary(reports, abnormalBiomarkers);
    } catch (error) {
      console.error('Summary generation error:', error);
      // Fallback summary
      summary = [
        `Found ${abnormalBiomarkers.length} abnormal biomarker(s) across ${reports.length} report(s)`,
        'Review all abnormal values with healthcare provider',
        'Monitor trends over time',
        'Consider lifestyle modifications',
        'Schedule follow-up consultation'
      ];
    }

    res.json({
      summary,
      reportCount: reports.length,
      abnormalCount: abnormalBiomarkers.length,
      abnormalBiomarkers: abnormalBiomarkers.slice(0, 10) // Top 10
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

