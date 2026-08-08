# ==========================================
# 🚀 防禦升級版：GA4 與 GSC 抓取模組
# ==========================================
@app.post("/api/data/fetch-ga4")
def fetch_ga4_data(tenant_id: str, ga4_property_id: str):
    try:
        # 若尚未授權，這裡會直接被 Try Catch 攔截
        access_token, _ = get_google_access_token(tenant_id)
        with engine.connect() as connection:
            connection.execute(text("INSERT INTO integrations (tenant_id, platform_name, platform_account_id) VALUES (CAST(:id AS UUID), 'ga4', :acc) ON CONFLICT (tenant_id, platform_name) DO UPDATE SET platform_account_id = :acc;"), {"id": tenant_id, "acc": ga4_property_id})
            connection.commit()
            
        yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        url = f"https://analyticsdata.googleapis.com/v1beta/properties/{ga4_property_id}:runReport"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {"dateRanges": [{"startDate": yesterday, "endDate": yesterday}], "metrics": [{"name": "sessions"}, {"name": "screenPageViews"}]}
        
        res = requests.post(url, headers=headers, json=payload).json()
        if "error" in res: raise Exception(res["error"]["message"])
        sessions = int(res["rows"][0]["metricValues"][0]["value"]) if "rows" in res else 0
        page_views = int(res["rows"][0]["metricValues"][1]["value"]) if "rows" in res else 0
        
        with engine.connect() as connection:
            connection.execute(text("INSERT INTO ga4_metrics (tenant_id, date, sessions, page_views) VALUES (CAST(:id AS UUID), :d, :s, :p)"), {"id": tenant_id, "d": yesterday, "s": sessions, "p": page_views})
            connection.commit()
        return {"status": "success", "message": f"成功抓取 GA4 數據 (Sessions: {sessions})"}
    except HTTPException:
        raise
    except Exception as e:
        # 將所有未預期的崩潰轉化為標準的 HTTP 400 錯誤，確保 CORS 標頭正常運作
        raise HTTPException(status_code=400, detail=f"抓取失敗，請確認是否已完成 Google 授權，或檢查 Property ID。錯誤細節: {str(e)}")

@app.post("/api/data/fetch-gsc")
def fetch_gsc_data(tenant_id: str, gsc_site_url: str):
    try:
        access_token, _ = get_google_access_token(tenant_id)
        with engine.connect() as connection:
            connection.execute(text("INSERT INTO integrations (tenant_id, platform_name, platform_account_id) VALUES (CAST(:id AS UUID), 'gsc', :acc) ON CONFLICT (tenant_id, platform_name) DO UPDATE SET platform_account_id = :acc;"), {"id": tenant_id, "acc": gsc_site_url})
            connection.commit()

        yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        safe_site_url = urllib.parse.quote(gsc_site_url, safe='')
        url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{safe_site_url}/searchAnalytics/query"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {"startDate": yesterday, "endDate": yesterday, "dimensions": ["date"]}
        
        res = requests.post(url, headers=headers, json=payload).json()
        if "error" in res: raise Exception(res["error"]["message"])
        clicks = impressions = 0; position = 0.0
        if "rows" in res and len(res["rows"]) > 0:
            clicks = int(res["rows"][0]["clicks"])
            impressions = int(res["rows"][0]["impressions"])
            position = float(res["rows"][0]["position"])
            
        with engine.connect() as connection:
            connection.execute(text("INSERT INTO gsc_metrics (tenant_id, date, clicks, impressions, position) VALUES (CAST(:id AS UUID), :d, :c, :i, :p)"), {"id": tenant_id, "d": yesterday, "c": clicks, "i": impressions, "p": position})
            connection.commit()
        return {"status": "success", "message": f"成功抓取 GSC 數據 (Clicks: {clicks})"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"抓取失敗，請確認是否已完成 Google 授權，或檢查網址格式。錯誤細節: {str(e)}")