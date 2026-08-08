"use client";

import { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ⚠️ 請填寫您的「後端 API」網址
const API_BASE_URL = 'https://您的後端網址.zeabur.app';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { tenant_id: tenantId, contact_email: email });
      if (response.data.status === 'success') {
        setIsAuthenticated(true); setCompanyName(response.data.company_name); fetchDashboardData(tenantId);
      }
    } catch (err: any) { setLoginError('登入失敗，請檢查權限與連線。'); }
    setLoginLoading(false);
  };

  const fetchDashboardData = async (id: string) => {
    setDataLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/summary?tenant_id=${id}`);
      if (response.data.status === 'success') setData(response.data);
    } catch (err) { console.error(err); }
    setDataLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登入 Ad-Dash 數據中心</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div><label className="block text-sm font-medium text-gray-700">客戶 ID (Tenant ID)</label><input type="text" required value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black" /></div>
              <div><label className="block text-sm font-medium text-gray-700">授權信箱</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black" /></div>
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700">{loginLoading ? '驗證中...' : '安全登入'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <div><h1 className="text-3xl font-bold text-gray-800">歡迎回來，{companyName}</h1><p className="text-gray-500">全通路行銷分析儀表板</p></div>
          <button onClick={() => setIsAuthenticated(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">登出</button>
        </header>

        {data && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">💰 廣告花費與轉換</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard title="本月花費 (MTD)" value={`$${data.metrics?.MTD_spend?.toLocaleString()}`} />
              <MetricCard title="本年累積 (YTD)" value={`$${data.metrics?.YTD_spend?.toLocaleString()}`} />
              <MetricCard title="Google Ads 佔比" value={`$${data.platform_breakdown?.google?.toLocaleString()}`} icon="G" color="blue" />
              <MetricCard title="Meta Ads 佔比" value={`$${data.platform_breakdown?.meta?.toLocaleString()}`} icon="M" color="indigo" />
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4 mt-8">📈 網站流量與 SEO 表現 (近 30 天)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard title="GA4 總工作階段 (Sessions)" value={data.traffic?.sessions?.toLocaleString()} />
              <MetricCard title="GA4 網頁瀏覽量 (Views)" value={data.traffic?.page_views?.toLocaleString()} />
              <MetricCard title="GSC 搜尋曝光 (Impressions)" value={data.seo?.impressions?.toLocaleString()} />
              <MetricCard title="GSC 搜尋點擊 (Clicks)" value={data.seo?.clicks?.toLocaleString()} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div><h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3><span className="text-2xl font-bold text-gray-800">{value}</span></div>
      {icon && <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl bg-${color}-100 text-${color}-600`}>{icon}</div>}
    </div>
  );
}