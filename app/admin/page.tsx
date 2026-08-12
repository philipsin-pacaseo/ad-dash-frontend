"use client";

import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [targetTenantForUser, setTargetTenantForUser] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [tenantIdForAuth, setTenantIdForAuth] = useState("");
  const [bindTenantId, setBindTenantId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [gscUrl, setGscUrl] = useState("");
  const [metaId, setMetaId] = useState("");
  const [fetchStartDate, setFetchStartDate] = useState("");
  const [fetchEndDate, setFetchEndDate] = useState("");
  const [coverageData, setCoverageData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [aiModel, setAiModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const handleSyncDB = async () => {
    if (!secret) return alert("請輸入密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/sync-db?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tenants?secret=${encodeURIComponent(secret)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: companyName, contact_email: contactEmail, initial_password: initialPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage({ text: `建立成功！Tenant ID: ${data.tenant_id}`, type: "success" });
      setCompanyName(""); setContactEmail(""); setInitialPassword("");
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !targetTenantForUser) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users?secret=${encodeURIComponent(secret)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: targetTenantForUser, email: newEmail, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage({ text: `建立成功！`, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const fetchAllTenants = async () => {
    if (!secret) return alert("請輸入密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/tenants?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setTenants(data.tenants);
      setMessage({ text: `載入 ${data.tenants.length} 筆資料`, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const handleGodModeView = (tenantId: string, companyName: string) => {
    sessionStorage.setItem("tenant_id", tenantId);
    sessionStorage.setItem("company_name", `(上帝模式) ${companyName}`);
    window.open("/dashboard", "_blank");
  };

  // 🌟 新增：更新商戶貨幣
  const handleUpdateCurrency = async (tenantId: string, newCurrency: string) => {
    if (!secret) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/tenants/${tenantId}/currency?secret=${encodeURIComponent(secret)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: newCurrency })
      });
      if (!res.ok) throw new Error("更新幣別失敗");
      fetchAllTenants(); // 重新讀取清單
      setMessage({ text: `幣別已成功變更為 ${newCurrency}`, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value; setBindTenantId(tId); setTenantIdForAuth(tId);
    setGoogleAdsId(""); setGa4Id(""); setGscUrl(""); setMetaId(""); setCoverageData(null);
    if (!tId || !secret) return;
    setLoading(true);
    try {
      const resInt = await fetch(`${BACKEND_URL}/api/admin/integrations/${tId}?secret=${encodeURIComponent(secret)}`);
      if (resInt.ok) {
        const dataInt = await resInt.json();
        if (dataInt.status === "success" && dataInt.integrations) {
          setGoogleAdsId(dataInt.integrations.google_ads || ""); setGa4Id(dataInt.integrations.ga4 || ""); setGscUrl(dataInt.integrations.gsc || ""); setMetaId(dataInt.integrations.meta_ads || "");
        }
      }
      const resCov = await fetch(`${BACKEND_URL}/api/admin/data-coverage/${tId}?secret=${encodeURIComponent(secret)}`);
      if (resCov.ok) {
        const dataCov = await resCov.json();
        if (dataCov.status === "success") setCoverageData(dataCov.coverage);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOAuthLogin = (platform: "google" | "meta") => {
    if (!secret || !tenantIdForAuth) return;
    window.location.href = `${BACKEND_URL}/api/auth/${platform}/login?tenant_id=${encodeURIComponent(tenantIdForAuth)}&secret=${encodeURIComponent(secret)}`;
  };

  const handleBindAndFetch = async (platform: string, paramName: string, paramValue: string) => {
    if (!bindTenantId || !paramValue) return;
    setLoading(true); setMessage(null);
    try {
      let endpoint = `${BACKEND_URL}/api/data/fetch-${platform}?tenant_id=${encodeURIComponent(bindTenantId)}&${paramName}=${encodeURIComponent(paramValue.trim())}`;
      if (fetchStartDate) endpoint += `&start_date=${fetchStartDate}`;
      if (fetchEndDate) endpoint += `&end_date=${fetchEndDate}`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage({ text: `任務完成！`, type: "success" });
      handleTenantChange({ target: { value: bindTenantId } } as any);
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const fetchCurrentAiModel = async () => {
    if (!secret) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai-model?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setAiModel(data.model_name);
      setMessage({ text: `目前 AI 引擎：${data.model_name}`, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  const handleUpdateAiModel = async () => {
    if (!secret || !aiModel) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai-model?secret=${encodeURIComponent(secret)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model_name: aiModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">超級管理員控制台 (V8.6 國際版)</h1>

        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-gray-800 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">🔑 超級管理員密鑰 (SUPER_ADMIN_SECRET)</label>
            <input type="password" placeholder="請輸入密鑰..." className="w-full px-4 py-2 border rounded-md" value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>
          <button onClick={handleSyncDB} disabled={loading || !secret} className="px-4 py-2 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 disabled:opacity-50">同步資料庫</button>
          <button onClick={fetchAllTenants} disabled={loading || !secret} className="px-4 py-2 bg-gray-800 text-white font-medium rounded hover:bg-gray-700 disabled:opacity-50">載入商戶</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左欄：商戶與使用者管理略 (保持簡潔，同舊版) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold mb-4">1. 建立新商戶 (New Tenant)</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <input type="text" required className="w-full px-4 py-2 border rounded" placeholder="公司名稱" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="email" required className="w-full px-4 py-2 border rounded" placeholder="超級管理員信箱" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                <input type="text" required className="w-full px-4 py-2 border rounded" placeholder="初始密碼" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">建立</button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <h2 className="text-xl font-semibold mb-4">API 歷史數據抓取區</h2>
              <select className="w-full px-4 py-2 border rounded mb-4" value={bindTenantId} onChange={handleTenantChange}>
                <option value="">-- 請選擇目標商戶 --</option>
                {tenants.map(t => (<option key={t.id} value={t.id}>{t.company_name}</option>))}
              </select>
               <div className="flex gap-4 mb-6">
                <button onClick={() => handleOAuthLogin("google")} disabled={!bindTenantId} className="flex-1 py-2 border rounded text-sm disabled:opacity-50">🔗 Google 授權</button>
                <button onClick={() => handleOAuthLogin("meta")} disabled={!bindTenantId} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">🔗 Meta 授權</button>
              </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">上帝視角 (商戶管理與貨幣設定)</h2>
          {tenants.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">公司名稱</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">結帳幣別</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500">操作</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tenant.company_name}</td>
                    {/* 🌟 核心：貨幣設定下拉選單 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={tenant.currency || 'HKD'} 
                        onChange={(e) => handleUpdateCurrency(tenant.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white cursor-pointer font-bold text-emerald-700 focus:ring-emerald-500"
                        disabled={loading}
                      >
                        <option value="HKD">港幣 (HKD)</option>
                        <option value="TWD">台幣 (TWD)</option>
                        <option value="USD">美金 (USD)</option>
                        <option value="JPY">日圓 (JPY)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleGodModeView(tenant.id, tenant.company_name)} className="text-purple-600 bg-purple-50 px-3 py-1 rounded text-sm">👁️ 儀表板</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<div className="text-center py-10 text-gray-500">點擊頂部載入</div>)}
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-yellow-500 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ 系統全域設定 (AI 模型)</h2>
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full px-4 py-2 border rounded" placeholder="模型 ID" />
            <button onClick={fetchCurrentAiModel} className="px-4 py-2 bg-gray-200 rounded whitespace-nowrap">🔄 讀取</button>
            <button onClick={handleUpdateAiModel} className="px-6 py-2 bg-yellow-600 text-white rounded whitespace-nowrap">💾 儲存</button>
          </div>
        </div>

        {message && (<div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg max-w-md z-50 text-white ${message.type === "error" ? "bg-red-600" : "bg-green-600"}`}><p className="text-sm font-bold">{message.text}</p></div>)}
      </div>
    </div>
  );
}