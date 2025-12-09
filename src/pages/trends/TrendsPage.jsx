import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tabs,
  Tab,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { getTrendsData } from '../../core/apis/trendsAPI';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('current_year');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    revenue: [],
    orders: [],
    customers: [],
  });

  const fetchTrendsData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTrendsData(timeRange);
      if (result.error) {
        toast.error('Failed to fetch trends data');
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      toast.error('Failed to fetch trends data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchTrendsData();
  }, [fetchTrendsData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Revenue Chart Data
  const revenueChartData = {
    labels: data.revenue.map(item => item.month),
    datasets: [
      {
        label: 'Revenue (EUR)',
        data: data.revenue.map(item => item.revenue),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Orders Chart Data
  const ordersChartData = {
    labels: data.orders.map(item => item.month),
    datasets: [
      {
        label: 'Successful',
        data: data.orders.map(item => item.successful),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      },
      {
        label: 'Pending',
        data: data.orders.map(item => item.pending),
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
      },
      {
        label: 'Total',
        data: data.orders.map(item => item.total),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
      },
    ],
  };

  // Customers Chart Data
  const customersChartData = {
    labels: data.customers.map(item => item.month),
    datasets: [
      {
        label: 'New Customers',
        data: data.customers.map(item => item.count),
        borderColor: 'rgb(245, 87, 108)',
        backgroundColor: 'rgba(245, 87, 108, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const calculateTotal = (dataArray, key) => {
    return dataArray.reduce((sum, item) => sum + (item[key] || 0), 0);
  };

  const formatGrowth = (growth, isRevenue = false) => {
    if (!growth) return '-';
    const abs = isRevenue ? `€${Math.abs(growth.absolute).toFixed(2)}` : Math.abs(growth.absolute);
    const pct = growth.percentage.toFixed(1);
    const color = growth.absolute >= 0 ? '#2e7d32' : '#c62828';
    const icon = growth.absolute >= 0 ? '📈' : '📉';
    return (
      <span style={{ color, fontWeight: 600 }}>
        {icon} {growth.absolute >= 0 ? '+' : '-'}{abs} ({growth.absolute >= 0 ? '+' : '-'}{pct}%)
      </span>
    );
  };

  return (
    <Card className="page-card">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          📈 Business Trends
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          aria-label="time range"
          size="small"
        >
          <ToggleButton value="current_year" aria-label="current year">
            Current Year
          </ToggleButton>
          <ToggleButton value="all_time" aria-label="all time">
            All Time
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Revenue Trends" />
        <Tab label="Orders Analysis" />
        <Tab label="Customer Growth" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Revenue Tab */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ height: 400, mb: 4 }}>
                <Line data={revenueChartData} options={chartOptions} />
              </Box>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Revenue (EUR)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Year</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.revenue.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">€{row.revenue.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {row.lastYear ? `€${row.lastYear.revenue.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {row.growth ? formatGrowth(row.growth.revenue, true) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        €{calculateTotal(data.revenue, 'revenue').toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Orders Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ height: 400, mb: 4 }}>
                <Bar data={ordersChartData} options={chartOptions} />
              </Box>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Successful</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>vs Last Year</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pending</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>vs Last Year</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>vs Last Year</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.orders.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{row.successful}</TableCell>
                        <TableCell align="right">
                          {row.growth ? formatGrowth(row.growth.successful) : '-'}
                        </TableCell>
                        <TableCell align="right">{row.pending}</TableCell>
                        <TableCell align="right">
                          {row.growth ? formatGrowth(row.growth.pending) : '-'}
                        </TableCell>
                        <TableCell align="right">{row.total}</TableCell>
                        <TableCell align="right">
                          {row.growth ? formatGrowth(row.growth.total) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {calculateTotal(data.orders, 'successful')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {calculateTotal(data.orders, 'pending')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {calculateTotal(data.orders, 'total')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Customers Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ height: 400, mb: 4 }}>
                <Line data={customersChartData} options={chartOptions} />
              </Box>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>New Customers</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Year</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.customers.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">
                          {row.lastYear ? row.lastYear.count : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {row.growth ? formatGrowth(row.growth.count) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {calculateTotal(data.customers, 'count')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

export default TrendsPage;
