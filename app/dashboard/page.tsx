"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// 🌟 Google Ads 字典
const AD_TYPE_MAP: Record<string, string> = { "2": "Search", "3": "Display", "4": "Shopping", "5": "Hotel", "6": "Video", "7": "Multi-Channel", "8": "Local", "9": "Smart", "10": "PMax", "11": "Local Services", "12": "Discovery", "13": "Travel", "14": "Demand Gen" };
const AD_OBJ_MAP: Record<string, string> = { "2": "Commission", "3": "Target CPA", "4": "Manual CPC", "5": "Manual CPM", "6": "Manual CPV", "7": "Max Conv.", "8": "Max Conv. Value", "15": "Target ROAS", "16": "Max Clicks" };

interface DashboardData {
  currency?: string; 
  metrics: { MTD_spend: number; YTD_spend: number; MoM_growth_percent: number; YoY_growth_percent: number; };
  platform_breakdown: { google: number; meta: number; };
  traffic: { sessions: number; page_views: number; };
  seo: { clicks: number; impressions: number; };
  // 🌟 擴充：加入雙軌營收與 ROAS 型別
  trend_chart: Array<{ date: string; Google: number; Meta: number; Total: number; Shopline_Rev: number; Ad_Conv_Val: number; Shopline_ROAS: number; Ad_ROAS: number; }>;
  google_ads_details?: Array<{ campaign_name: string; type: string; objective: string; impressions: number; clicks: number; cost: number; conversions: number; conversion_value: number; roas: number; }>;
  meta_ads_details?: Array<{ campaign_name: string; spend: number; impressions: number; clicks: number; conversions: number; cpa: number; roas: number; }>;
  ga4_channels?: Array<{ channel: string; sessions: number }>;
  ga4_top_pages?: Array<{ page_title: string; visits: number; bounce_rate: number }>;
  gsc_keywords?: Array<{ keyword: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

const formatNum = (num: any) => num == null ? "0" : Number(num).toLocaleString('en-US');
const formatCurr = (num: any, currCode: string = "HKD") => num == null ? `${currCode} 0.00` : `${currCode} ${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  // Modal 狀態
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [sortConfig, setSortConfig] = useState<{ table: string; key: string; direction: 'asc' | 'desc' } | null>(null);

  // 圖表群組狀態
  const [timeGrouping, setTimeGrouping] = useState<"day" | "week" | "month">("day");

  // 🌟 圖表折線顯示開關狀態 (獨立雙軌)
  const [activeLines, setActiveLines] = useState({
    Shopline_Rev: true,
    Shopline_ROAS: true,
    Google: true,
    Meta: true,
    Total: false,
    Ad_Conv_Val: false, // 預設隱藏預估營收
    Ad_ROAS: false      // 預設隱藏預估 ROAS
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.clear();
        alert("基於系統安全考量，閒置超過 30 分鐘已自動登出。");
        router.replace("/");
      }, 30 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach(evt => document.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(evt => document.removeEventListener(evt, resetTimer));
    };
  }, [router]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setEndDate(getLocalDateString(end));
    setStartDate(getLocalDateString(start));
    
    const storedCompany = sessionStorage.getItem("company_name");
    if (storedCompany) setCompanyName(storedCompany);
  }, []);

  const fetchDashboardData = async (forceStart?: string, forceEnd?: string) => {
    const tenantId = sessionStorage.getItem("tenant_id");
    if (!tenantId) { setLoading(false); alert("憑證失效，請重新登入。"); router.replace("/"); return; }

    setLoading(true); setError(null); setAiInsight(null); 
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      const queryParams = new URLSearchParams({ tenant_id: tenantId, start_date: forceStart || startDate, end_date: forceEnd || endDate });
      const res = await fetch(`${BACKEND_URL}/api/dashboard/summary?${queryParams.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "無法載入數據");
      setData(result);
    } catch (err: any) {
      setError(err.name === 'AbortError' ? "伺服器連線逾時" : err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboardData(startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const applyMTD = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const sd = getLocalDateString(start);
    const ed = getLocalDateString(today);
    setStartDate(sd); setEndDate(ed);
  };

  const applyYTD = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    const sd = getLocalDateString(start);
    const ed = getLocalDateString(today);
    setStartDate(sd); setEndDate(ed);
  };

  const applyDateFilter = () => {
    if (new Date(startDate) > new Date(endDate)) return alert("起始日期不能大於結束日期");
    fetchDashboardData();
  };

  // 🌟 動態圖表聚合引擎 (雙軌加權計算)
  const groupedTrendData = useMemo(() => {
    if (!data?.trend_chart) return [];
    if (timeGrouping === "day") return data.trend_chart;

    const grouped = data.trend_chart.reduce((acc, curr) => {
      let key = curr.date;
      const dateObj = new Date(curr.date);
      
      if (timeGrouping === "week") {
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(dateObj.setDate(diff));
        key = getLocalDateString(monday); 
      } else if (timeGrouping === "month") {
        key = curr.date.substring(0, 7);
      }

      if (!acc[key]) acc[key] = { date: key, Google: 0, Meta: 0, Total: 0, Shopline_Rev: 0, Ad_Conv_Val: 0 };
      acc[key].Google += (curr.Google || 0);
      acc[key].Meta += (curr.Meta || 0);
      acc[key].Total += (curr.Total || 0);
      acc[key].Shopline_Rev += (curr.Shopline_Rev || 0);
      acc[key].Ad_Conv_Val += (curr.Ad_Conv_Val || 0);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      Shopline_ROAS: item.Total > 0 ? Number((item.Shopline_Rev / item.Total).toFixed(2)) : 0,
      Ad_ROAS: item.Total > 0 ? Number((item.Ad_Conv_Val / item.Total).toFixed(2)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [data?.trend_chart, timeGrouping]);

  // 🌟 動態計算頂部卡片的雙軌營收
  const intervalShoplineRev = useMemo(() => groupedTrendData.reduce((sum, item) => sum + (item.Shopline_Rev || 0), 0), [groupedTrendData]);
  const intervalAdRev = useMemo(() => groupedTrendData.reduce((sum, item) => sum + (item.Ad_Conv_Val || 0), 0), [groupedTrendData]);
  const intervalSpend = useMemo(() => groupedTrendData.reduce((sum, item) => sum + (item.Total || 0), 0), [groupedTrendData]);

  const intervalShoplineRoas = intervalSpend > 0 ? (intervalShoplineRev / intervalSpend).toFixed(2) : "0.00";
  const intervalAdRoas = intervalSpend > 0 ? (intervalAdRev / intervalSpend).toFixed(2) : "0.00";

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setActiveLines(prev => ({
      ...prev,
      [dataKey as keyof typeof prev]: !prev[dataKey as keyof typeof prev]
    }));
  };

  const handleSort = (table: string, key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.table === table && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ table, key, direction });
  };

  const getSortedData = (table: string, dataArray: any[] | undefined) => {
    if (!dataArray) return [];
    if (sortConfig?.table !== table) return dataArray;
    return [...dataArray].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortHeader = ({ table, columnKey, label, align = "left" }: { table: string, columnKey: string, label: string, align?: "left" | "right" }) => {
    const isSorted = sortConfig?.table === table && sortConfig?.key === columnKey;
    return (
      <th className={`py-3 px-4 cursor-pointer hover:bg-gray-100 transition select-none text-${align}`} onClick={() => handleSort(table, columnKey)}>
        <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
          {label}
          <span className="text-gray-400 text-xs">{isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕️'}</span>
        </div>
      </th>
    );
  };

  const handleChangePassword = async () => {
    alert(`密碼變更請求已發送 (未來串接後端) \n新密碼長度: ${newPassword.length}`);
    setShowPwdModal(false); setNewPassword("");
  };

  const generateAIInsight = async () => {
    const tenantId = sessionStorage.getItem("tenant_id");
    if (!tenantId) return alert("請先登入");
    setIsGeneratingAI(true); setAiInsight(null);
    try {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, start_date: startDate, end_date: endDate });
      const res = await fetch(`${BACKEND_URL}/api/ai/insights?${queryParams.toString()}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail);
      setAiInsight(result.insights);
    } catch (err: any) { alert(`AI 錯誤: ${err.message}`); } finally { setIsGeneratingAI(false); }
  };

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-semibold animate-pulse">數據載入與分析中...</div>;
  if (error && !data) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="p-6 bg-red-50 text-red-700 rounded text-center"><h2 className="font-bold mb-2">連線異常</h2><p>{error}</p></div></div>;

  const curr = data?.currency || "HKD";

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96">
            <h3 className="text-xl font-bold text-gray-800 mb-4">修改帳戶密碼</h3>
            <input type="password" placeholder="請輸入新密碼" className="w-full px-4 py-2 border rounded-md mb-6 focus:ring-blue-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded transition">取消</button>
              <button onClick={handleChangePassword} disabled={!newPassword} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50">確認變更</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm px-8 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ad-Dash 數據中心</h1>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
          <button onClick={applyMTD} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-100 font-medium transition">MTD</button>
          <button onClick={applyYTD} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-100 font-medium transition">YTD</button>
          <div className="w-px h-5 bg-gray-300 mx-2"></div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <span className="text-gray-400 font-medium">至</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700"/>
          <button onClick={applyDateFilter} className="ml-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 font-medium transition shadow-sm">套用</button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={generateAIInsight} disabled={isGeneratingAI || !data || loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded shadow hover:from-purple-700 transition text-sm font-medium">
            {isGeneratingAI ? "🧠 解析中..." : "✨ AI 報告"}
          </button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="text-sm text-gray-600 font-medium">租戶：{companyName}</span>
          <button onClick={() => setShowPwdModal(true)} className="text-sm px-3 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded transition">修改密碼</button>
          <button onClick={() => { sessionStorage.clear(); router.push("/"); }} className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition font-medium">登出</button>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI 智能行銷總監分析</h2>
            {isGeneratingAI ? (
              <div className="flex justify-center py-10"><div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed bg-purple-50/50 p-6 rounded-lg border border-purple-100">{aiInsight}</pre>
            )}
          </div>
        )}

        {/* 🌟 擴充：頂部五格指標 (雙軌營收卡片) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">總營收與 ROAS (區間)</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">真實營收 (Shopline)</p>
                <p className="text-xl font-bold text-purple-600">{formatCurr(intervalShoplineRev, curr)}</p>
                <p className="text-xs font-medium text-purple-500">真實 ROAS: {intervalShoplineRoas}x</p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">預估營收 (Ads Pixel)</p>
                <p className="text-lg font-bold text-orange-500">{formatCurr(intervalAdRev, curr)}</p>
                <p className="text-xs font-medium text-orange-400">預估 ROAS: {intervalAdRoas}x</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">廣告總花費</h3>
            <p className="text-3xl font-bold text-gray-800">{formatCurr(data?.metrics?.MTD_spend, curr)}</p>
            <p className={`text-sm mt-2 font-medium ${data?.metrics?.MoM_growth_percent! > 0 ? "text-red-500" : "text-green-500"}`}>
              {data?.metrics?.MoM_growth_percent! > 0 ? "↑" : "↓"} {Math.abs(data?.metrics?.MoM_growth_percent || 0)}% MoM
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">平台佔比</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between"><span>Google:</span><span className="font-semibold">{formatCurr(data?.platform_breakdown?.google, curr)}</span></div>
              <div className="flex justify-between"><span>Meta:</span><span className="font-semibold">{formatCurr(data?.platform_breakdown?.meta, curr)}</span></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">網站總流量 (GA4)</h3>
            <p className="text-3xl font-bold text-blue-600">{formatNum(data?.traffic?.sessions)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">自然搜尋點擊 (GSC)</h3>
            <p className="text-3xl font-bold text-emerald-600">{formatNum(data?.seo?.clicks)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">廣告花費與 ROAS 趨勢 ({curr})</h2>
            
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
              {(["day", "week", "month"] as const).map(tg => (
                <button
                  key={tg}
                  onClick={() => setTimeGrouping(tg)}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${timeGrouping === tg ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tg === "day" ? "日" : tg === "week" ? "週" : "月"}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={groupedTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={12} />
                
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickFormatter={((v: any) => formatNum(v)) as any} />
                <YAxis yAxisId="right" orientation="right" stroke="#ff7300" fontSize={12} tickFormatter={((v: any) => `${v}x`) as any} />
                
                <Tooltip 
                  formatter={((value: any, name: string) => {
                    if (name.includes("ROAS")) return [`${value}x`, name];
                    return [formatCurr(value, curr), name];
                  }) as any} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.12)' }} 
                />
                
                <Legend 
                  iconType="circle" 
                  onClick={handleLegendClick}
                  wrapperStyle={{ paddingTop: '20px', cursor: 'pointer', userSelect: 'none' }} 
                />
                
                {/* 🌟 擴充：雙軌營收與 ROAS 折線 */}
                <Line hide={!activeLines.Shopline_Rev} yAxisId="left" type="monotone" dataKey="Shopline_Rev" name="真實營收 (Shopline)" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line hide={!activeLines.Ad_Conv_Val} yAxisId="left" type="monotone" dataKey="Ad_Conv_Val" name="預估營收 (Ads)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                
                <Line hide={!activeLines.Google} yAxisId="left" type="monotone" dataKey="Google" name="Google 花費" stroke="#4285F4" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                <Line hide={!activeLines.Meta} yAxisId="left" type="monotone" dataKey="Meta" name="Meta 花費" stroke="#1877F2" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                <Line hide={!activeLines.Total} yAxisId="left" type="monotone" dataKey="Total" name="總花費" stroke="#10b981" strokeWidth={3} dot={false} />
                
                <Line hide={!activeLines.Shopline_ROAS} yAxisId="right" type="monotone" dataKey="Shopline_ROAS" name="真實 ROAS" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line hide={!activeLines.Ad_ROAS} yAxisId="right" type="monotone" dataKey="Ad_ROAS" name="預估 ROAS" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">各平台深度洞察 (Deep Dive)</h2>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Google Ads 廣告活動成效</h3>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <SortHeader table="google" columnKey="campaign_name" label="Campaign Name" />
                  <SortHeader table="google" columnKey="cost" label="Cost" align="right" />
                  <SortHeader table="google" columnKey="impressions" label="Impr." align="right" />
                  <SortHeader table="google" columnKey="clicks" label="Clicks" align="right" />
                  <SortHeader table="google" columnKey="conversions" label="Conv." align="right" />
                  <SortHeader table="google" columnKey="conversion_value" label="Conv. Value" align="right" />
                  <SortHeader table="google" columnKey="roas" label="ROAS" align="right" />
                </tr>
              </thead>
              <tbody>
                {getSortedData('google', data?.google_ads_details).map((ad: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ad.campaign_name}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurr(ad.cost, curr)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.impressions)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.clicks)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.conversions)}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurr(ad.conversion_value, curr)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{ad.roas}x</td>
                  </tr>
                ))}
                {!data?.google_ads_details?.length && <tr><td colSpan={7} className="py-8 text-center text-gray-400">目前沒有資料</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="text-lg font-bold text-blue-800 mb-4">Meta Ads 廣告活動成效</h3>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <SortHeader table="meta" columnKey="campaign_name" label="Campaign Name" />
                  <SortHeader table="meta" columnKey="spend" label="Spend" align="right" />
                  <SortHeader table="meta" columnKey="impressions" label="Impr." align="right" />
                  <SortHeader table="meta" columnKey="clicks" label="Clicks" align="right" />
                  <SortHeader table="meta" columnKey="conversions" label="Purchases" align="right" />
                  <SortHeader table="meta" columnKey="cpa" label="CPA" align="right" />
                  <SortHeader table="meta" columnKey="roas" label="ROAS" align="right" />
                </tr>
              </thead>
              <tbody>
                {getSortedData('meta', data?.meta_ads_details).map((ad: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ad.campaign_name}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurr(ad.spend, curr)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.impressions)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.clicks)}</td>
                    <td className="py-3 px-4 text-right">{formatNum(ad.conversions)}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-500">{formatCurr(ad.cpa, curr)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{ad.roas}x</td>
                  </tr>
                ))}
                {!data?.meta_ads_details?.length && <tr><td colSpan={7} className="py-8 text-center text-gray-400">目前沒有 Meta 廣告資料，或是等待後端串接中...</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <h3 className="text-lg font-bold text-emerald-600 mb-4">GSC: Top 20 搜尋關鍵字</h3>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <SortHeader table="gsc" columnKey="keyword" label="Keyword" />
                    <SortHeader table="gsc" columnKey="clicks" label="Clicks" align="right" />
                    <SortHeader table="gsc" columnKey="impressions" label="Impr." align="right" />
                  </tr>
                </thead>
                <tbody>
                  {getSortedData('gsc', data?.gsc_keywords).map((k: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{k.keyword}</td>
                      <td className="py-3 px-4 text-right">{formatNum(k.clicks)}</td>
                      <td className="py-3 px-4 text-right">{formatNum(k.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <h3 className="text-lg font-bold text-orange-500 mb-4">GA4: Top 網頁標題</h3>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <SortHeader table="ga4" columnKey="page_title" label="Page Title" />
                    <SortHeader table="ga4" columnKey="visits" label="Visits" align="right" />
                    <SortHeader table="ga4" columnKey="bounce_rate" label="Bounce Rate" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {getSortedData('ga4', data?.ga4_top_pages).map((p: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 truncate max-w-[300px] font-medium" title={p.page_title}>{p.page_title}</td>
                      <td className="py-2 px-4 text-right">{formatNum(p.visits)}</td>
                      <td className="py-2 px-4 text-right">{p.bounce_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}