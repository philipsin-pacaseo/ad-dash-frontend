"use client";

import { useState } from 'react';
import axios from 'axios';

// ⚠️ 請填寫您的「後端 API」網址
const API_BASE_URL = 'https://您的後端網址.zeabur.app'; 

export default function SuperAdminDashboard() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 新增租戶與使用者
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // V3: 綁定 GA4 與 GSC
  const [selectedTenantForGa, setSelectedTenantForGa] = useState('');
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [gscSiteUrl, setGscSiteUrl] = useState('');

  const handleError = (err: any, defaultMsg: string) => {
    setMessage(`❌ ${err.response?.data?.detail || err.message || defaultMsg}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/tenants?secret=${secret}`);
      if (res.data.status === 'success') { setIsAuthenticated(true); setTenants(res.data.tenants); }
    } catch (err) { handleError(err, '密碼錯誤'); }
    setLoading(false);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('建立中...');
    try {
      await axios.post(`${API_BASE_URL}/api/tenants?secret=${secret}`, { company_name: newCompanyName, contact_email: newContactEmail });
      setMessage(`✅ 建立成功！`); setNewCompanyName(''); setNewContactEmail(''); handleLogin({ preventDefault: () => {} } as React.FormEvent);
    } catch (err) { handleError(err, '建立客戶失敗'); }
  };

  // 綁定 GA4 並觸發抓取
  const handleBindGa4 = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('🔄 正在綁定並抓取 GA4 數據...');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/data/fetch-ga4?tenant_id=${selectedTenantForGa}&ga4_property_id=${ga4PropertyId}`);
      setMessage(`✅ ${res.data.message}`); setGa4PropertyId('');
    } catch (err) { handleError(err, 'GA4 綁定失敗'); }
  };

  // 綁定 GSC 並觸發抓取
  const handleBindGsc = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('🔄 正在綁定並抓取 GSC 數據...');
    try {
      // GSC 網址可能包含 https://，需編碼
      const res = await axios.post(`${API_BASE_URL}/api/data/fetch-gsc?tenant_id=${selectedTenantForGa}&gsc_site_url=${encodeURIComponent(gscSiteUrl)}`);
      setMessage(`✅ ${res.data.message}`); setGscSiteUrl('');
    } catch (err) { handleError(err, 'GSC 綁定失敗'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md"><h2 className="mt-6 text-center text-3xl font-extrabold">Super Admin 總部</h2></div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium">萬能鑰匙 (Secret)</label>
                <input type="password" required value={secret} onChange={(e) => setSecret(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500" />
              </div>
              {message && <div className="text-red-400 text-sm">{message}</div>}
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">{loading ? '驗證中...' : '解鎖系統'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SaaS 營運控制中心</h1>
            <p className="text-gray-500">全通路數據整合版 (Ads + GA4 + GSC)</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">鎖定後台</button>
        </header>

        {message && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg font-medium">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. 建立新客戶 (Tenant)</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <input type="text" placeholder="公司名稱" required value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
                <input type="email" placeholder="主要聯絡信箱" required value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium w-full">建立客戶</button>
              </form>
            </div>

            {/* V3 新增：GA4 與 GSC 綁定面板 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. 綁定流量與 SEO 數據源</h2>
              <div className="space-y-4">
                <select required value={selectedTenantForGa} onChange={(e) => setSelectedTenantForGa(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black bg-white">
                  <option value="" disabled>請選擇要綁定的客戶...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                </select>
                
                <form onSubmit={handleBindGa4} className="flex gap-2">
                  <input type="text" placeholder="GA4 Property ID (例如: 250123456)" required value={ga4PropertyId} onChange={(e) => setGa4PropertyId(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
                  <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap hover:bg-orange-600">綁定 GA4</button>
                </form>

                <form onSubmit={handleBindGsc} className="flex gap-2">
                  <input type="text" placeholder="GSC Site URL (例如: https://example.com/ 或 sc-domain:example.com)" required value={gscSiteUrl} onChange={(e) => setGscSiteUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
                  <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap hover:bg-teal-700">綁定 GSC</button>
                </form>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">全通路授權連結配發</h2>
            <div className="overflow-y-auto max-h-[600px]">
              {tenants.map(tenant => (
                <div key={tenant.id} className="border border-gray-200 bg-gray-50 p-4 rounded-xl mb-4">
                  <h3 className="font-bold text-lg text-gray-900">{tenant.company_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Tenant ID: <span className="font-mono text-xs bg-gray-200 p-1 rounded">{tenant.id}</span></p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-bold text-blue-700 mb-2">🔵 Google 生態系授權 (Ads+GA4+GSC)：</p>
                    <div className="flex gap-2 mb-4">
                      <input readOnly value={`${API_BASE_URL}/api/auth/google/login?tenant_id=${tenant.id}&secret=${secret}`} className="text-xs w-full px-2 py-1 border border-gray-300 rounded bg-white text-gray-600" />
                      <button onClick={() => navigator.clipboard.writeText(`${API_BASE_URL}/api/auth/google/login?tenant_id=${tenant.id}&secret=${secret}`)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">複製</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}