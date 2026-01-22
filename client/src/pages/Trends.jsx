import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Trends.css';

const Trends = () => {
  const { user, logout } = useAuth();
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const trendsData = await apiService.getAllTrends();
      setTrends(trendsData);
      if (trendsData.length > 0) {
        setSelectedTrend(trendsData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendSelect = async (testName) => {
    try {
      setLoading(true);
      const trendData = await apiService.getTrends(testName);
      // Ensure trendData has the required structure
      if (trendData && trendData.testName) {
        setSelectedTrend(trendData);
      } else {
        console.error('Invalid trend data received:', trendData);
        // Set a fallback trend with empty data
        setSelectedTrend({
          testName,
          trendData: [],
          trendDirection: 'stable',
          insight: 'No trend data available for this biomarker.'
        });
      }
    } catch (error) {
      console.error('Failed to fetch trend:', error);
      // Set fallback on error
      setSelectedTrend({
        testName,
        trendData: [],
        trendDirection: 'stable',
        insight: `Unable to load trend data for ${testName}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (trendData) => {
    return trendData.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: point.value,
      status: point.status
    }));
  };

  if (loading) {
    return (
      <div>
        <Navbar user={user} logout={logout} />
        <div className="container">
          <div className="loading">Loading trends...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="page-header">
          <h1>Biomarker Trends</h1>
          <p>Track your biomarker changes over time</p>
        </div>

        {trends.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>No trend data available. Upload reports to see trends.</p>
              <Link to="/upload" className="btn btn-primary">
                Upload Report
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="trends-layout">
              <div className="trends-list">
                <h2>Select Biomarker</h2>
                <div className="trend-selector">
                  {trends.map((trend) => (
                    <button
                      key={trend.testName}
                      className={`trend-button ${
                        selectedTrend?.testName === trend.testName
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => handleTrendSelect(trend.testName)}
                    >
                      <div className="trend-button-header">
                        <span>{trend.testName}</span>
                        {trend.latestStatus && (
                          <span
                            className={`status-badge status-${trend.latestStatus.toLowerCase()}`}
                          >
                            {trend.latestStatus}
                          </span>
                        )}
                      </div>
                      {trend.latestValue && (
                        <div className="trend-button-value">
                          {trend.latestValue} {trend.trendData[0]?.unit || ''}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="trend-chart">
                {selectedTrend && selectedTrend.trendData && selectedTrend.trendData.length > 0 ? (
                  <>
                    <div className="trend-header">
                      <h2>{selectedTrend.testName} Trend</h2>
                      <div className="trend-meta">
                        <span className="trend-unit">{selectedTrend.trendData[0]?.unit || ''}</span>
                      </div>
                    </div>
                    <div className="card">
                      {selectedTrend.insight && (
                        <div className="insight-box">
                          <p>{selectedTrend.insight}</p>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={formatChartData(selectedTrend.trendData)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#475569"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="#475569"
                            style={{ fontSize: '12px' }}
                            label={{ value: `Value (${selectedTrend.trendData[0]?.unit || ''})`, angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#475569' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '8px'
                            }}
                            formatter={(value, name, props) => [
                              `${value} ${selectedTrend.trendData[0]?.unit || ''}`,
                              'Value'
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '10px' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#14b8a6"
                            strokeWidth={3}
                            dot={{ fill: '#14b8a6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name={`Value (${selectedTrend.trendData[0]?.unit || ''})`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="trend-info">
                        <p>
                          <strong>Trend Direction:</strong>{' '}
                          {selectedTrend.trendDirection}
                        </p>
                        <p>
                          <strong>Data Points:</strong>{' '}
                          {selectedTrend.trendData.length}
                        </p>
                      </div>
                    </div>
                  </>
                ) : selectedTrend ? (
                  <div className="card">
                    <div className="empty-state">
                      <p>
                        {selectedTrend.insight || 'No trend data available for this biomarker.'}
                      </p>
                      <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Upload more reports to see trends over time.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="loading">Select a biomarker to view trends</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trends;

