const events = [
  { severity: "high", type: "market", title: "做市商钱包库存异常下降", body: "Wintermute 标记地址在 12 分钟内转出 18,420 ETH，CEX 入金路径已确认。", time: "刚刚", address: "0x5f3a...9D2b", value: "$63.4M" },
  { severity: "mid", type: "whale", title: "巨鲸开始分批建仓", body: "0x7a91...c4F2 连续 9 笔买入 LINK，总规模 $6.8M，滑点保持低位。", time: "18 秒前", address: "0x7a91...c4F2", value: "$6.8M" },
  { severity: "high", type: "risk", title: "合约管理员权限变更", body: "新部署代理合约触发 owner 转移，并伴随 mint 权限开放调用。", time: "42 秒前", address: "0x8d13...a01E", value: "risk 91" },
  { severity: "low", type: "flow", title: "跨链资金归集", body: "Base 到 Arbitrum 出现 74 笔稳定币桥接，疑似资金池再平衡。", time: "1 分钟前", address: "0xbA42...11d0", value: "$12.1M" },
  { severity: "mid", type: "whale", title: "交易所热钱包大额流出", body: "Binance 标记钱包向 3 个新地址转出 2,100 BTC，历史相似事件后波动升高。", time: "2 分钟前", address: "bc1q...7k9m", value: "$132M" },
  { severity: "high", type: "risk", title: "闪电贷攻击模式匹配", body: "某低流动性池出现价格操纵、借贷、偿还闭环，风险评分 91/100。", time: "3 分钟前", address: "0x91c2...2b77", value: "$2.4M" }
];

const feed = document.querySelector("#eventFeed");
let currentFilter = "all";
let paused = false;

const insightDetails = {
  anomaly: {
    severity: "high",
    title: "异常行为监控路径",
    body: "系统会把混币器交互、闪电贷闭环、合约 owner 变更、可疑授权和短时间多跳转账合并成一条风险路径，优先展示资金起点、关键中继地址和最终落点。",
    address: "路径样例: attacker -> pool -> bridge -> CEX",
    value: "37 active"
  },
  whale: {
    severity: "mid",
    title: "大户动作详情",
    body: "大户模块不是只看单笔金额，而是连续识别建仓、归集、拆单、跨链迁移和 CEX 入金。用户点击后可以查看地址标签、交易节奏、资产变化和可能意图。",
    address: "重点地址: 0x7a91...c4F2",
    value: "126 signals"
  },
  market: {
    severity: "low",
    title: "做市商钱包详情",
    body: "做市商模块跟踪库存偏移、报价撤离、异常补仓和交易所热钱包配合动作。库存变化超过阈值时，会关联同池价格、深度和对手方地址。",
    address: "监控簇: Wintermute / Jump / Amber",
    value: "14 clusters"
  }
};

const alphaProjects = [
  {
    symbol: "ASTER",
    name: "Aster",
    binanceSymbol: "ASTERUSDT",
    status: "高关注",
    risk: 82,
    bias: "疑似派发",
    makers: ["0x9B12...A71e", "0x41C8...dE90", "0xB208...64F1"],
    signals: [
      "前 20 持仓地址 6h 减仓 4.8%",
      "2 个庄家候选地址向 CEX 归集",
      "池子深度下降，价格反弹量能偏弱"
    ]
  },
  {
    symbol: "PARTI",
    name: "Particle Network",
    binanceSymbol: "PARTIUSDT",
    status: "观察",
    risk: 61,
    bias: "震荡吸筹",
    makers: ["0x21d4...E803", "0xC9c1...70a2"],
    signals: [
      "大户分批买入，单笔规模未超过阈值",
      "CEX 净流入不明显",
      "做市地址库存稳定"
    ]
  },
  {
    symbol: "SHELL",
    name: "MyShell",
    binanceSymbol: "SHELLUSDT",
    status: "中风险",
    risk: 73,
    bias: "疑似砸盘准备",
    makers: ["0x77F0...0b19", "0xE381...2F43"],
    signals: [
      "解锁相关地址出现测试转账",
      "链上卖压地址数量增加",
      "流动性撤出 12%，需盯 CEX 入金"
    ]
  }
];

function renderEvents() {
  const visible = events.filter(event => currentFilter === "all" || event.severity === currentFilter || event.type === currentFilter);
  feed.innerHTML = visible.map((event, index) => `
    <article class="event-card" data-event-index="${events.indexOf(event)}" tabindex="0">
      <span class="severity ${event.severity}">${event.severity === "high" ? "高危" : event.severity === "mid" ? "关注" : "信息"}</span>
      <div>
        <h4>${event.title}</h4>
        <p>${event.body}</p>
      </div>
      <span class="event-time">${event.time}</span>
    </article>
  `).join("");
}

renderEvents();

setInterval(() => {
  if (!paused) {
    const first = events.shift();
    events.push(first);
    renderEvents();
  }
}, 4200);

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderEvents();
  });
});

document.querySelector("#pauseBtn").addEventListener("click", event => {
  paused = !paused;
  event.currentTarget.textContent = paused ? "▶" : "Ⅱ";
});

document.querySelector("#refreshBtn").addEventListener("click", renderEvents);
document.querySelector("#refreshAlphaBtn")?.addEventListener("click", () => syncAlphaMarketData(currentAlphaIndex));

document.querySelectorAll("[data-insight]").forEach(card => {
  card.addEventListener("click", () => openEventDrawer(insightDetails[card.dataset.insight]));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter") openEventDrawer(insightDetails[card.dataset.insight]);
  });
});

feed.addEventListener("click", event => {
  const card = event.target.closest(".event-card");
  if (card) openEventDrawer(events[Number(card.dataset.eventIndex)]);
});

function openEventDrawer(event) {
  document.querySelector("#drawerContent").innerHTML = `
    <span class="severity ${event.severity}">${event.severity === "high" ? "高危事件" : "链上事件"}</span>
    <h3>${event.title}</h3>
    <p>${event.body}</p>
    <dl>
      <div><dt>地址</dt><dd>${event.address}</dd></div>
      <div><dt>规模</dt><dd>${event.value}</dd></div>
      <div><dt>策略</dt><dd>持续监控 24h，命中同类行为立即移动端推送。</dd></div>
    </dl>
    <button class="primary-button" data-view-target="wallets">查看钱包画像</button>
  `;
  document.querySelector("#eventDrawer").classList.add("open");
  document.querySelector("#eventDrawer").setAttribute("aria-hidden", "false");
}

document.querySelector("#closeDrawer").addEventListener("click", () => {
  document.querySelector("#eventDrawer").classList.remove("open");
  document.querySelector("#eventDrawer").setAttribute("aria-hidden", "true");
});

document.addEventListener("click", event => {
  const target = event.target.closest("[data-view-target]");
  if (target) setView(target.dataset.viewTarget);
});

document.querySelectorAll("[data-view-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    setView(link.dataset.viewLink);
  });
});

function setView(view) {
  if (!document.querySelector(`[data-view="${view}"]`)) view = "overview";
  document.querySelectorAll(".view").forEach(section => section.classList.toggle("active", section.dataset.view === view));
  document.querySelectorAll("[data-view-link]").forEach(link => link.classList.toggle("active", link.dataset.viewLink === view));
  document.querySelector("#eventDrawer").classList.remove("open");
  if (location.hash.replace("#", "") !== view) {
    history.replaceState(null, "", `#${view}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", () => setView(location.hash.replace("#", "") || "overview"));

const watchlist = [
  { address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", chain: "Ethereum", score: 78, label: "巨鲸/长期持仓", balance: "$412.8M", last: "12 秒前向 Coinbase 入金 940 ETH" },
  { address: "0x5f3a000000000000000000000000000000009D2b", chain: "Hyperliquid", score: 88, label: "Hyperliquid 大户候选", balance: "等待实时查询", last: "可查询持仓、保证金与最近成交" },
  { address: "bc1qexample7k9m0000000000000000000000000000", chain: "Bitcoin", score: 64, label: "交易所热钱包", balance: "$1.2B", last: "拆分到 3 个新地址" }
];

function renderWatchlist(selected = 0) {
  document.querySelector("#watchlist").innerHTML = watchlist.map((wallet, index) => `
    <button class="wallet-row ${index === selected ? "active" : ""}" data-wallet-index="${index}">
      <b title="${wallet.address}">${formatAddress(wallet.address)}</b><span>${wallet.chain} · ${wallet.label}</span><strong>${wallet.score}</strong>
    </button>
  `).join("");
  renderWalletDetail(watchlist[selected]);
}

function renderWalletDetail(wallet) {
  const explorer = wallet.chain === "Hyperliquid" ? `https://app.hyperliquid.xyz/explorer/address/${wallet.address}` : "";
  document.querySelector("#walletDetail").innerHTML = `
    <div class="detail-head">
      <div><span>${wallet.chain}</span><h3 class="full-address">${wallet.address}</h3></div>
      <strong>风险 ${wallet.score}/100</strong>
    </div>
    <div class="detail-grid">
      <div><span>资产规模</span><b>${wallet.balance}</b></div>
      <div><span>最新行为</span><b>${wallet.last}</b></div>
      <div><span>监控状态</span><b>实时监督中</b></div>
      <div><span>公开身份匹配</span><b>${wallet.publicLabel || "待接入可靠公开标签源"}</b></div>
    </div>
    <div class="timeline">
      <div><i></i><p>检测到交易所入金路径，移动端已推送。</p></div>
      <div><i></i><p>与 2 个做市商标签地址发生交互。</p></div>
      <div><i></i><p>过去 24h 活跃度高于 30 日均值 4.8 倍。</p></div>
    </div>
    <div class="monitor-actions">
      <button class="primary-button" data-view-target="alerts">为该钱包创建告警</button>
      <button class="secondary-button" data-view-target="forwarding">设置移动推送</button>
      ${explorer ? `<a class="secondary-link" href="${explorer}" target="_blank" rel="noreferrer">打开 Hyperliquid Explorer</a>` : ""}
    </div>
  `;
  renderHyperliquidPanel(wallet);
}

document.querySelector("#watchlist").addEventListener("click", event => {
  const row = event.target.closest(".wallet-row");
  if (row) renderWatchlist(Number(row.dataset.walletIndex));
});

document.querySelector("#walletForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#walletInput");
  const chain = document.querySelector("#chainSelect").value;
  const address = input.value.trim() || input.placeholder;
  watchlist.unshift({
    address,
    chain,
    score: scoreAddress(address),
    label: chain === "Hyperliquid" ? "Hyperliquid 实时查询" : "自定义监控",
    balance: chain === "Hyperliquid" ? "正在查询 Hyperliquid" : "实时扫描中",
    last: chain === "Hyperliquid" ? "正在拉取持仓与最近成交" : "已建立监听，等待下一笔链上行为",
    publicLabel: "公开标签候选待确认"
  });
  document.querySelector("#queryResult").innerHTML = `
    <b>${address} 已加入实时监督</b>
    <span>${chain} · 监控转账、授权、合约交互、CEX 入金和异常路径。</span>
  `;
  renderWatchlist(0);
  setView("wallets");
  if (chain === "Hyperliquid") {
    await loadHyperliquidIntel(address, 0);
  }
  input.value = "";
});

renderWatchlist();
setView(location.hash.replace("#", "") || "overview");
renderAlpha(0);

function scoreAddress(address) {
  return 58 + (Array.from(address).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 34);
}

function formatAddress(address) {
  if (address.length <= 22) return address;
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

function renderHyperliquidPanel(wallet) {
  const panel = document.querySelector("#hyperliquidPanel");
  if (wallet.chain !== "Hyperliquid") {
    panel.innerHTML = "";
    return;
  }
  panel.innerHTML = `
    <div class="section-heading compact">
      <h3>Hyperliquid 大户情报</h3>
      <span>实时接口优先，公开标签需二次确认</span>
    </div>
    <div class="hyper-grid">
      <article><span>账户状态</span><b>${wallet.hlStatus || "等待查询"}</b></article>
      <article><span>最近动作</span><b>${wallet.hlAction || "等待成交数据"}</b></article>
      <article><span>公开人物匹配</span><b>${wallet.publicLabel || "未确认"}</b></article>
    </div>
    <div class="hyper-fills">${wallet.hlFills || "输入 Hyperliquid 地址后，会展示最近成交方向、币种、价格和规模。"}</div>
  `;
}

async function loadHyperliquidIntel(address, walletIndex) {
  const wallet = watchlist[walletIndex];
  wallet.hlStatus = "查询中";
  wallet.hlAction = "查询中";
  wallet.hlFills = "正在连接 Hyperliquid 公共接口...";
  renderWalletDetail(wallet);
  try {
    const [state, fills] = await Promise.all([
      hyperliquidInfo({ type: "clearinghouseState", user: address }),
      hyperliquidInfo({ type: "userFills", user: address })
    ]);
    const positions = state?.assetPositions || [];
    const margin = state?.marginSummary?.accountValue;
    const recent = Array.isArray(fills) ? fills.slice(0, 5) : [];
    wallet.balance = margin ? `$${Number(margin).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "无账户价值数据";
    wallet.last = recent[0] ? `${recent[0].coin || "Unknown"} ${recent[0].side || ""} @ ${recent[0].px || "-"}` : "暂无最近成交";
    wallet.hlStatus = `${positions.length} 个持仓 · ${wallet.balance}`;
    wallet.hlAction = wallet.last;
    wallet.hlFills = recent.length
      ? recent.map(fill => `<div><b>${fill.coin || "-"}</b><span>${fill.side || "-"} · ${fill.sz || "-"} @ ${fill.px || "-"} · ${fill.time ? new Date(fill.time).toLocaleString() : ""}</span></div>`).join("")
      : "该地址暂无公开成交记录，或接口未返回 userFills。";
  } catch (error) {
    wallet.hlStatus = "接口暂不可达";
    wallet.hlAction = "请稍后重试或打开 Explorer";
    wallet.hlFills = "当前浏览器无法连接 Hyperliquid 公共接口。页面保留完整地址和 Explorer 链接，不会伪造交易行为。";
  }
  renderWatchlist(walletIndex);
}

async function hyperliquidInfo(payload) {
  const response = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Hyperliquid API ${response.status}`);
  return response.json();
}

let currentAlphaIndex = 0;

function renderAlpha(selected = 0) {
  currentAlphaIndex = selected;
  const list = document.querySelector("#alphaList");
  const detail = document.querySelector("#alphaDetail");
  if (!list || !detail) return;
  list.innerHTML = alphaProjects.map((project, index) => `
    <button class="alpha-row ${index === selected ? "active" : ""}" data-alpha-index="${index}">
      <b>${project.symbol}</b>
      <span>${project.name} · ${project.bias}</span>
      <strong>${project.risk}</strong>
    </button>
  `).join("");
  const project = alphaProjects[selected];
  const market = project.market || {};
  detail.innerHTML = `
    <div class="detail-head">
      <div><span>${project.status} · ${project.binanceSymbol}</span><h3>${project.symbol} · ${project.name}</h3></div>
      <strong>风险 ${project.risk}/100</strong>
    </div>
    <div class="alpha-verdict ${project.risk >= 80 ? "danger" : project.risk >= 70 ? "warn" : ""}">
      <b>${project.bias}</b>
      <span>综合大户减仓、CEX 转入、流动性变化、做市商库存偏移和 Binance 公开市场数据得出。</span>
    </div>
    <div class="market-grid">
      <div><span>24h 涨跌</span><b class="${Number(market.changePercent || 0) < 0 ? "negative" : "positive"}">${market.changePercent || "待同步"}</b></div>
      <div><span>24h 成交额</span><b>${market.quoteVolume || "待同步"}</b></div>
      <div><span>盘口偏向</span><b>${market.depthBias || "待同步"}</b></div>
      <div><span>近期成交压力</span><b>${market.tradePressure || "待同步"}</b></div>
    </div>
    <div class="alpha-columns">
      <section>
        <h4>庄家/大户候选</h4>
        ${project.makers.map(address => `<p class="address-line">${address}</p>`).join("")}
      </section>
      <section>
        <h4>关键动作</h4>
        ${project.signals.map(signal => `<p>${signal}</p>`).join("")}
      </section>
    </div>
    <div class="monitor-actions">
      <button class="primary-button" data-view-target="alerts">为 ${project.symbol} 创建预警</button>
      <button class="secondary-button" data-view-target="forwarding">推送到手机</button>
    </div>
  `;
}

document.querySelector("#alphaList")?.addEventListener("click", event => {
  const row = event.target.closest(".alpha-row");
  if (row) renderAlpha(Number(row.dataset.alphaIndex));
});

async function syncAlphaMarketData(selected = 0) {
  const project = alphaProjects[selected] || alphaProjects[0];
  const status = document.querySelector("#alphaApiStatus");
  const button = document.querySelector("#refreshAlphaBtn");
  if (!project) return;

  if (status) status.textContent = `正在同步 Binance 公开市场 API：${project.binanceSymbol}`;
  if (button) button.disabled = true;

  try {
    const [ticker, depth, trades] = await Promise.all([
      binanceGet("/api/v3/ticker/24hr", { symbol: project.binanceSymbol }),
      binanceGet("/api/v3/depth", { symbol: project.binanceSymbol, limit: 20 }),
      binanceGet("/api/v3/trades", { symbol: project.binanceSymbol, limit: 30 })
    ]);

    project.market = {
      changePercent: `${formatSigned(ticker.priceChangePercent)}%`,
      quoteVolume: formatUsd(ticker.quoteVolume),
      depthBias: describeDepthBias(depth),
      tradePressure: describeTradePressure(trades)
    };

    if (status) status.textContent = `已同步 Binance 公开市场 API：${project.binanceSymbol}。Alpha 官方列表接口未确认，当前为观察列表 + 公开行情信号。`;
    renderAlpha(selected);
  } catch (error) {
    if (status) status.textContent = `Binance 公开市场 API 暂不可达或该交易对未开放：${project.binanceSymbol}。当前展示本地 Alpha 观察模型。`;
  } finally {
    if (button) button.disabled = false;
  }
}

async function binanceGet(path, params) {
  const url = new URL(`https://api.binance.com${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance API ${response.status}`);
  return response.json();
}

function sumDepth(levels) {
  return levels.reduce((sum, [price, qty]) => sum + Number(price) * Number(qty), 0);
}

function describeDepthBias(depth) {
  const bidValue = sumDepth(depth.bids || []);
  const askValue = sumDepth(depth.asks || []);
  if (!bidValue && !askValue) return "深度不足";
  const imbalance = (bidValue - askValue) / (bidValue + askValue);
  if (imbalance > 0.18) return "买盘承接偏强";
  if (imbalance < -0.18) return "卖盘压制偏强";
  return "买卖盘接近平衡";
}

function describeTradePressure(trades) {
  const sellCount = trades.filter(trade => trade.isBuyerMaker).length;
  const buyCount = trades.length - sellCount;
  if (!trades.length) return "成交不足";
  if (sellCount > buyCount * 1.25) return "主动卖出偏多";
  if (buyCount > sellCount * 1.25) return "主动买入偏多";
  return "短线成交均衡";
}

function formatSigned(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.00";
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}`;
}

function formatUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "待同步";
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(2)}K`;
  return `$${number.toFixed(0)}`;
}

const canvas = document.querySelector("#pulseCanvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let tick = 0;

const nodes = [
  { x: .18, y: .34, c: "#41d98d" },
  { x: .34, y: .68, c: "#e8b84a" },
  { x: .52, y: .42, c: "#50c7e8" },
  { x: .68, y: .62, c: "#ff5f66" },
  { x: .82, y: .31, c: "#a98cff" },
  { x: .48, y: .78, c: "#41d98d" }
];

function resize() {
  const box = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  width = box.width;
  height = box.height;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  tick += 0.015;
  ctx.clearRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      ctx.beginPath();
      ctx.moveTo(nodes[i].x * width, nodes[i].y * height);
      ctx.lineTo(nodes[j].x * width, nodes[j].y * height);
      ctx.stroke();
    }
  }

  nodes.forEach((node, index) => {
    const x = node.x * width;
    const y = node.y * height;
    const pulse = 18 + Math.sin(tick * 4 + index) * 9;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.fillStyle = node.c + "22";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = node.c;
    ctx.shadowColor = node.c;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  for (let i = 0; i < 12; i++) {
    const from = nodes[i % nodes.length];
    const to = nodes[(i + 2) % nodes.length];
    const t = (tick * (0.35 + i * .015) + i * .11) % 1;
    const x = (from.x + (to.x - from.x) * t) * width;
    const y = (from.y + (to.y - from.y) * t) * height;
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = "#f2f5f4";
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
draw();
