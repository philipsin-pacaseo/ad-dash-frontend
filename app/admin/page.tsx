"use client";

import { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ⚠️ 請務必確認此處填寫的是您的「後端 API」網址
const API_BASE_URL = 'https://addash.zeabur.app';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { tenant_id: tenantId, contact_email: email });
      if (response.data.status === 'success') {
        setIsAuthenticated(true);
        setCompanyName(response.data.company_name);
        fetchDashboardData(tenantId);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setLoginError(err.response.data.detail);
      } else {
        setLoginError('連線失敗，請檢查網路連線或伺服器狀態。');
      }
    }
    setLoginLoading(false);
  };

  const fetchDashboardData = async (id: string) => {
    setDataLoading(true);
    setDataError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/summary?tenant_id=${id}`);
      if (response.data.status === 'success') {
        setData(response.data);
      }
    } catch (err) {
      setDataError('讀取數據失敗，請稍後再試。');
    }
    setDataLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setData(null);
    setTenantId('');
    setEmail('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登入 Ad-Dash 數據中心</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Omni-Channel 跨平台廣告分析系統</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">客戶 ID (Tenant ID)</label>
                <div className="mt-1"><input type="text" required value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">授權信箱 (Contact Email)</label>
                <div className="mt-1"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /></div>
              </div>
              {loginError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors">
                {loginLoading ? '驗證中...' : '安全登入'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">歡迎回來，{companyName}</h1>
            <p className="text-gray-500 mt-1">Omni-Channel 跨平台廣告分析儀表板</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 w-full md:w-auto items-center">
            <button onClick={() => fetchDashboardData(tenantId)} disabled={dataLoading} className="text-blue-600 font-medium hover:text-blue-800 transition disabled:text-gray-400">
              {dataLoading ? '更新中...' : '重新整理'}
            </button>
            <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">登出</button>
          </div>
        </header>

        {dataError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{dataError}</div>}

        {data && (
          <>
            {/* 頂部數據卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="本月總花費 (MTD)" value={`$${data.metrics.MTD_spend.toLocaleString()}`} />
              <MetricCard title="本年總累積 (YTD)" value={`$${data.metrics.YTD_spend.toLocaleString()}`} />
              <MetricCard title="月增率 (MoM)" value={`${data.metrics.MoM_growth_percent}%`} isGrowth={true} trend={data.metrics.MoM_growth_percent >= 0 ? 'up' : 'down'} />
              <MetricCard title="年增率 (YoY)" value={`${data.metrics.YoY_growth_percent}%`} isGrowth={true} trend={data.metrics.YoY_growth_percent >= 0 ? 'up' : 'down'} />
            </div>

            {/* 平台佔比拆分卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Google Ads 本月花費</h3>
                  <span className="text-3xl font-bold text-gray-800">${data.platform_breakdown?.google?.toLocaleString() || 0}</span>
                </div>
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">G</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Meta Ads (FB/IG) 本月花費</h3>
                  <span className="text-3xl font-bold text-gray-800">${data.platform_breakdown?.meta?.toLocaleString() || 0}</span>
                </div>
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-2xl">M</div>
              </div>
            </div>

            {/* 跨平台趨勢圖 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">過去 30 天跨平台花費趨勢</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend_chart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    {/* 三條趨勢線：總計、Google、Meta */}
                    <Line type="monotone" name="總花費" dataKey="Total" stroke="#111827" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Google Ads" dataKey="Google" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" name="Meta Ads" dataKey="Meta" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, isGrowth, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        {isGrowth && (
          <span className={`text-sm font-semibold mb-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </div>
  );
}