"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AnalysisResult {
  competitor_name: string;
  scraped_content: string;
  image_url?: string;
  insights: string;
}

export default function CompetitorPage() {
  const router = useRouter();
  const [postUrl, setPostUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // 🛡️ 資安防禦：閒置登出與憑證確認
  useEffect(() => {
    const storedTenant = sessionStorage.getItem("tenant_id");
    const storedCompany = sessionStorage.getItem("company_name");

    if (!storedTenant) {
      alert("憑證已失效，請先登入系統。");
      router.replace("/");
      return;
    }

    if (storedCompany) {
      setCompanyName(storedCompany);
    }
  }, [router]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = sessionStorage.getItem("tenant_id");

    if (!tenantId) {
      alert("請先登入商戶帳號");
      return;
    }

    if (!postUrl.trim().startsWith("http")) {
      alert("請輸入有效的貼文網址 (包含 http:// 或 https://)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/competitor/analyze?tenant_id=${encodeURIComponent(tenantId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: postUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "競品分析失敗，請稍後重試。");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* 頂部導覽列 */}
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-blue-600 transition flex items-center gap-1"
          >
            ← 返回數據中心
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-xl font-bold text-gray-800">🎯 競品 AI 內容戰情室 (FB / IG)</h1>
        </div>
        <span className="text-sm text-gray-600 font-medium">當前商戶：{companyName}</span>
      </header>

      {/* 主體內容區 */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* 輸入卡片 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-2">輸入競品貼文連結</h2>
          <p className="text-sm text-gray-500 mb-4">
            貼上競品的 Facebook 粉專貼文或 Instagram 貼文/Reels 網址，系統將透過 Apify 抓取素材並由 Gemini 視覺 AI 進行拆解與部署建議。
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="例如: https://www.instagram.com/p/Cxxxxxxx/ 或 https://www.facebook.com/..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50"
            />
            <button
              type="submit"
              disabled={loading || !postUrl}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg text-sm hover:from-purple-700 transition disabled:opacity-50 shadow-md whitespace-nowrap"
            >
              {loading ? "🔍 深度解析中..." : "🚀 開始 AI 分析"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
              ❌ 分析失敗：{error}
            </div>
          )}
        </div>

        {/* 載入中動畫 */}
        {loading && (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center space-y-4">
            <div className="inline-block h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-semibold animate-pulse">
              正在透過 Apify 抓取公開貼文素材，並傳送至 Gemini 多模態視覺 AI 進行拆解...
            </p>
          </div>
        )}

        {/* 分析結果雙欄展示 */}
        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
            {/* 左欄：競品原始素材 (4 欄) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2.5 py-1 rounded">
                    競品品牌
                  </span>
                  <h3 className="font-bold text-gray-800 text-base">{result.competitor_name}</h3>
                </div>

                {/* 貼文圖片預覽 */}
                {result.image_url ? (
                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 bg-black/5 aspect-square relative">
                    <img
                      src={result.image_url}
                      alt="競品素材預覽"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 p-8 bg-gray-50 border border-dashed rounded-lg text-center text-xs text-gray-400">
                    此貼文無圖片素材或圖片為動態影片
                  </div>
                )}

                {/* 文案預覽 */}
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">原始文案內容</h4>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-gray-100">
                  {result.scraped_content || "無文字描述"}
                </div>
              </div>
            </div>

            {/* 右欄：AI 策略分析艙 (8 欄) */}
            <div className="lg:col-span-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-purple-600 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🤖 行銷總監 AI 深度解析報告
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    Model: Gemini 1.5 Flash
                  </span>
                </div>

                <div className="prose max-w-none text-gray-800">
                  <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed bg-purple-50/40 p-6 rounded-lg border border-purple-100 text-gray-800">
                    {result.insights}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}