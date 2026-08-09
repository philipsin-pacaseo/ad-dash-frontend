"use client";

import { useState } from "react";

export default function AdminPage() {
  // 1. 全域密鑰
  const [secret, setSecret] = useState("");
  
  // 2. 建立租戶狀態
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  
  // 3. 平台整合 OAuth 授權狀態
  const [tenantIdForAuth, setTenantIdForAuth] = useState("");

  // 4. 子帳戶綁定與抓取狀態
  const [bindTenantId, setBindTenantId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [gscUrl, setGscUrl] = useState("");
  const [metaId, setMetaId] = useState("");

  // 5. 上帝視角：商戶列表狀態
  const [tenants, setTenants] = useState<any[]>([]);

  // 全局 UI 狀態
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // ==========================================
  // 核心功能 1：資料庫升級 & 建立租戶
  // ==========================================
  const handleUpgradeDB = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/upgrade-db-v4?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "升級失敗");
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } 
    finally { setLoading(false); }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tenants?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, contact_email: contactEmail, initial_password: initialPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "建立租戶失敗");
      setMessage({ text: `租戶建立成功！請妥善保存 Tenant ID: ${data.tenant_id}`, type: "success" });
      setCompanyName(""); setContactEmail(""); setInitialPassword("");
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // 核心功能 2：OAuth 平台授權跳轉
  // ==========================================
  const handleOAuthLogin = (platform: "google" | "meta") => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    if (!tenantIdForAuth) return alert("請輸入要綁定的 Tenant ID");
    const authUrl = `${BACKEND_URL}/api/auth/${platform}/login?tenant_id=${encodeURIComponent(tenantIdForAuth)}&secret=${encodeURIComponent(secret)}`;
    window.location.href = authUrl;
  };

  // ==========================================
  // 核心功能 3：綁定子帳戶並初次抓取數據
  // ==========================================
  const handleBindAndFetch = async (platform: string, paramName: string, paramValue: string) => {
    if (!bindTenantId) return alert("請先輸入目標商戶 (Tenant ID)");
    if (!paramValue) return alert(`請輸入對應的 ${paramName}`);
    setLoading(true); setMessage(null);
    
    try {
      let endpoint = `${BACKEND_URL}/api/data/fetch-${platform}?tenant_id=${encodeURIComponent(bindTenantId)}&${paramName}=${encodeURIComponent(paramValue)}`;
      
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || `${platform} 綁定/抓取失敗`);
      setMessage({ text: `[${platform}] 綁定成功！${data.message}`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 核心功能 4：上帝視角 (獲取商戶列表與模擬登入)
  // ==========================================
  const fetchAllTenants = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/tenants?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "無法獲取商戶列表");
      setTenants(data.tenants);
      setMessage({ text: `成功載入 ${data.tenants.length} 筆商戶資料`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 上帝模式：模擬商戶身分並開啟儀表板
  const handleGodModeView = (tenantId: string, companyName: string) => {
    // 寫入 SessionStorage 模擬登入憑證
    sessionStorage.setItem("tenant_id", tenantId);
    sessionStorage.setItem("company_name", `(上帝模式) ${companyName}`);
    // 開啟新分頁進入儀表板，不影響當前的 Admin 頁面
    window.open("/dashboard", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">超級管理員控制台 (V4 旗艦版)</h1>

        {/* 密鑰輸入區 (最重要) */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-gray-800 sticky top-4 z-10">
          <label className="block text-sm font-bold text-gray-700 mb-2">🔑 超級管理員密鑰 (SUPER_ADMIN_SECRET)</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 bg-gray-50"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="請輸入密鑰以解鎖下方所有操作..."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 區塊 1 & 2：升級與建立商戶 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <h2 className="text-xl font-semibold mb-4">1. 系統升級操作</h2>
              <button onClick={handleUpgradeDB} disabled={loading} className="w-full py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 font-medium">
                執行 V4 資料庫升級
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold mb-4">2. 建立新商戶</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="公司名稱" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="聯絡信箱 (登入帳號)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="初始登入密碼" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium">確認建立商戶</button>
              </form>
            </div>
          </div>

          {/* 區塊 3 & 4：OAuth 與 子帳戶綁定 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
              <h2 className="text-xl font-semibold mb-4">3. 主帳戶 OAuth 授權綁定</h2>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 text-sm" placeholder="目標商戶 ID (Tenant ID)" value={tenantIdForAuth} onChange={(e) => setTenantIdForAuth(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => handleOAuthLogin("google")} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 text-sm">連結 Google 授權</button>
                <button onClick={() => handleOAuthLogin("meta")} className="flex-1 py-2 bg-[#1877F2] text-white font-medium rounded hover:bg-[#166FE5] text-sm">連結 Meta 授權</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <h2 className="text-xl font-semibold mb-4">4. 子帳戶綁定 & 抓取數據</h2>
              <input type="text" className="w-full px-4 py-2 border border-emerald-300 rounded-md mb-4 text-sm bg-emerald-50" placeholder="目標商戶 ID (Tenant ID)" value={bindTenantId} onChange={(e) => setBindTenantId(e.target.value)} />
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Google Ads Customer ID" value={googleAdsId} onChange={(e) => setGoogleAdsId(e.target.value)} />
                  <button onClick={() => handleBindAndFetch('google-ads', 'google_customer_id', googleAdsId)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" placeholder="GA4 Property ID" value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} />
                  <button onClick={() => handleBindAndFetch('ga4', 'ga4_property_id', ga4Id)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" placeholder="GSC 網站網址" value={gscUrl} onChange={(e) => setGscUrl(e.target.value)} />
                  <button onClick={() => handleBindAndFetch('gsc', 'gsc_site_url', gscUrl)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Meta Ad Account ID" value={metaId} onChange={(e) => setMetaId(e.target.value)} />
                  <button onClick={() => handleBindAndFetch('meta-ads', 'meta_ad_account_id', metaId)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">綁定</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🌟 區塊 5：上帝視角 (商戶列表) */}
        {/* ========================================== */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500 mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">5. 上帝視角 (商戶管理)</h2>
              <p className="text-sm text-gray-500 mt-1">一覽所有商戶，並可一鍵無密碼登入目標商戶的儀表板進行除錯與查看。</p>
            </div>
            <button onClick={fetchAllTenants} disabled={loading} className="px-6 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 disabled:bg-gray-400">
              載入 / 刷新商戶列表
            </button>
          </div>

          {tenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">公司名稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">聯絡信箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.contact_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono text-xs">{tenant.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleGodModeView(tenant.id, tenant.company_name)}
                          className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded"
                        >
                          👁️ 進入儀表板
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
              點擊右上角按鈕載入資料庫中的商戶列表
            </div>
          )}
        </div>

        {/* 全局系統提示訊息 */}
        {message && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg max-w-md z-50 animate-fade-in-up ${message.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold">{message.type === "error" ? "❌ 錯誤：" : "✅ 成功："}</span>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}