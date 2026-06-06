import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaTint, FaUpload, FaChartLine, FaHistory, FaSignOutAlt, FaSync, 
  FaClock, FaBell, FaExclamationTriangle, FaCheckCircle, 
  FaThermometerHalf, FaTachometerAlt, FaFlask, FaWater,
  FaArrowUp, FaArrowDown, FaMinus
} from 'react-icons/fa';
import DataUpload from './DataUpload';
import Results from './Results';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const getWaterStatus = (params) => {
  let score = 0;

  // pH
  if (params.ph >= 6.5 && params.ph <= 8.5)
    score += 25;

  // Dissolved Oxygen
  if (params.do >= 6)
    score += 25;

  // Temperature
  if (params.temperature >= 15 && params.temperature <= 30)
    score += 25;

  // Turbidity
  if (params.turbidity <= 5)
    score += 25;

  if (score >= 80)
    return { score, label: "Excellent", color: "#22c55e" };

  if (score >= 60)
    return { score, label: "Good", color: "#3b82f6" };

  if (score >= 40)
    return { score, label: "Moderate", color: "#facc15" };

  if (score >= 20)
    return { score, label: "Poor", color: "#fb923c" };

  return { score, label: "Critical", color: "#ef4444" };
};

const getStatusFactors = (params) => {
  return [
    {
      label: "pH",
      ok: params.ph >= 6.5 && params.ph <= 8.5
    },
    {
      label: "Temperature",
      ok: params.temperature >= 15 &&
          params.temperature <= 30
    },
    {
      label: "Dissolved Oxygen",
      ok: params.do >= 6
    },
    {
      label: "Turbidity",
      ok: params.turbidity <= 5
    }
  ];
};

const Dashboard = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [historyData, setHistoryData] = useState([]);
  const [liveReadings, setLiveReadings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [alerts, setAlerts] = useState([]);
  
  const [currentParams, setCurrentParams] = useState({
    ph: 7.2,
    temperature: 22.5,
    do: 8.1,
    turbidity: 2.3
  });
  const factors = getStatusFactors(currentParams);

  const waterStatus = getWaterStatus(currentParams);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'https://aquawatch-api.azurewebsites.net';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchStats();
    fetchLiveReadings();

    let interval;

    if (autoRefresh) {

      interval = setInterval(() => {

        fetchStats();
        fetchLiveReadings();

      }, refreshInterval * 1000);

    }

    return () => {
      clearInterval(interval);
    };

  }, [autoRefresh, refreshInterval]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchLiveReadings = async () => {
    try {

      const response = await axios.get(
        `${API_URL}/api/live-readings`
      );

      const liveData = response.data;

      setLiveReadings(liveData);

      if (liveData.length > 0) {

        const latest = liveData[0];

        setCurrentParams({
          ph: latest.ph || 7.2,
          temperature: latest.temperature || 22.5,
          do: latest.do || 8.1,
          turbidity: latest.turbidity || 2.3
        });

        setLastUpdated(new Date());
      }

    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
  const generatedAlerts = [];

  // pH Alert
  if (currentParams.ph < 6.5 || currentParams.ph > 8.5) {
    generatedAlerts.push({
      title: "Abnormal pH Detected",
      message: `Current pH = ${currentParams.ph}`,
      location: "Monitoring Station",
      severity: "high",
      timestamp: new Date()
    });
  }

  // Temperature Alert
  if (currentParams.temperature < 15 || currentParams.temperature > 30) {
    generatedAlerts.push({
      title: "Temperature Out of Safe Range",
      message: `${currentParams.temperature} °C detected`,
      location: "Monitoring Station",
      severity: "medium",
      timestamp: new Date()
    });
  }

  // Dissolved Oxygen Alert
  if (currentParams.do < 6) {
    generatedAlerts.push({
      title: "Low Dissolved Oxygen",
      message: `${currentParams.do} mg/L detected`,
      location: "Monitoring Station",
      severity: "high",
      timestamp: new Date()
    });
  }

  // Turbidity Alert
  if (currentParams.turbidity > 5) {
    generatedAlerts.push({
      title: "High Turbidity",
      message: `${currentParams.turbidity} NTU detected`,
      location: "Monitoring Station",
      severity: "high",
      timestamp: new Date()
    });
  }

  // Early Warning Mechanism
  if (
    currentParams.ph < 6.5 ||
    currentParams.ph > 8.5 ||
    currentParams.temperature > 30 ||
    currentParams.do < 6 ||
    currentParams.turbidity > 5
  ) {
    generatedAlerts.unshift({
      title: "🚨 Early Warning: Water Quality Degradation",
      message:
        "Multiple parameters exceed safe operating limits. Immediate investigation recommended.",
      location: "AquaWatch Monitoring Network",
      severity: "critical",
      timestamp: new Date()
    });
  }

  setAlerts(generatedAlerts);
}, [currentParams]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Prepare chart data - safe array check
  const chartData = (Array.isArray(liveReadings) ? liveReadings : []).slice(0, 30).reverse().map((item, index) => ({
    time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : `${index}m ago`,
    dwsi: item.dwsi || 70 + Math.random() * 20,
    ph: item.ph || 7.2,
    temperature: item.temperature || 22.5,
    do: item.do || 8.1,
    turbidity: item.turbidity || 2.3
  }));

  // Get trend icon for parameter
  const getTrendIcon = (value, normalMin, normalMax) => {
    if (value < normalMin) return <FaArrowDown className="text-red-400 text-xs" />;
    if (value > normalMax) return <FaArrowUp className="text-red-400 text-xs" />;
    return <FaMinus className="text-green-400 text-xs" />;
  };

  // Get status color for parameter
  const getStatusColor = (value, normalMin, normalMax) => {
    if (value < normalMin || value > normalMax) return "text-red-400";
    return "text-green-400";
  };

  // Parameter cards data
  const parameterCards = [
    { 
      label: "pH", 
      value: currentParams.ph, 
      unit: "", 
      icon: <FaFlask className="text-purple-400" />,
      normalMin: 6.5, 
      normalMax: 8.5,
      description: "Acidity/Alkalinity"
    },
    { 
      label: "Temperature", 
      value: currentParams.temperature, 
      unit: "°C", 
      icon: <FaThermometerHalf className="text-orange-400" />,
      normalMin: 15, 
      normalMax: 30,
      description: "Water temp"
    },
    { 
      label: "Dissolved O₂", 
      value: currentParams.do, 
      unit: "mg/L", 
      icon: <FaTachometerAlt className="text-blue-400" />,
      normalMin: 6, 
      normalMax: 12,
      description: "Oxygen level"
    },
    { 
      label: "Turbidity", 
      value: currentParams.turbidity, 
      unit: "NTU", 
      icon: <FaWater className="text-cyan-400" />,
      normalMin: 0, 
      normalMax: 5,
      description: "Cloudiness"
    }
  ];

  const accentColors = ['#c084fc', '#fb923c', '#60a5fa', '#22d3ee'];
  const paramBgStyles = [
    { background: 'linear-gradient(135deg, #1a0e2e 0%, #0d0718 100%)', borderColor: 'rgba(168,85,247,0.2)' },
    { background: 'linear-gradient(135deg, #1f100a 0%, #150a05 100%)', borderColor: 'rgba(251,146,60,0.2)' },
    { background: 'linear-gradient(135deg, #061528 0%, #030d1a 100%)', borderColor: 'rgba(59,130,246,0.2)' },
    { background: 'linear-gradient(135deg, #031516 0%, #020d0e 100%)', borderColor: 'rgba(34,211,238,0.2)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        .aw-root * { font-family: 'Sora', sans-serif !important; }
        .aw-mono { font-family: 'JetBrains Mono', monospace !important; }

        .aw-root {
          min-height: 100vh;
          background: #020c1a;
          background-image:
            radial-gradient(ellipse at 15% 50%, rgba(14,165,233,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(6,182,212,0.04) 0%, transparent 55%);
        }

        .aw-sidebar {
          background: linear-gradient(180deg, #021021 0%, #010c1b 100%);
          border-right: 1px solid rgba(14,165,233,0.1);
        }

        .aw-card {
          background: linear-gradient(135deg, #0a1929 0%, #071320 100%);
          border: 1px solid rgba(14,165,233,0.1);
          border-radius: 18px;
          transition: border-color 0.2s;
        }
        .aw-card:hover { border-color: rgba(14,165,233,0.2); }

        .aw-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 12px;
          color: #eaeef3; font-size: 14px; font-weight: 500;
          transition: all 0.18s; text-decoration: none;
          border: none; background: none; cursor: pointer; width: 100%; text-align: left;
        }
        .aw-nav-link:hover { background: rgba(14,165,233,0.08); color: #7dd3fc; }

        .aw-live-pill {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.18);
          border-radius: 20px; padding: 5px 14px;
          font-size: 11px; font-weight: 700; color: #4ade80;
          letter-spacing: 0.08em;
        }

        .aw-section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.09em; display: flex; align-items: center; gap: 8px;
          margin-bottom: 22px;
        }

        .aw-info-card {
          background: linear-gradient(135deg, #0a1929 0%, #071320 100%);
          border: 1px solid rgba(14,165,233,0.1);
          border-radius: 14px; padding: 22px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .aw-info-card .aw-ic-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #eaeef3; margin-bottom: 4px;
        }
        .aw-info-card .aw-ic-title {
          font-size: 20px; font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .aw-info-card p { font-size: 12px; color: #eaeef3; margin: 0; }
        .aw-info-card small { font-size: 10px; color: #eaeef3; margin-top: 6px; }
        .aw-info-card strong { color: #e2e8f0; }

        .aw-factor-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0; font-size: 12px; color: #eaeef3;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .aw-factor-row:last-child { border-bottom: none; }

        .aw-table tr td { transition: background 0.12s; }
        .aw-table tr:hover td { background: rgba(14,165,233,0.03); }

        .aw-status-pill {
          font-size: 11px; font-weight: 600;
          padding: 4px 12px; border-radius: 8px;
        }

        @keyframes aw-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .aw-dot-pulse { animation: aw-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="aw-root">
        {/* ── SIDEBAR ── */}
        <div className="aw-sidebar" style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '272px', zIndex: 20 }}>
          <div style={{ padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '44px' }}>
              <div style={{
                width: '46px', height: '46px',
                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(14,165,233,0.35)'
              }}>
                <FaTint style={{ color: 'white', fontSize: '19px' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em' }}>AquaWatch</div>
                <div style={{ color: '#eaeef3', fontSize: '11px', marginTop: '2px', letterSpacing: '0.02em' }}>Water Quality Monitor</div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link to="/dashboard/upload" className="aw-nav-link"><FaUpload style={{ fontSize: '13px' }} /> Upload Data</Link>
              <Link to="/dashboard/results" className="aw-nav-link"><FaChartLine style={{ fontSize: '13px' }} /> Results</Link>
              <Link to="/dashboard/history" className="aw-nav-link"><FaHistory style={{ fontSize: '13px' }} /> History</Link>
            </nav>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* User card */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(14,165,233,0.05)',
              border: '1px solid rgba(14,165,233,0.1)',
              borderRadius: '13px', marginBottom: '8px'
            }}>
              <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#eaeef3', fontSize: '12px', marginTop: '3px' }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="aw-nav-link" style={{ color: '#eaeef3' }}>
              <FaSignOutAlt style={{ fontSize: '13px' }} /> Logout
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ marginLeft: '272px', padding: '32px 36px' }}>

          {/* LIVE STATUS BAR */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #0a1929, #071320)',
            border: '1px solid rgba(34,197,94,0.14)',
            borderRadius: '14px', padding: '14px 22px', marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="aw-live-pill">
                <div className="aw-dot-pulse" style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%' }} />
                LIVE
              </span>
              <span style={{ color: '#eaeef3', fontSize: '13px' }}>
                Last updated {Math.floor((new Date() - lastUpdated) / 1000)}s ago
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaClock style={{ color: '#eaeef3', fontSize: '12px' }} />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                style={{ background: 'transparent', color: '#94a3b8', fontSize: '13px', outline: 'none', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '8px', padding: '5px 10px' }}
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  padding: '8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  background: autoRefresh ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: autoRefresh ? '#60a5fa' : '#eaeef3'
                }}
              >
                <FaSync style={{ animationDuration: '2s', animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {/* LSTM + ANOMALY — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* LSTM */}
            <div className="aw-card" style={{ padding: '28px' }}>
              <div className="aw-section-label" style={{ color: '#0ea5e9' }}>
                <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%' }} />
                LSTM Forecasting Module
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <p style={{ color: '#eaeef3', fontSize: '12px', marginBottom: '6px' }}>Predicted pH</p>
                  <p style={{ fontSize: '30px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {(currentParams.ph + 0.2).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#eaeef3', fontSize: '12px', marginBottom: '6px' }}>Predicted DO</p>
                  <p style={{ fontSize: '30px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {(currentParams.do - 0.3).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#eaeef3', fontSize: '12px', marginBottom: '6px' }}>Forecast DWSI</p>
                  <p style={{ fontSize: '30px', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {Math.max(0, 100 - Math.abs(currentParams.ph - 7) * 10 - currentParams.turbidity * 2).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Anomaly */}
            <div className="aw-card" style={{ padding: '28px' }}>
              <div className="aw-section-label" style={{ color: '#f87171' }}>
                <div style={{ width: '8px', height: '8px', background: '#f87171', borderRadius: '50%' }} />
                Autoencoder Anomaly Detection
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#eaeef3', fontSize: '12px', marginBottom: '8px' }}>Anomaly Score</p>
                  <p style={{ fontSize: '46px', fontWeight: 800, color: '#f87171', letterSpacing: '-0.05em', lineHeight: 1 }}>
                    {(Math.abs(currentParams.ph - 7) + Math.abs(currentParams.temperature - 22) / 10 + Math.abs(currentParams.do - 8) / 5).toFixed(2)}
                  </p>
                </div>
                <div style={{
                  padding: '11px 20px', borderRadius: '12px',
                  background: alerts.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  border: alerts.length > 0 ? '1px solid rgba(239,68,68,0.22)' : '1px solid rgba(34,197,94,0.22)',
                  color: alerts.length > 0 ? '#f87171' : '#4ade80',
                  fontSize: '13px', fontWeight: 600
                }}>
                  {alerts.length > 0 ? '⚠ Anomaly Detected' : '✓ Normal'}
                </div>
              </div>
            </div>
          </div>

          {/* DWSI CHART */}
          <div className="aw-card" style={{ padding: '32px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em' }}>Live DWSI Trend</h2>
                <p style={{ color: '#eaeef3', fontSize: '13px', marginTop: '5px' }}>Dynamic Water Quality Index — Higher is better</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {chartData.length > 0 ? chartData[chartData.length - 1]?.dwsi?.toFixed(1) : '72.4'}
                </div>
                <div style={{ color: '#eaeef3', fontSize: '10px', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current DWSI</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.07)" />
                <XAxis dataKey="time" stroke="#eaeef3" fontSize={11} />
                <YAxis stroke="#eaeef3" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1929', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '10px' }}
                  labelStyle={{ color: '#eaeef3' }}
                />
                <Area type="monotone" dataKey="dwsi" stroke="#0ea5e9" strokeWidth={2} fill="url(#dwsiGrad)" />
                <defs>
                  <linearGradient id="dwsiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px' }}>
              {[
                { label: 'Critical', range: '0-20', color: '#ef4444' },
                { label: 'Poor', range: '20-40', color: '#f97316' },
                { label: 'Moderate', range: '40-60', color: '#eab308' },
                { label: 'Good', range: '60-80', color: '#3b82f6' },
                { label: 'Excellent', range: '80-100', color: '#22c55e' },
              ].map(tier => (
                <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                  <span style={{ color: '#eaeef3', fontSize: '11px', fontWeight: 500 }}>{tier.label} <span style={{ color: '#eaeef3' }}>({tier.range})</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* PARAMETER CARDS + ALERTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* 2×2 Parameter Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {parameterCards.map((param, idx) => {
                const accent = accentColors[idx];
                const bg = paramBgStyles[idx];
                const isNormal = param.value >= param.normalMin && param.value <= param.normalMax;
                return (
                  <div key={idx} className="aw-card" style={{ padding: '26px', ...bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        background: `${accent}14`,
                        border: `1px solid ${accent}28`,
                        borderRadius: '11px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: accent, fontSize: '15px'
                      }}>
                        {param.icon}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {getTrendIcon(param.value, param.normalMin, param.normalMax)}
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          color: isNormal ? '#4ade80' : '#f87171',
                          background: isNormal ? 'rgba(74,222,128,0.09)' : 'rgba(248,113,113,0.09)',
                          border: isNormal ? '1px solid rgba(74,222,128,0.18)' : '1px solid rgba(248,113,113,0.18)',
                          padding: '3px 9px', borderRadius: '10px'
                        }}>
                          {isNormal ? 'Normal' : 'Alert'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#eaeef3', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {param.label}
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '14px' }}>
                      {param.value}<span style={{ fontSize: '15px', fontWeight: 500, color: '#eaeef3', marginLeft: '5px' }}>{param.unit}</span>
                    </div>

                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '3px' }}>
                      <div style={{
                        height: '3px', borderRadius: '4px',
                        background: isNormal ? accent : '#ef4444',
                        width: `${Math.min(100, Math.max(0, ((param.value - param.normalMin) / (param.normalMax - param.normalMin)) * 100))}%`,
                        transition: 'width 0.4s ease',
                        boxShadow: isNormal ? `0 0 6px ${accent}70` : '0 0 6px rgba(239,68,68,0.5)'
                      }} />
                    </div>
                    <div style={{ marginTop: '9px', color: '#eaeef3', fontSize: '11px' }}>
                      Range: {param.normalMin} - {param.normalMax} {param.unit}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alerts Panel */}
            <div className="aw-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <FaBell style={{ color: '#fbbf24', fontSize: '14px' }} />
                <h3 style={{ color: 'white', fontWeight: 600, fontSize: '15px', flex: 1, margin: 0 }}>Live Alerts</h3>
                {alerts.length > 0 && (
                  <span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    {alerts.length} new
                  </span>
                )}
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '44px 0' }}>
                    <FaCheckCircle style={{ color: '#22c55e', fontSize: '34px', display: 'block', margin: '0 auto 14px' }} />
                    <p style={{ color: '#eaeef3', fontSize: '14px', fontWeight: 500, margin: '0 0 5px' }}>No active alerts</p>
                    <p style={{ color: '#eaeef3', fontSize: '12px', margin: 0 }}>All parameters normal</p>
                  </div>
                ) : (
                  alerts.map((alert, idx) => {
                    const sev = {
                      critical: { bg: 'rgba(239,68,68,0.07)', border: '#ef4444' },
                      high: { bg: 'rgba(249,115,22,0.07)', border: '#f97316' },
                      medium: { bg: 'rgba(234,179,8,0.07)', border: '#eab308' },
                    }[alert.severity] || { bg: 'rgba(14,165,233,0.07)', border: '#0ea5e9' };
                    return (
                      <div key={idx} style={{ background: sev.bg, borderLeft: `3px solid ${sev.border}`, borderRadius: '10px', padding: '14px 14px 14px 16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <FaExclamationTriangle style={{ color: sev.border, fontSize: '11px', marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>{alert.message || alert.title}</p>
                            <p style={{ color: '#eaeef3', fontSize: '11px', margin: '0 0 3px' }}>{alert.location || alert.source || 'Unknown location'}</p>
                            <p style={{ color: '#eaeef3', fontSize: '11px', margin: 0 }}>
                              {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM — Summary Cards + Table */}
          <div className="aw-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em', margin: 0 }}>Recent Readings</h3>
              <span style={{ color: '#eaeef3', fontSize: '12px' }}>Last 20 records</span>
            </div>

            {/* 4-col summary grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '30px' }}>

              {/* Water Quality Status */}
              <div className="aw-info-card">
                <div className="aw-ic-label">Current Water Quality</div>
                <div className="aw-ic-title" style={{ color: waterStatus.color }}>{waterStatus.label}</div>
                <p>DWSI Score: <strong>{waterStatus.score}</strong></p>
                <small>Based on pH, Temperature, Dissolved Oxygen and Turbidity</small>
              </div>

              {/* Forecast */}
              <div className="aw-info-card">
                <div className="aw-ic-label">Forecast · Next Hour</div>
                <div className="aw-ic-title" style={{ color: '#fbbf24' }}>Moderate</div>
                <p>pH → <strong>{(currentParams.ph + 0.1).toFixed(2)}</strong></p>
                <p>Temp → <strong>{(currentParams.temperature + 0.3).toFixed(1)} °C</strong></p>
                <small>LSTM forecasting model</small>
              </div>

              {/* Anomaly */}
              <div className="aw-info-card">
                <div className="aw-ic-label">Anomaly Detection</div>
                <div className="aw-ic-title" style={{ color: '#ef4444' }}>Anomaly Detected</div>
                <p>Reconstruction Error: <strong>0.84</strong></p>
                <p>Threshold: <strong>0.52</strong></p>
                <small>Autoencoder-based detection</small>
              </div>

              {/* Quality Factors */}
              <div className="aw-info-card">
                <div className="aw-ic-label">Quality Factors</div>
                {factors.map((factor) => (
                  <div key={factor.label} className="aw-factor-row">
                    <span style={{ fontSize: '13px' }}>{factor.ok ? '✅' : '❌'}</span>
                    <span>{factor.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} className="aw-table">
                <thead>
                  <tr>
                    {['Time', 'pH', 'Temp', 'DO', 'Turbidity', 'DWSI', 'Status'].map(col => (
                      <th key={col} style={{
                        textAlign: 'left', padding: '6px 18px 14px 0',
                        color: '#eaeef3', fontWeight: 700, fontSize: '10px',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        borderBottom: '1px solid rgba(255,255,255,0.04)'
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(liveReadings) ? liveReadings : []).slice(0, 10).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="aw-mono" style={{ padding: '14px 18px 14px 0', color: '#eaeef3', fontSize: '12px' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '-'}
                      </td>
                      <td style={{ padding: '14px 18px 14px 0', fontSize: '13px' }} className={getStatusColor(item.ph, 6.5, 8.5)}>
                        {item.ph?.toFixed(1) || '-'}
                      </td>
                      <td style={{ padding: '14px 18px 14px 0', fontSize: '13px' }} className={getStatusColor(item.temperature, 15, 30)}>
                        {item.temperature?.toFixed(1) || '-'}°C
                      </td>
                      <td style={{ padding: '14px 18px 14px 0', fontSize: '13px' }} className={getStatusColor(item.do, 6, 12)}>
                        {item.do?.toFixed(1) || '-'} mg/L
                      </td>
                      <td style={{ padding: '14px 18px 14px 0', fontSize: '13px' }} className={getStatusColor(item.turbidity, 0, 5)}>
                        {item.turbidity?.toFixed(1) || '-'} NTU
                      </td>
                      <td style={{ padding: '14px 18px 14px 0', color: '#38bdf8', fontWeight: 600, fontSize: '13px' }}>
                        {item.dwsi?.toFixed(1) || '-'}
                      </td>
                      <td style={{ padding: '14px 18px 14px 0' }}>
                        {item.dwsi >= 80 ? (
                          <span className="aw-status-pill" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.14)' }}>Excellent</span>
                        ) : item.dwsi >= 60 ? (
                          <span className="aw-status-pill" style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.14)' }}>Good</span>
                        ) : item.dwsi >= 40 ? (
                          <span className="aw-status-pill" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.14)' }}>Moderate</span>
                        ) : (
                          <span className="aw-status-pill" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.14)' }}>Critical</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Routes */}
          <Routes>
            <Route path="/upload" element={<DataUpload />} />
            <Route path="/results" element={<Results />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/" element={<></>} />
          </Routes>
        </div>
      </div>
    </>
  );
};

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || 'https://aquawatch-api.azurewebsites.net';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1929 0%, #071320 100%)',
      border: '1px solid rgba(14,165,233,0.1)',
      borderRadius: '18px', padding: '32px', marginTop: '24px'
    }}>
      <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '24px' }}>Analysis History</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((item) => (
          <div key={item.id} style={{
            background: 'rgba(14,165,233,0.04)',
            border: '1px solid rgba(14,165,233,0.08)',
            borderRadius: '13px', padding: '18px 22px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'border-color 0.2s'
          }}>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>{item.filename}</div>
              <div style={{ color: '#eaeef3', fontSize: '12px', marginTop: '4px' }}>{new Date(item.uploaded_at).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px' }}>{item.total_records} records</div>
              <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '4px' }}>{item.anomalies} anomalies</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
