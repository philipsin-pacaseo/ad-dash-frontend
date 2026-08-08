"use client";

import { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  // 登入表單狀態
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 儀表板數據狀態
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // 處理登入驗證
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await axios.post('https://addash.zeabur.app/api/auth/login', {
        tenant_id: tenantId,
        contact_email: email
      });

      if (response.data.status === 'success') {
        setIsAuthenticated(true);
        setCompanyName(response.data.company_name);
        // 登入成功後自動抓取儀表板數據
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

  // 抓取儀表板數據 (🔧 已在此處修正 TypeScript 的 string 型別)
  const fetchDashboardData = async (id: string) => {
    setDataLoading(true);
    setDataError('');
    try {
      const response = await axios.get(`https://addash.zeabur.app/api/dashboard/summary?tenant_id=${id}`);
      if (response.data.status === 'success') {
        setData(response.data);
      }
    } catch (err) {
      setDataError('讀取數據失敗，請稍後再試。');
    }
    setDataLoading(false);
  };

  // 登出功能
  const handleLogout = () => {
    setIsAuthenticated(false);
    setData(null);
    setTenantId('');
    setEmail('');
  };

  // ==========================================
  // UI 1：登入畫面
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登入 Ad-Dash 數據中心
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            請輸入您的專屬客戶 ID 與註冊信箱
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">客戶 ID (Tenant ID)</label>
                <div className="mt-1">
                  <input type="text" required value={tenantId} onChange={(e) => setTenantId(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">註冊信箱 (Contact Email)</label>
                <div className="mt-1">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" 
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{loginError}</div>
              )}

              <div>
                <button type="submit" disabled={loginLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors">
                  {loginLoading ? '驗證中...' : '安全登入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI 2：儀表板畫面 (已登入狀態)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">歡迎回來，{companyName}</h1>
            <p className="text-gray-500 mt-1">跨平台廣告成效分析儀表板</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 w-full md:w-auto items-center">
             <button 
              onClick={() => fetchDashboardData(tenantId)}
              disabled={dataLoading}
              className="text-blue-600 font-medium hover:text-blue-800 transition disabled:text-gray-400"
            >
              {dataLoading ? '更新中...' : '重新整理'}
            </button>
            <button 
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300"
            >
              登出
            </button>
          </div>
        </header>

        {dataError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{dataError}</div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="本月花費 (MTD)" value={`$${data.metrics.MTD_spend.toLocaleString()}`} />
              <MetricCard title="本年累積 (YTD)" value={`$${data.metrics.YTD_spend.toLocaleString()}`} />
              <MetricCard 
                title="月增率 (MoM)" 
                value={`${data.metrics.MoM_growth_percent}%`} 
                isGrowth={true} trend={data.metrics.MoM_growth_percent >= 0 ? 'up' : 'down'}
              />
              <MetricCard 
                title="年增率 (YoY)" 
                value={`${data.metrics.YoY_growth_percent}%`} 
                isGrowth={true} trend={data.metrics.YoY_growth_percent >= 0 ? 'up' : 'down'}
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">過去 30 天花費趨勢圖</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend_chart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`$${value}`, '花費']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="spend" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
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