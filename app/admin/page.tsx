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
  // 核心功能 2：上帝視角 (獲取商戶列表與模擬登入)
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

  const handleGodModeView = (tenantId: string, companyName: string) => {
    sessionStorage.setItem("tenant_id", tenantId);
    sessionStorage.setItem("company_name", `(上帝模式) ${companyName}`);
    window.open("/dashboard", "_blank");
  };

  // ==========================================
  // 核心功能 3：商戶下拉選單連動 (自動回填帳號)
  // ==========================================
  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setBindTenantId(tId);
    setTenantIdForAuth(tId); // 同步給 OAuth 區塊

    // 先清空現有欄位，避免舊資料殘留
    setGoogleAdsId(""); setGa4Id(""); setGscUrl(""); setMetaId("");

    if (!tId || !secret) return;

    setLoading(true);
    try {
      // 呼叫後端 API 查詢該商戶已綁定的帳號
      const res = await fetch(`${BACKEND_URL}/api/admin/integrations/${tId}?secret=${encodeURIComponent(secret)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.integrations) {
          setGoogleAdsId(data.integrations.google_ads || "");
          setGa4Id(data.integrations.ga4 || "");
          setGscUrl(data.integrations.gsc || "");
          setMetaId(data.integrations.meta_ads || "");
        }
      }
    } catch (error) {
      console.error("讀取綁定資料失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 核心功能 4：OAuth 平台授權跳轉
  // ==========================================
  const handleOAuthLogin = (platform: "google" | "meta") => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    if (!tenantIdForAuth) return alert("請先從下拉選單選擇目標商戶");
    const authUrl = `${BACKEND_URL}/api/auth/${platform}/login?tenant_id=${encodeURIComponent(tenantIdForAuth)}&secret=${encodeURIComponent(secret)}`;
    window.location.href = authUrl;
  };

  // ==========================================
  // 核心功能 5：綁定子帳戶並初次抓取數據 (含 GSC 防呆)
  // ==========================================
  const handleBindAndFetch = async (platform: string, paramName: string, paramValue: string) => {
    if (!bindTenantId) return alert("請先選擇目標商戶");
    if (!paramValue) return alert(`請輸入對應的 ${paramName}`);
    setLoading(true); setMessage(null);
    
    try {
      // 💡 智能格式化：清除前後空白，自動處理 GSC 的前綴
      let formattedValue = paramValue.trim();
      if (platform === 'gsc') {
        if (!formattedValue.startsWith('http') && !formattedValue.startsWith('sc-domain:')) {
          formattedValue = `sc-domain:${formattedValue}`;
        }
      }

      let endpoint = `${BACKEND_URL}/api/data/fetch-${platform}?tenant_id=${encodeURIComponent(bindTenantId)}&${paramName}=${encodeURIComponent(formattedValue)}`;
      
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

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">超級管理員控制台 (V4 旗艦版)</h1>

        {/* 密鑰輸入區 */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-gray-800 sticky top-4 z-10 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">🔑 超級管理員密鑰 (SUPER_ADMIN_SECRET)</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 bg-gray-50"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="請輸入密鑰以解鎖下方所有操作..."
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchAllTenants} disabled={loading || !secret} className="px-6 py-2 h-[42px] bg-gray-800 text-white font-medium rounded hover:bg-gray-700 disabled:bg-gray-400">
              載入商戶列表
            </button>
          </div>
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

          {/* 區塊 3 & 4：下拉選單、OAuth 與 子帳戶綁定 */}
          <div className="space-y-6">
            
            {/* 統一的商戶選擇器 */}
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <h2 className="text-xl font-semibold mb-4">3 & 4. 平台授權與子帳戶綁定</h2>
              
              <label className="block text-sm font-bold text-gray-700 mb-2">請先選擇目標商戶：</label>
              <select
                className="w-full px-4 py-2 border border-emerald-300 rounded-md mb-4 text-sm bg-emerald-50 cursor-pointer font-medium"
                value={bindTenantId}
                onChange={handleTenantChange}
              >
                <option value="">-- 請選擇目標商戶 --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.company_name} ({t.contact_email})
                  </option>
                ))}
              </select>

              {tenants.length === 0 && (
                <p className="text-xs text-red-500 mb-4 font-medium">
                  💡 請先在頂部輸入密鑰並點擊【載入商戶列表】，此選單才會出現選項。
                </p>
              )}

              {/* OAuth 按鈕 */}
              <div className="flex gap-4 mb-6">
                <button onClick={() => handleOAuthLogin("google")} disabled={!bindTenantId} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  🔗 Google 授權
                </button>
                <button onClick={() => handleOAuthLogin("meta")} disabled={!bindTenantId} className="flex-1 py-2 bg-[#1877F2] text-white font-medium rounded hover:bg-[#166FE5] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  🔗 Meta 授權
                </button>
              </div>
              
              {/* 子帳戶綁定 */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">輸入子帳號 ID 並抓取數據：</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="Google Ads Customer ID" value={googleAdsId} onChange={(e) => setGoogleAdsId(e.target.value)} disabled={!bindTenantId} />
                  <button onClick={() => handleBindAndFetch('google-ads', 'google_customer_id', googleAdsId)} disabled={!bindTenantId} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="GA4 Property ID" value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} disabled={!bindTenantId} />
                  <button onClick={() => handleBindAndFetch('ga4', 'ga4_property_id', ga4Id)} disabled={!bindTenantId} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="GSC 網域 (例如: outdooride.com)" value={gscUrl} onChange={(e) => setGscUrl(e.target.value)} disabled={!bindTenantId} />
                  <button onClick={() => handleBindAndFetch('gsc', 'gsc_site_url', gscUrl)} disabled={!bindTenantId} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">綁定</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="Meta Ad Account ID" value={metaId} onChange={(e) => setMetaId(e.target.value)} disabled={!bindTenantId} />
                  <button onClick={() => handleBindAndFetch('meta-ads', 'meta_ad_account_id', metaId)} disabled={!bindTenantId} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">綁定</button>
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
              點擊頂部按鈕載入商戶列表
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