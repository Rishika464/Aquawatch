import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaTint, FaUpload, FaChartLine, FaHistory, FaSignOutAlt, FaSync, FaFileExport, FaClock, FaBell } from 'react-icons/fa';
import DataUpload from './DataUpload';
import Results from './Results';

const Dashboard = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
    
    // Setup auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchStats, refreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 glass border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <FaTint className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-white font-bold">AquaWatch</h2>
              <p className="text-gray-400 text-xs">Water Quality Monitor</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/dashboard/upload" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition">
              <FaUpload /> Upload Data
            </Link>
            <Link to="/dashboard/results" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition">
              <FaChartLine /> Results
            </Link>
            <Link to="/dashboard/history" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition">
              <FaHistory /> History
            </Link>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-white text-sm font-medium">{user?.name}</div>
              <div className="text-gray-400 text-xs">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor and analyze water quality data</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <FaClock className="text-gray-400" />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="bg-transparent text-white text-sm outline-none"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1 rounded transition ${autoRefresh ? 'text-blue-500' : 'text-gray-400'}`}
              >
                <FaSync className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '2s' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Total Readings</div>
              <div className="text-3xl font-bold text-white">{stats.total_readings}</div>
              <div className="text-green-400 text-sm mt-2">+12% this month</div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Anomalies Detected</div>
              <div className="text-3xl font-bold text-yellow-400">{stats.anomalies_detected}</div>
              <div className="text-red-400 text-sm mt-2">Requires attention</div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Average DWSI</div>
              <div className="text-3xl font-bold text-blue-400">{stats.average_dwsi}</div>
              <div className="text-green-400 text-sm mt-2">Good quality</div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Active Stations</div>
              <div className="text-3xl font-bold text-white">{stats.active_stations}</div>
              <div className="text-gray-400 text-sm mt-2">Monitoring in real-time</div>
            </div>
          </div>
        )}

        {/* Routes */}
        <Routes>
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/" element={<DataUpload />} />
        </Routes>
      </div>
    </div>
  );
};

const HistoryView = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Analysis History</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="text-white font-medium">{item.filename}</div>
              <div className="text-gray-400 text-sm">{new Date(item.uploaded_at).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-white">{item.total_records} records</div>
              <div className="text-yellow-400 text-sm">{item.anomalies} anomalies</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;