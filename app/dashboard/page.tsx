"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// 🌟 Google Ads 類型字典
const AD_TYPE_MAP: Record<string, string> = {
  "2": "Search", "3": "Display", "4": "Shopping", "5": "Hotel", 
  "6": "Video", "7": "Multi-Channel", "8": "Local", "9": "Smart", 
  "10": "Performance Max", "11": "Local Services", "12": "Discovery", 
  "13": "Travel", "14": "Demand Gen"
};

// 🌟 Google Ads 出價策略字典
const AD_OBJ_MAP: Record<string, string> = {
  "2": "Commission", "3": "Target CPA", "4": "Manual CPC", "5": "Manual CPM", 
  "6": "Manual CPV", "7": "Max Conversions", "8": "Max Conv. Value", 
  "9": "Page One Promoted", "10": "Percent CPA", "11": "Target CPA", 
  "12": "Target CPM", "13": "Target Impr. Share", "14": "Target Outrank", 
  "15": "Target ROAS", "16": "Max Clicks"
};

interface DashboardData {
  currency?: string; 
  metrics: {
    MTD_spend: number; YTD_spend: number; 
    MoM_growth_percent: number; YoY_growth_percent: number;
  };
  platform_breakdown: { google: number; meta: number; };
  traffic: { sessions: number; page_views: number; };
  seo: { clicks: number; impressions: number; };
  trend_chart: Array<{ date: string; Google: number; Meta: number; Total: number; }>;
  google_ads_details?: Array<{
    campaign_name: string; type: string; objective: string;
    impressions: number; clicks: number; cost: number;
    conversions: number; conversion_value: number; roas: number;
  }>;
  ga4_channels?: Array<{ channel: string; sessions: number }>;
  ga4_top_pages?: Array<{ page_title: string; visits: number; bounce_rate: number }>;
  gsc_keywords?: Array<{ keyword: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

// 🌟 全域數字與貨幣格式化引擎
const formatNum = (num: any) => {
  if (num == null) return "0";
  return Number(num).toLocaleString('en-US');
};

const formatCurr = (num: any, currCode: string = "HKD") => {
  if (num == null) return `${currCode} 0.00`;
  return `${currCode} ${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
      setLoading(false); alert("登入憑證已失效，請重新登入。"); router.replace("/"); return;
    }

    setLoading(true); setError(null); setAiInsight(null); 

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 

      const queryParams = new URLSearchParams({
        tenant_id: tenantId, start_date: forceStart || startDate, end_date: forceEnd || endDate
      });

      const res = await fetch(`${BACKEND_URL}/api/dashboard/summary?${queryParams.toString()}`, { signal: controller.signal });
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

  const generateAIInsight = async () => {
    const tenantId = sessionStorage.getItem("tenant_id");
    if (!tenantId) return alert("請先登入");
    
    setIsGeneratingAI(true); setAiInsight(null);
    try {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, start_date: startDate, end_date: endDate });
      const res = await fetch(`${BACKEND_URL}/api/ai/insights?${queryParams.toString()}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "AI 產生失敗");
      
      setAiInsight(result.insights);
    } catch (err: any) {
      alert(`AI 洞察錯誤: ${err.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    const storedCompany = sessionStorage.getItem("company_name");
    if (storedCompany) setCompanyName(storedCompany);
    if (startDate && endDate) fetchDashboardData(startDate, endDate);
  }, [router, BACKEND_URL, startDate, endDate]);

  const handleLogout = () => { sessionStorage.clear(); router.push("/"); };

  const applyDateFilter = () => {
    if (new Date(startDate) > new Date(endDate)) return alert("起始日期不能大於結束日期");
    fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">數據載入與分析中，請稍候...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4">
        <div className="p-6 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-200 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">系統連線異常</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition">強制重新整理</button>
        </div>
      </div>
    );
  }

  const momGrowth = data?.metrics?.MoM_growth_percent || 0;
  const isMomPositive = momGrowth > 0;
  const curr = data?.currency || "HKD";

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ad-Dash 全通路數據中心</h1>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <span className="text-gray-400">至</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <button onClick={applyDateFilter} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">套用</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={generateAIInsight} 
            disabled={isGeneratingAI || !data || loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded shadow hover:from-purple-700 disabled:opacity-50 transition flex items-center gap-2 text-sm font-medium"
          >
            {isGeneratingAI ? "🧠 AI 深度解析中..." : "✨ 產生 AI 營運報告"}
          </button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="text-sm text-gray-600 font-medium">租戶：{companyName}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">安全登出</button>
        </div>
      </header>

      {error && data && (
        <div className="bg-yellow-50 text-yellow-800 p-3 m-8 rounded-md text-sm font-medium border border-yellow-200 flex justify-between items-center">
          <span>⚠️ 數據更新延遲：{error} (目前顯示為快取資料)</span>
          <button onClick={() => fetchDashboardData()} className="underline text-yellow-900 hover:text-black">重試</button>
        </div>
      )}

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        {(isGeneratingAI || aiInsight) && (
          <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-purple-500 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">🤖 AI 智能行銷總監分析</h2>
            {isGeneratingAI ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-purple-600 font-medium animate-pulse">正在為您深度解析跨平台數據關聯性，請稍候...</p>
              </div>
            ) : (
              <div className="prose prose-purple max-w-none text-gray-800">
                <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed bg-purple-50/50 p-6 rounded-lg border border-purple-100 shadow-inner">
                  {aiInsight}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">廣告總花費 (區間 / YTD)</h3>
            <p className="text-3xl font-bold text-gray-800">{formatCurr(data?.metrics?.MTD_spend, curr)}</p>
            <p className="text-xs text-gray-400 mt-1">YTD: {formatCurr(data?.metrics?.YTD_spend, curr)}</p>
            <p className={`text-sm mt-2 font-medium ${isMomPositive ? "text-red-500" : "text-green-500"}`}>
              {isMomPositive ? "↑" : "↓"} {Math.abs(momGrowth)}% MoM
              <span className="ml-2 text-gray-400 font-normal">/ {data?.metrics?.YoY_growth_percent || 0}% YoY</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">平台花費佔比</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between"><span>Google Ads:</span><span className="font-semibold">{formatCurr(data?.platform_breakdown?.google, curr)}</span></div>
              <div className="flex justify-between"><span>Meta Ads:</span><span className="font-semibold">{formatCurr(data?.platform_breakdown?.meta, curr)}</span></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">網站總流量 (GA4)</h3>
            <p className="text-3xl font-bold text-blue-600">{formatNum(data?.traffic?.sessions)}</p>
            <p className="text-sm text-gray-500 mt-2">瀏覽量: {formatNum(data?.traffic?.page_views)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">自然搜尋表現 (GSC)</h3>
            <p className="text-3xl font-bold text-emerald-600">{formatNum(data?.seo?.clicks)}</p>
            <p className="text-sm text-gray-500 mt-2">曝光量: {formatNum(data?.seo?.impressions)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 font-bold text-blue-600">圖表更新中...</div>}
          <h2 className="text-lg font-bold text-gray-800 mb-4">廣告花費趨勢圖 ({curr})</h2>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend_chart || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={10} />
                {/* 🌟 修復 TypeScript 型別錯誤 */}
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value: any) => formatNum(value)} />
                <Tooltip formatter={(value: any) => formatCurr(value, curr)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Meta" stroke="#1877F2" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">各平台深度洞察 (Deep Dive)</h2>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto relative">
            {loading && <div className="absolute inset-0 bg-white/50 z-10"></div>}
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
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 font-medium rounded-full text-xs whitespace-nowrap">{AD_TYPE_MAP[ad.type] || ad.type}</span></td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{AD_OBJ_MAP[ad.objective] || ad.objective}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurr(ad.cost, curr)}</td>
                      <td className="py-3 px-4 text-right">{formatNum(ad.impressions)}</td>
                      <td className="py-3 px-4 text-right">{formatNum(ad.clicks)}</td>
                      <td className="py-3 px-4 text-right">{formatNum(ad.conversions)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurr(ad.conversion_value, curr)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{ad.roas}x</td>
                    </tr>
                  ))
                ) : ( <tr><td colSpan={9} className="py-8 text-center text-gray-400">目前所選日期範圍內沒有廣告資料，或等待資料載入中...</td></tr> )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {loading && <div className="absolute inset-0 bg-white/50 z-10"></div>}
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <h3 className="text-lg font-bold text-emerald-600 mb-4">GSC: Top 20 搜尋關鍵字</h3>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr><th className="py-3 px-4">Keyword</th><th className="py-3 px-4 text-right">Clicks</th><th className="py-3 px-4 text-right">Impr.</th><th className="py-3 px-4 text-right">CTR</th><th className="py-3 px-4 text-right">Avg. Pos</th></tr>
                </thead>
                <tbody>
                  {data?.gsc_keywords?.length ? data.gsc_keywords.map((k, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{k.keyword}</td>
                      <td className="py-3 px-4 text-right">{formatNum(k.clicks)}</td>
                      <td className="py-3 px-4 text-right">{formatNum(k.impressions)}</td>
                      <td className="py-3 px-4 text-right">{k.ctr}%</td>
                      <td className="py-3 px-4 text-right">{k.position}</td>
                    </tr>
                  )) : (<tr><td colSpan={5} className="py-8 text-center text-gray-400">目前沒有資料，或等待載入中...</td></tr>)}
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <h3 className="text-lg font-bold text-orange-500 mb-4">GA4: Sessions by Channel</h3>
                {data?.ga4_channels?.length ? (
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b"><tr><th className="py-2 px-4">Channel</th><th className="py-2 px-4 text-right">Sessions</th></tr></thead>
                    <tbody>
                      {data.ga4_channels.map((c, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">{c.channel}</td>
                          <td className="py-2 px-4 text-right">{formatNum(c.sessions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="py-4 text-center text-sm text-gray-400">目前沒有資料，或等待載入中...</div>}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <h3 className="text-lg font-bold text-orange-500 mb-4">GA4: Top 10 網頁標題與跳出率</h3>
                {data?.ga4_top_pages?.length ? (
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b"><tr><th className="py-2 px-4">Page Title</th><th className="py-2 px-4 text-right">Visits (Sessions)</th><th className="py-2 px-4 text-right">Bounce Rate</th></tr></thead>
                    <tbody>
                      {data.ga4_top_pages.map((p, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 truncate max-w-[300px] font-medium" title={p.page_title}>{p.page_title}</td>
                          <td className="py-2 px-4 text-right">{formatNum(p.visits)}</td>
                          <td className="py-2 px-4 text-right">{p.bounce_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="py-4 text-center text-sm text-gray-400">目前沒有資料，或等待載入中...</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}