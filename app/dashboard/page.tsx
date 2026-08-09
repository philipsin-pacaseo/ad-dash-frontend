"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// 🌟 升級版資料格式：加入了未來後端會傳送的細部陣列結構
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
  // 以下為 V5 預備欄位：細部表格數據
  google_ads_details?: Array<{
    campaign_name: string; type: string; objective: string;
    impressions: number; clicks: number; cost: number;
    conversions: number; conversion_value: number; roas: number;
  }>;
  ga4_channels?: Array<{ channel: string; sessions: number }>;
  ga4_top_pages?: Array<{ page_path: string; views: number; bounce_rate: number }>;
  gsc_keywords?: Array<{ keyword: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");

  // 🌟 新增：Date Picker 狀態管理
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // 初始化預設日期 (近 30 天)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  }, []);

  const fetchDashboardData = async (forceStart?: string, forceEnd?: string) => {
    const tenantId = sessionStorage.getItem("tenant_id");
    if (!tenantId) {
      setLoading(false);
      alert("登入憑證已失效，請重新登入。");
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 

      // 將日期參數加上 API 請求中
      const queryParams = new URLSearchParams({
        tenant_id: tenantId,
        start_date: forceStart || startDate,
        end_date: forceEnd || endDate
      });

      const res = await fetch(`${BACKEND_URL}/api/dashboard/summary?${queryParams.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "無法載入儀表板數據");
      
      setData(result);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("伺服器連線逾時 (Timeout)。請檢查後端是否正常運行。");
      } else {
        setError(err.message || "連線發生未知的錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  // 初次載入與驗證
  useEffect(() => {
    const storedCompany = sessionStorage.getItem("company_name");
    if (storedCompany) setCompanyName(storedCompany);
    
    // 確保日期有值才去抓資料
    if (startDate && endDate) {
      fetchDashboardData(startDate, endDate);
    }
  }, [router, BACKEND_URL, startDate, endDate]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const applyDateFilter = () => {
    if (new Date(startDate) > new Date(endDate)) {
      return alert("起始日期不能大於結束日期");
    }
    fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">數據載入與分析中，請稍候...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ad-Dash 全通路數據中心</h1>
        
        {/* 🌟 日期選擇器 UI */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <span className="text-gray-400">至</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <button onClick={applyDateFilter} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">套用</button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">租戶：{companyName}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">安全登出</button>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 m-8 rounded-md text-center">
          {error} <button onClick={() => fetchDashboardData()} className="underline ml-2">重試</button>
        </div>
      )}

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* 頂部：核心比對指標 (MTD, YTD, YoY, MoM) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">廣告總花費 (MTD / YTD)</h3>
            <p className="text-3xl font-bold text-gray-800">${data?.metrics?.MTD_spend?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-400 mt-1">YTD: ${data?.metrics?.YTD_spend?.toLocaleString() || 0}</p>
            <p className={`text-sm mt-2 font-medium ${data?.metrics?.MoM_growth_percent! > 0 ? "text-red-500" : "text-green-500"}`}>
              {data?.metrics?.MoM_growth_percent! > 0 ? "↑" : "↓"} {Math.abs(data?.metrics?.MoM_growth_percent || 0)}% MoM
              <span className="ml-2 text-gray-400 font-normal">/ {data?.metrics?.YoY_growth_percent}% YoY</span>
            </p>
          </div>
          {/* 其他原有指標保持不變 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">平台花費佔比</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between"><span>Google Ads:</span><span className="font-semibold">${data?.platform_breakdown?.google?.toLocaleString() || 0}</span></div>
              <div className="flex justify-between"><span>Meta Ads:</span><span className="font-semibold">${data?.platform_breakdown?.meta?.toLocaleString() || 0}</span></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">網站總流量 (GA4)</h3>
            <p className="text-3xl font-bold text-blue-600">{data?.traffic?.sessions?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500 mt-2">瀏覽量: {data?.traffic?.page_views?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">自然搜尋表現 (GSC)</h3>
            <p className="text-3xl font-bold text-emerald-600">{data?.seo?.clicks?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500 mt-2">曝光量: {data?.seo?.impressions?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* 趨勢圖 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 font-bold text-blue-500">更新圖表中...</div>}
          <h2 className="text-lg font-bold text-gray-800 mb-4">廣告花費趨勢圖</h2>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend_chart || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={10} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Meta" stroke="#1877F2" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🌟 V5 升級預留區塊：詳細數據表格 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">各平台深度洞察 (Deep Dive)</h2>
          
          {/* Google Ads 詳細成效 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Google Ads 廣告活動成效</h3>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Objective</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Impr.</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 text-right">Conv.</th>
                  <th className="py-3 px-4 text-right">Conv. Value</th>
                  <th className="py-3 px-4 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data?.google_ads_details?.length ? (
                  data.google_ads_details.map((ad, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{ad.campaign_name}</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-200 rounded-full text-xs">{ad.type}</span></td>
                      <td className="py-3 px-4">{ad.objective}</td>
                      <td className="py-3 px-4 text-right">${ad.cost}</td>
                      <td className="py-3 px-4 text-right">{ad.impressions}</td>
                      <td className="py-3 px-4 text-right">{ad.clicks}</td>
                      <td className="py-3 px-4 text-right">{ad.conversions}</td>
                      <td className="py-3 px-4 text-right">${ad.conversion_value}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{ad.roas}x</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={9} className="py-8 text-center text-gray-400">等待後端 API 升級以載入詳細活動數據...</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GSC Top 10 Keywords */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <h3 className="text-lg font-bold text-emerald-600 mb-4">GSC: Top 10 搜尋關鍵字</h3>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="py-3 px-4">Keyword</th>
                    <th className="py-3 px-4 text-right">Clicks</th>
                    <th className="py-3 px-4 text-right">Impr.</th>
                    <th className="py-3 px-4 text-right">CTR</th>
                    <th className="py-3 px-4 text-right">Avg. Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.gsc_keywords?.length ? data.gsc_keywords.map((k, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{k.keyword}</td>
                      <td className="py-3 px-4 text-right">{k.clicks}</td>
                      <td className="py-3 px-4 text-right">{k.impressions}</td>
                      <td className="py-3 px-4 text-right">{k.ctr}%</td>
                      <td className="py-3 px-4 text-right">{k.position}</td>
                    </tr>
                  )) : (<tr><td colSpan={5} className="py-8 text-center text-gray-400">等待後端更新...</td></tr>)}
                </tbody>
              </table>
            </div>

            {/* GA4 Channels & Pages */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-orange-500 mb-4">GA4: Sessions by Channel</h3>
                {data?.ga4_channels?.length ? null : <div className="py-4 text-center text-sm text-gray-400">等待後端更新...</div>}
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <h3 className="text-lg font-bold text-orange-500 mb-4">GA4: Top 10 網頁與跳出率</h3>
                {data?.ga4_top_pages?.length ? null : <div className="py-4 text-center text-sm text-gray-400">等待後端更新...</div>}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}