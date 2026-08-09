"use client";

import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // 執行資料庫 V4 升級 (初始化密碼防護系統)
  const handleUpgradeDB = async () => {
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/upgrade-db-v4?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "升級失敗");
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 建立新租戶 (包含密碼)
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return alert("請先輸入超級管理員密鑰");
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tenants?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company_name: companyName, 
          contact_email: contactEmail, 
          initial_password: initialPassword 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "建立租戶失敗");
      
      setMessage({ text: `租戶建立成功！Tenant ID: ${data.tenant_id}`, type: "success" });
      setCompanyName("");
      setContactEmail("");
      setInitialPassword("");
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">超級管理員控制台 (V4 旗艦版)</h1>

        {/* 密鑰輸入區 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">超級管理員密鑰 (SUPER_ADMIN_SECRET)</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="輸入您的 Super Admin Secret"
          />
        </div>

        {/* 資料庫升級區 */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h2 className="text-xl font-semibold mb-4">系統升級操作</h2>
          <p className="text-sm text-gray-600 mb-4">首次部署 V4 密碼系統時，請務必點擊此按鈕升級資料庫結構。</p>
          <button
            onClick={handleUpgradeDB}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none disabled:bg-gray-400"
          >
            {loading ? "處理中..." : "執行 V4 資料庫升級"}
          </button>
        </div>

        {/* 建立租戶區 */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">建立新租戶 (客戶)</h2>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">公司名稱</label>
                <input type="text" required className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">聯絡信箱 (登入帳號)</label>
                <input type="email" required className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">初始登入密碼</label>
                <input type="text" required className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} placeholder="建議設定強度較高的密碼" />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
            >
              {loading ? "建立中..." : "確認建立租戶"}
            </button>
          </form>
        </div>

        {/* 全局訊息提示 */}
        {message && (
          <div className={`p-4 rounded-md shadow ${message.type === "error" ? "bg-red-100 text-red-700 border-l-4 border-red-500" : "bg-green-100 text-green-700 border-l-4 border-green-500"}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}