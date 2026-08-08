"use client";

import { useState } from 'react';
import axios from 'axios';

// ⚠️ 請務必確認此處填寫的是您的「後端 API」網址，而不是前端網址
const API_BASE_URL = 'https://addash.zeabur.app'; 

export default function SuperAdminDashboard() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 表單狀態
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // 輔助錯誤處理函數，顯示最真實的錯誤
  const handleError = (err: any, defaultMsg: string) => {
    if (err.response && err.response.data && err.response.data.detail) {
      setMessage(`❌ 錯誤: ${err.response.data.detail}`);
    } else {
      setMessage(`❌ ${defaultMsg}: ${err.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/tenants?secret=${secret}`);
      if (res.data.status === 'success') {
        setIsAuthenticated(true);
        setTenants(res.data.tenants);
      }
    } catch (err) {
      handleError(err, '密碼錯誤或無法連線至後端伺服器');
    }
    setLoading(false);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('建立中...');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/tenants?secret=${secret}`, {
        company_name: newCompanyName,
        contact_email: newContactEmail
      });
      setMessage(`✅ 建立成功！客戶 ID: ${res.data.tenant_id}`);
      setNewCompanyName('');
      setNewContactEmail('');
      handleLogin({ preventDefault: () => {} } as React.FormEvent);
    } catch (err) {
      handleError(err, '建立客戶失敗');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('新增中...');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/users?secret=${secret}`, {
        tenant_id: selectedTenantId,
        email: newUserEmail
      });
      setMessage(`✅ ${res.data.message}`);
      setNewUserEmail('');
    } catch (err) {
      handleError(err, '新增使用者失敗');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Super Admin 總部</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium">萬能鑰匙 (Secret)</label>
                <div className="mt-1">
                  <input type="password" required value={secret} onChange={(e) => setSecret(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              {message && <div className="text-red-400 text-sm">{message}</div>}
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                {loading ? '驗證中...' : '解鎖系統'}
              </button>
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
            <p className="text-gray-500">Super Admin Dashboard</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">鎖定後台</button>
        </header>

        {message && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg font-medium">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. 建立新客戶 (Tenant)</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <input type="text" placeholder="公司名稱 (如：Nike Taiwan)" required value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black" />
                <input type="email" placeholder="主要聯絡信箱 (預設登入帳號)" required value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black" />
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium w-full">建立客戶</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. 為既有客戶新增 User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <select required value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black bg-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>請選擇要加入的客戶...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.company_name}</option>
                  ))}
                </select>
                <input type="email" placeholder="新增的使用者 Email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black" />
                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium w-full">加入使用者</button>
              </form>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">目前的客戶名單與授權</h2>
            <div className="overflow-y-auto max-h-[600px]">
              {tenants.map(tenant => (
                <div key={tenant.id} className="border border-gray-100 bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-lg text-gray-900">{tenant.company_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Tenant ID: <span className="font-mono text-xs bg-gray-200 p-1 rounded">{tenant.id}</span></p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Google Ads 授權專屬連結：</p>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={`${API_BASE_URL}/api/auth/google/login?tenant_id=${tenant.id}&secret=${secret}`}
                        className="text-xs w-full px-2 py-1 border border-gray-300 rounded bg-white text-gray-600" 
                      />
                      <button 
                        onClick={() => navigator.clipboard.writeText(`${API_BASE_URL}/api/auth/google/login?tenant_id=${tenant.id}&secret=${secret}`)}
                        className="bg-gray-800 text-white text-xs px-3 py-1 rounded hover:bg-gray-900"
                      >
                        複製
                      </button>
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