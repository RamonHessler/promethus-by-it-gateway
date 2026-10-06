import http from "node:http";
import crypto from "node:crypto";

const PORT = process.env.PORT || 3000;
const BYBIT_BASE = "https://api.bybit.com";
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

async function bybit(path, auth = false) {
  const headers = {};
  const url = BYBIT_BASE + path;
  if (auth) {
    const key = process.env.BYBIT_API_KEY;
    const secret = process.env.BYBIT_API_SECRET;
    if (!key || !secret) throw new Error("Bybit credentials not configured");
    const ts = Date.now().toString();
    const rw = "5000";
    const query = path.includes("?") ? path.split("?")[1] : "";
    headers["X-BAPI-API-KEY"] = key;
    headers["X-BAPI-TIMESTAMP"] = ts;
    headers["X-BAPI-RECV-WINDOW"] = rw;
    headers["X-BAPI-SIGN"] = crypto.createHmac("sha256", secret).update(ts + key + rw + query).digest("hex");
  }
  const r = await fetch(url, { headers });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
  return { status: r.status, data };
}

const validSymbol = (symbol) => /^[A-Z0-9]{3,20}$/.test(symbol);

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
    if (req.url === "/health") return json(res, 200, { ok: true, service: "prometheus-bybit-gateway" });

    if (req.url === "/bybit/public-time") {
      const x = await bybit("/v5/market/time");
      return json(res, x.status, { reachable: x.status === 200, retCode: x.data?.retCode ?? null, retMsg: x.data?.retMsg ?? null });
    }

    if (req.url === "/bybit/spot-universe") {
      const [i, t] = await Promise.all([
        bybit("/v5/market/instruments-info?category=spot&limit=1000"),
        bybit("/v5/market/tickers?category=spot"),
      ]);
      if (i.status !== 200 || t.status !== 200) return json(res, 502, { error: "bybit_universe_unavailable" });
      const ticks = new Map((t.data?.result?.list ?? []).map(x => [x.symbol, x]));
      const stable = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDD"]);
      const assets = (i.data?.result?.list ?? [])
        .filter(x => x.status === "Trading" && x.quoteCoin === "USDT")
        .map(x => {
          const q = ticks.get(x.symbol) || {};
          const turnover24h = Number(q.turnover24h || 0);
          const volume24h = Number(q.volume24h || 0);
          const bid = Number(q.bid1Price || 0);
          const ask = Number(q.ask1Price || 0);
          const last = Number(q.lastPrice || 0);
          const spreadPct = bid > 0 && ask >= bid ? ((ask - bid) / ((ask + bid) / 2)) * 100 : null;
          const eligible = !stable.has(x.baseCoin) && turnover24h >= 100000 && last > 0 && spreadPct !== null && spreadPct <= 1;
          return {
            symbol: x.symbol, baseCoin: x.baseCoin, quoteCoin: x.quoteCoin, lastPrice: last,
            change24hPct: Number(q.price24hPcnt || 0) * 100, turnover24h, volume24h, spreadPct, eligible,
            reasons: [
              ...(stable.has(x.baseCoin) ? ["stablecoin_base"] : []),
              ...(turnover24h < 100000 ? ["low_turnover"] : []),
              ...(spreadPct === null || spreadPct > 1 ? ["spread"] : []),
            ],
          };
        });
      return json(res, 200, {
        market: "MARKET-01", provider: "BYBIT", category: "spot", quote: "USDT",
        count: assets.length, eligibleCount: assets.filter(x => x.eligible).length,
        filters: { minTurnover24h: 100000, maxSpreadPct: 1, excludeStablecoinBase: true },
        assets, checkedAt: new Date().toISOString(),
      });
    }

    if (req.url === "/bybit/eligible-symbols") {
      const [i, t] = await Promise.all([
        bybit("/v5/market/instruments-info?category=spot&limit=1000"),
        bybit("/v5/market/tickers?category=spot"),
      ]);
      const ticks = new Map((t.data?.result?.list ?? []).map(x => [x.symbol, x]));
      const stable = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDD"]);
      const symbols = (i.data?.result?.list ?? []).filter(x => {
        const q = ticks.get(x.symbol) || {};
        const bid = Number(q.bid1Price || 0), ask = Number(q.ask1Price || 0), turn = Number(q.turnover24h || 0);
        const spread = bid > 0 && ask >= bid ? ((ask - bid) / ((ask + bid) / 2)) * 100 : 999;
        return x.status === "Trading" && x.quoteCoin === "USDT" && !stable.has(x.baseCoin) && turn >= 100000 && spread <= 1;
      }).map(x => x.symbol);
      return json(res, 200, { symbols, count: symbols.length, checkedAt: new Date().toISOString() });
    }

    if (req.url === "/bybit/account-status") {
      const x = await bybit("/v5/account/wallet-balance?accountType=UNIFIED", true);
      return json(res, x.status, {
        authenticated: x.status === 200 && x.data?.retCode === 0,
        retCode: x.data?.retCode ?? null,
        retMsg: x.data?.retMsg ?? null,
        accountType: x.data?.result?.list?.[0]?.accountType ?? null,
      });
    }

    if (req.url === "/bybit/reconciliation") {
      const x = await bybit("/v5/account/wallet-balance?accountType=UNIFIED", true);
      const a = x.data?.result?.list?.[0];
      if (x.status !== 200 || x.data?.retCode !== 0 || !a) {
        return json(res, x.status, { authenticated: false, retCode: x.data?.retCode ?? null, retMsg: x.data?.retMsg ?? null });
      }
      const coins = (a.coin ?? [])
        .filter(c => Number(c.walletBalance || 0) !== 0)
        .map(c => ({ coin: c.coin, walletBalance: Number(c.walletBalance || 0), usdValue: Number(c.usdValue || 0) }));
      return json(res, 200, {
        authenticated: true, accountType: a.accountType ?? "UNIFIED",
        totalEquity: Number(a.totalEquity || 0), totalWalletBalance: Number(a.totalWalletBalance || 0),
        totalAvailableBalance: Number(a.totalAvailableBalance || 0), coins,
        checkedAt: new Date().toISOString(), readOnly: true,
      });
    }

    if (req.url === "/bybit/api-key-info") {
      const x = await bybit("/v5/user/query-api", true);
      const r = x.data?.result;
      if (x.status !== 200 || x.data?.retCode !== 0 || !r) {
        return json(res, x.status, { authenticated: false, retCode: x.data?.retCode ?? null, retMsg: x.data?.retMsg ?? null });
      }
      return json(res, 200, {
        authenticated: true,
        readOnly: Number(r.readOnly ?? 1) === 1,
        permissions: r.permissions ?? {},
        expiredAt: r.expiredAt ?? null,
        checkedAt: new Date().toISOString(),
      });
    }

    if (req.url?.startsWith("/bybit/fee-rate")) {
      const u = new URL(req.url, "http://local");
      const symbol = (u.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
      if (!validSymbol(symbol)) return json(res, 400, { error: "invalid_symbol" });
      const x = await bybit("/v5/account/fee-rate?category=spot&symbol=" + encodeURIComponent(symbol), true);
      const row = x.data?.result?.list?.[0];
      if (x.status !== 200 || x.data?.retCode !== 0 || !row) {
        return json(res, x.status, { authenticated: false, retCode: x.data?.retCode ?? null, retMsg: x.data?.retMsg ?? null, symbol });
      }
      return json(res, 200, {
        authenticated: true, symbol,
        makerFeeRate: Number(row.makerFeeRate),
        takerFeeRate: Number(row.takerFeeRate),
        checkedAt: new Date().toISOString(),
      });
    }

    if (req.url?.startsWith("/bybit/instrument-info")) {
      const u = new URL(req.url, "http://local");
      const symbol = (u.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
      if (!validSymbol(symbol)) return json(res, 400, { error: "invalid_symbol" });
      const x = await bybit("/v5/market/instruments-info?category=spot&symbol=" + encodeURIComponent(symbol));
      const row = x.data?.result?.list?.[0];
      if (x.status !== 200 || x.data?.retCode !== 0 || !row) {
        return json(res, x.status, { reachable: false, retCode: x.data?.retCode ?? null, retMsg: x.data?.retMsg ?? null, symbol });
      }
      return json(res, 200, {
        reachable: true, symbol,
        baseCoin: row.baseCoin, quoteCoin: row.quoteCoin, status: row.status,
        lotSizeFilter: {
          minOrderAmt: Number(row.lotSizeFilter?.minOrderAmt ?? 0),
          minOrderQty: Number(row.lotSizeFilter?.minOrderQty ?? 0),
          basePrecision: row.lotSizeFilter?.basePrecision ?? null,
          quotePrecision: row.lotSizeFilter?.quotePrecision ?? null,
          qtyStep: row.lotSizeFilter?.qtyStep == null ? null : Number(row.lotSizeFilter.qtyStep),
          maxOrderQty: Number(row.lotSizeFilter?.maxOrderQty ?? 0),
        },
        priceFilter: { tickSize: Number(row.priceFilter?.tickSize ?? 0) },
        checkedAt: new Date().toISOString(),
      });
    }

    if (req.url?.startsWith("/bybit/klines")) {
      const u = new URL(req.url, "http://local");
      const symbol = (u.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
      const interval = u.searchParams.get("interval") || "60";
      const limit = u.searchParams.get("limit") || "500";
      if (!validSymbol(symbol)) return json(res, 400, { error: "invalid_symbol" });
      const x = await bybit("/v5/market/kline?category=spot&symbol=" + symbol + "&interval=" + interval + "&limit=" + limit);
      const rows = x.data?.result?.list ?? [];
      return json(res, x.status, {
        reachable: x.status === 200 && x.data?.retCode === 0, symbol,
        closes: rows.slice().reverse().map(c => Number(c[4])).filter(Number.isFinite),
      });
    }

    return json(res, 404, { error: "not_found" });
  } catch (e) {
    return json(res, 500, { error: e instanceof Error ? e.message : "gateway_error" });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log("gateway listening"));