import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import './Trends.css';

const Trends = () => {
  const { user, logout } = useAuth();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const trendsData = await apiService.getAllTrends();
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (trendData) => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: parseFloat(point.value),
      status: point.status
    }));
  };

  const parseReferenceRange = (rangeStr) => {
    if (!rangeStr) return { min: 0, max: 100 };
    const cleaned = rangeStr.trim();
    const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2])
      };
    }
    return { min: 0, max: 100 };
  };

  const calculatePercentageChange = (trendData) => {
    if (!trendData || trendData.length < 2) return 0;
    const first = parseFloat(trendData[0].value);
    const last = parseFloat(trendData[trendData.length - 1].value);
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  };

  const getTrendDirection = (percentageChange) => {
    if (percentageChange > 5) return { direction: 'up', color: '#ef4444', icon: '📈' };
    if (percentageChange < -5) return { direction: 'down', color: '#10b981', icon: '📉' };
    return { direction: 'stable', color: '#6b7280', icon: '➡️' };
  };

  const getTrendMessage = (trend, percentageChange) => {
    const range = parseReferenceRange(trend.referenceRange);
    const latestValue = trend.trendData && trend.trendData.length > 0 
      ? parseFloat(trend.trendData[trend.trendData.length - 1].value) 
      : 0;
    
    if (latestValue < range.min) {
      return 'This biomarker needs attention. Consider consulting your healthcare provider.';
    }
    if (latestValue > range.max) {
      return 'This biomarker needs attention. Consider consulting your healthcare provider.';
    }
    if (Math.abs(percentageChange) < 5) {
      return 'Your levels are within the healthy range.';
    }
    if (percentageChange > 0) {
      return 'Trending in the right direction. Continue with your current health plan.';
    }
    return 'This biomarker needs attention. Consider consulting your healthcare provider.';
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

  // Display top 4 trends in a grid
  const displayTrends = trends.slice(0, 4);

  return (
    <div className="trends-page">
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="page-header-trends">
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
          <div className="trends-grid">
            {displayTrends.map((trend) => {
              const chartData = formatChartData(trend.trendData);
              const range = parseReferenceRange(trend.referenceRange);
              const percentageChange = calculatePercentageChange(trend.trendData);
              const trendInfo = getTrendDirection(percentageChange);
              const trendMessage = getTrendMessage(trend, percentageChange);
              const unit = trend.trendData && trend.trendData.length > 0 
                ? trend.trendData[0].unit || '' 
                : '';

              // Calculate Y-axis domain
              const values = chartData.map(d => d.value);
              const minValue = Math.min(...values, range.min) * 0.9;
              const maxValue = Math.max(...values, range.max) * 1.1;

              return (
                <div key={trend.testName} className="trend-card">
                  <div className="trend-card-header">
                    <h3 className="trend-title">{trend.testName}</h3>
                    <div className="trend-indicator">
                      <span className="trend-arrow" style={{ color: trendInfo.color }}>
                        {trendInfo.icon}
                      </span>
                      <span className="trend-percentage" style={{ color: trendInfo.color }}>
                        {Math.abs(percentageChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="trend-reference">
                    Reference Range: {trend.referenceRange || 'N/A'}
                  </div>
                  {chartData.length > 0 ? (
                    <>
                      <div className="trend-chart-container">
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              tick={{ fill: '#6b7280' }}
                            />
                            <YAxis 
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              tick={{ fill: '#6b7280' }}
                              domain={[minValue, maxValue]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '6px',
                                fontSize: '12px'
                              }}
                              formatter={(value) => [`${value.toFixed(2)} ${unit}`, 'Value']}
                            />
                            <ReferenceArea 
                              y1={range.min} 
                              y2={range.max} 
                              fill="#d1fae5" 
                              fillOpacity={0.3}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#3b82f6"
                              strokeWidth={2.5}
                              dot={{ 
                                fill: chartData[chartData.length - 1]?.status === 'NORMAL' ? '#10b981' : '#ef4444',
                                r: 4,
                                strokeWidth: 2,
                                stroke: '#fff'
                              }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="trend-message">
                        {trendMessage}
                      </div>
                    </>
                  ) : (
                    <div className="trend-no-data">
                      <p>No trend data available for this biomarker.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trends;
