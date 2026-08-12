"use client";

import { useState } from "react";

export default function AdminPage() {
  // 1. 全域密鑰
  const [secret, setSecret] = useState("");
  
  // 2. 建立租戶狀態
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");

  // 3. 多用戶狀態 (已修復加回)
  const [targetTenantForUser, setTargetTenantForUser] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // 4. 平台整合 OAuth 授權狀態
  const [tenantIdForAuth, setTenantIdForAuth] = useState("");

  // 5. 子帳戶綁定與抓取狀態 (已修復加回)
  const [bindTenantId, setBindTenantId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [gscUrl, setGscUrl] = useState("");
  const [metaId, setMetaId] = useState("");

  // 6. 歷史數據抓取區間
  const [fetchStartDate, setFetchStartDate] = useState("");
  const [fetchEndDate, setFetchEndDate] = useState("");

  // 🌟 V8 升級：數據覆蓋率與健康度狀態 (已修復加回)
  const [coverageData, setCoverageData] = useState<any>(null);

  // 上帝視角：商戶列表狀態
  const [tenants, setTenants] = useState<any[]>([]);

  // 🌟 V8.5 新增：AI 引擎動態設定狀態
  const [aiModel, setAiModel] = useState("");

  // 全局 UI 狀態
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // ==========================================
  // 核心功能：資料庫同步 (V8)
  // ==========================================
  const handleSyncDB = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/sync-db?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "同步失敗");
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // 核心功能：建立新商戶
  // ==========================================
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
  // 核心功能：為現有商戶新增子帳號 (已修復加回)
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return alert("請先輸入超級管理員密鑰");
    if (!targetTenantForUser) return alert("請先從下拉選單選擇目標商戶");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: targetTenantForUser, email: newEmail, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "新增用戶失敗");
      setMessage({ text: `子帳號 ${newEmail} 建立成功！`, type: "success" });
      setNewEmail(""); setNewPassword("");
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // 核心功能：上帝視角
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

  // ==========================================
  // 🌟 核心功能：商戶下拉選單連動 (加入 Coverage 掃描)
  // ==========================================
  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setBindTenantId(tId);
    setTenantIdForAuth(tId); 

    // 清空現有欄位與狀態
    setGoogleAdsId(""); setGa4Id(""); setGscUrl(""); setMetaId("");
    setCoverageData(null);

    if (!tId || !secret) return;

    setLoading(true);
    try {
      // 1. 獲取已綁定帳號
      const resInt = await fetch(`${BACKEND_URL}/api/admin/integrations/${tId}?secret=${encodeURIComponent(secret)}`);
      if (resInt.ok) {
        const dataInt = await resInt.json();
        if (dataInt.status === "success" && dataInt.integrations) {
          setGoogleAdsId(dataInt.integrations.google_ads || "");
          setGa4Id(dataInt.integrations.ga4 || "");
          setGscUrl(dataInt.integrations.gsc || "");
          setMetaId(dataInt.integrations.meta_ads || "");
        }
      }

      // 2. 🌟 掃描數據覆蓋率與健康度狀態
      const resCov = await fetch(`${BACKEND_URL}/api/admin/data-coverage/${tId}?secret=${encodeURIComponent(secret)}`);
      if (resCov.ok) {
        const dataCov = await resCov.json();
        if (dataCov.status === "success") {
          setCoverageData(dataCov.coverage);
        }
      }
    } catch (error) {
      console.error("讀取資料失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 核心功能：OAuth 平台授權跳轉
  // ==========================================
  const handleOAuthLogin = (platform: "google" | "meta") => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    if (!tenantIdForAuth) return alert("請先從下拉選單選擇目標商戶");
    const authUrl = `${BACKEND_URL}/api/auth/${platform}/login?tenant_id=${encodeURIComponent(tenantIdForAuth)}&secret=${encodeURIComponent(secret)}`;
    window.location.href = authUrl;
  };

  // ==========================================
  // 核心功能：綁定與歷史數據抓取
  // ==========================================
  const handleBindAndFetch = async (platform: string, paramName: string, paramValue: string) => {
    if (!bindTenantId) return alert("請先選擇目標商戶");
    if (!paramValue) return alert(`請輸入對應的 ${paramName}`);
    setLoading(true); setMessage(null);
    
    try {
      let formattedValue = paramValue.trim();
      if (platform === 'gsc') {
        if (!formattedValue.startsWith('http') && !formattedValue.startsWith('sc-domain:')) {
          formattedValue = `sc-domain:${formattedValue}`;
        }
      }

      let endpoint = `${BACKEND_URL}/api/data/fetch-${platform}?tenant_id=${encodeURIComponent(bindTenantId)}&${paramName}=${encodeURIComponent(formattedValue)}`;
      
      if (fetchStartDate) endpoint += `&start_date=${fetchStartDate}`;
      if (fetchEndDate) endpoint += `&end_date=${fetchEndDate}`;
      
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || `${platform} 綁定/抓取失敗`);
      setMessage({ text: `[${platform}] 抓取任務完成！${data.message}`, type: "success" });
      
      // 成功後重新刷新 Coverage 狀態
      handleTenantChange({ target: { value: bindTenantId } } as any);
      
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
      // 失敗後也重新刷新 Coverage 狀態 (顯示錯誤)
      handleTenantChange({ target: { value: bindTenantId } } as any);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🌟 核心功能：系統全域設定 (AI 模型動態切換)
  // ==========================================
  const fetchCurrentAiModel = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai-model?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "無法載入目前 AI 模型設定");
      setAiModel(data.model_name);
      setMessage({ text: `已成功讀取目前 AI 引擎：${data.model_name}`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAiModel = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    if (!aiModel) return alert("模型名稱不能為空");
    setLoading(true); setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai-model?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: aiModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "AI 模型更新失敗");
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 🌟 輔助函數：渲染健康度標籤 (已修復加回)
  const renderCoverageStatus = (platformKey: string) => {
    if (!coverageData || !coverageData[platformKey]) return null;
    const { min, max, info } = coverageData[platformKey];
    
    return (
      <div className="mt-2 text-xs p-2 bg-gray-50 rounded border border-gray-100 space-y-1">
        <div className="flex items-center gap-2">
          {min && max ? (
            <span className="text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">✅ 已入庫：{min} ~ {max}</span>
          ) : (
            <span className="text-gray-500 font-medium bg-gray-200 px-2 py-0.5 rounded">⚪ 尚未擁有歷史數據</span>
          )}
        </div>
        
        {info?.status === 'error' && (
          <div className="text-red-600 font-medium break-words mt-1">
            ❌ 抓取異常：{info?.error}
          </div>
        )}
        
        {info?.status === 'success' && info?.last_sync && (
          <div className="text-blue-600 font-medium mt-1">
            🔄 最後成功同步：{new Date(info.last_sync).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">超級管理員控制台 (V8.6.2 國際完整版)</h1>

        {/* 密鑰與系統操作區 */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-gray-800 sticky top-4 z-10 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">🔑 超級管理員密鑰 (SUPER_ADMIN_SECRET)</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 bg-gray-50"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="請輸入密鑰以解鎖下方所有操作..."
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleSyncDB} disabled={loading || !secret} className="flex-1 px-4 py-2 h-[42px] bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 disabled:bg-gray-400">
              同步資料庫
            </button>
            <button onClick={fetchAllTenants} disabled={loading || !secret} className="flex-1 px-4 py-2 h-[42px] bg-gray-800 text-white font-medium rounded hover:bg-gray-700 disabled:bg-gray-400">
              載入商戶列表
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左欄：商戶與使用者管理 (已完全還原) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold mb-4">1. 建立新商戶 (New Tenant)</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="公司名稱" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="超級管理員信箱 (登入帳號)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="初始密碼" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium">確認建立商戶</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
              <h2 className="text-xl font-semibold mb-4">2. 新增子帳號 (多用戶管理)</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
                  value={targetTenantForUser}
                  onChange={(e) => setTargetTenantForUser(e.target.value)}
                >
                  <option value="">-- 請選擇目標商戶 --</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                </select>
                <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="新用戶信箱" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" placeholder="設定密碼" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 font-medium">新增使用者</button>
              </form>
            </div>
          </div>

          {/* 右欄：授權與歷史數據抓取 (已完全還原) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <h2 className="text-xl font-semibold mb-4">3 & 4. 平台授權與歷史數據回溯</h2>
              
              <label className="block text-sm font-bold text-gray-700 mb-2">步驟 A：選擇目標商戶</label>
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

              <label className="block text-sm font-bold text-gray-700 mb-2 mt-4">步驟 B：OAuth 授權 (首次需執行)</label>
              <div className="flex gap-4 mb-6">
                <button onClick={() => handleOAuthLogin("google")} disabled={!bindTenantId} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 text-sm disabled:opacity-50">🔗 Google 授權</button>
                <button onClick={() => handleOAuthLogin("meta")} disabled={!bindTenantId} className="flex-1 py-2 bg-[#1877F2] text-white font-medium rounded hover:bg-[#166FE5] text-sm disabled:opacity-50">🔗 Meta 授權</button>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">步驟 C：設定抓取區間 (留空則預設抓取昨日)</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white" value={fetchStartDate} onChange={(e) => setFetchStartDate(e.target.value)} />
                    <span className="text-gray-500">~</span>
                    <input type="date" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white" value={fetchEndDate} onChange={(e) => setFetchEndDate(e.target.value)} />
                  </div>
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-2">步驟 D：輸入子帳號 ID 並執行抓取</label>
                <div className="space-y-4">
                  {/* Google Ads */}
                  <div className="p-3 border border-gray-200 rounded-md bg-white">
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="Google Ads Customer ID" value={googleAdsId} onChange={(e) => setGoogleAdsId(e.target.value)} disabled={!bindTenantId} />
                      <button onClick={() => handleBindAndFetch('google-ads', 'google_customer_id', googleAdsId)} disabled={!bindTenantId || loading} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">抓取</button>
                    </div>
                    {renderCoverageStatus('google_ads')}
                  </div>

                  {/* GA4 */}
                  <div className="p-3 border border-gray-200 rounded-md bg-white">
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="GA4 Property ID" value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} disabled={!bindTenantId} />
                      <button onClick={() => handleBindAndFetch('ga4', 'ga4_property_id', ga4Id)} disabled={!bindTenantId || loading} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">抓取</button>
                    </div>
                    {renderCoverageStatus('ga4')}
                  </div>

                  {/* GSC */}
                  <div className="p-3 border border-gray-200 rounded-md bg-white">
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="GSC 網域 (例如: outdooride.com)" value={gscUrl} onChange={(e) => setGscUrl(e.target.value)} disabled={!bindTenantId} />
                      <button onClick={() => handleBindAndFetch('gsc', 'gsc_site_url', gscUrl)} disabled={!bindTenantId || loading} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">抓取</button>
                    </div>
                    {renderCoverageStatus('gsc')}
                  </div>

                  {/* Meta Ads */}
                  <div className="p-3 border border-gray-200 rounded-md bg-white">
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50" placeholder="Meta Ad Account ID" value={metaId} onChange={(e) => setMetaId(e.target.value)} disabled={!bindTenantId} />
                      <button onClick={() => handleBindAndFetch('meta-ads', 'meta_ad_account_id', metaId)} disabled={!bindTenantId || loading} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50">抓取</button>
                    </div>
                    {renderCoverageStatus('meta_ads')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🌟 區塊 5：上帝視角 (商戶列表與貨幣設定) (保留 V8.6 最新功能) */}
        {/* ========================================== */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500 mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">5. 上帝視角 (商戶管理與貨幣設定)</h2>
              <p className="text-sm text-gray-500 mt-1">一覽所有商戶，可設定商戶專屬幣別，並一鍵無密碼登入目標商戶儀表板。</p>
            </div>
          </div>

          {tenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">公司名稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">超級管理員信箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">結帳幣別</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.contact_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono text-xs">{tenant.id}</td>
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

        {/* ========================================== */}
        {/* 🌟 區塊 6：系統全域設定 (AI 模型動態切換) (保留 V8.6 最新功能) */}
        {/* ========================================== */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-yellow-500 mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">6. ⚙️ 系統全域設定 (AI 引擎切換)</h2>
            <p className="text-sm text-gray-500 mt-1">變更後將立即生效，所有商戶的 AI 行銷總監都會同步切換至您指定的大語言模型 (LLM)。</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end max-w-2xl">
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-2">目前使用的 OpenRouter 模型 ID</label>
              <input 
                type="text" 
                value={aiModel} 
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-yellow-500 bg-gray-50"
                placeholder="例如：nvidia/nemotron-4-340b-instruct:free"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={fetchCurrentAiModel} 
                disabled={loading || !secret}
                className="px-4 py-2 h-[42px] bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300 disabled:opacity-50 text-sm whitespace-nowrap transition"
              >
                🔄 讀取設定
              </button>
              <button 
                onClick={handleUpdateAiModel} 
                disabled={loading || !secret || !aiModel}
                className="px-6 py-2 h-[42px] bg-yellow-600 text-white font-medium rounded hover:bg-yellow-700 disabled:opacity-50 text-sm whitespace-nowrap shadow-sm transition"
              >
                💾 儲存切換
              </button>
            </div>
          </div>
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