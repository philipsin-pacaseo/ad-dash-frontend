"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 宣告後端回傳的資料格式
interface DashboardData {
  metrics: {
    MTD_spend: number;
    YTD_spend: number;
    MoM_growth_percent: number;
    YoY_growth_percent: number;
  };
  platform_breakdown: {
    google: number;
    meta: number;
  };
  traffic: {
    sessions: number;
    page_views: number;
  };
  seo: {
    clicks: number;
    impressions: number;
  };
  trend_chart: Array<{
    date: string;
    Google: number;
    Meta: number;
    Total: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

useEffect(() => {
    const tenantId = sessionStorage.getItem("tenant_id");
    const storedCompany = sessionStorage.getItem("company_name");

    // 【修復核心 1】：在跳轉前將 loading 關閉，並使用 replace 防止上一頁死結
    if (!tenantId) {
      setLoading(false);
      alert("登入憑證已失效，請重新登入。");
      router.replace("/"); 
      return;
    }

    if (storedCompany) setCompanyName(storedCompany);

    const fetchDashboardData = async () => {
      try {
        // 【修復核心 2】：加入 15 秒超時防護，防止後端 Zeabur 休眠或連線池滿載導致無限 Loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

        const res = await fetch(`${BACKEND_URL}/api/dashboard/summary?tenant_id=${tenantId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.detail || "無法載入儀表板數據");
        }

        setData(result);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setError("伺服器連線逾時 (Timeout)。請檢查 Zeabur 後端是否正常運行。");
        } else {
          setError(err.message || "連線發生未知的錯誤");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, BACKEND_URL]);

    if (storedCompany) setCompanyName(storedCompany);

    // 向後端 API 獲取儀表板數據
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/dashboard/summary?tenant_id=${tenantId}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.detail || "無法載入儀表板數據");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, BACKEND_URL]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">數據載入中，請稍候...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-200">
          <h2 className="text-lg font-bold mb-2">資料載入失敗</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            重新嘗試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ad-Dash 全通路數據中心</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">租戶：{companyName}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            安全登出
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">本月廣告總花費 (MTD)</h3>
            <p className="text-3xl font-bold text-gray-800">${data?.metrics.MTD_spend.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">平台花費佔比</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Google Ads:</span>
                <span className="font-semibold">${data?.platform_breakdown.google.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Meta Ads:</span>
                <span className="font-semibold">${data?.platform_breakdown.meta.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">網站流量 (GA4)</h3>
            <p className="text-3xl font-bold text-blue-600">{data?.traffic.sessions.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">自然搜尋表現 (GSC)</h3>
            <p className="text-3xl font-bold text-emerald-600">{data?.seo.clicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">近 30 天廣告花費趨勢</h2>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend_chart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={10} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Meta" stroke="#1877F2" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}