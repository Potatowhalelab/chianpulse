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
const alphaStorageKey = "chianpulse.alphaProjects.v1";
const alphaProxyBase = window.CHIANPULSE_API_BASE || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "" : "");
const alphaSeedCatalog = [
  { symbol: "ASTER", name: "Aster", binanceSymbol: "ASTERUSDT" },
  { symbol: "PARTI", name: "Particle Network", binanceSymbol: "PARTIUSDT" },
  { symbol: "SHELL", name: "MyShell", binanceSymbol: "SHELLUSDT" },
  { symbol: "HYPER", name: "Hyperlane", binanceSymbol: "HYPERUSDT" },
  { symbol: "ZKJ", name: "Polyhedra Network", binanceSymbol: "ZKJUSDT" },
  { symbol: "TUT", name: "Tutorial", binanceSymbol: "TUTUSDT" },
  { symbol: "MUBARAK", name: "Mubarak", binanceSymbol: "MUBARAKUSDT" }
];
let alphaSearchTimer = null;
loadSavedAlphaProjects();

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
document.querySelector("#syncAlphaBtn")?.addEventListener("click", syncAlphaCatalog);

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
let alphaSearchTerm = "";

function renderAlpha(selected = 0) {
  currentAlphaIndex = Math.max(0, Math.min(selected, alphaProjects.length - 1));
  const list = document.querySelector("#alphaList");
  const detail = document.querySelector("#alphaDetail");
  if (!list || !detail) return;
  const visibleProjects = getVisibleAlphaProjects();
  if (!visibleProjects.length) {
    list.innerHTML = `<div class="empty-state">没有匹配项目，可以直接添加新的 Alpha 观察。</div>`;
    detail.innerHTML = `<div class="empty-state">输入 Binance 交易对后，ChianPulse 会尝试拉取公开市场数据并生成初始风险判断。</div>`;
    return;
  }
  const activeVisible = visibleProjects.some(item => item.index === currentAlphaIndex) ? currentAlphaIndex : visibleProjects[0].index;
  currentAlphaIndex = activeVisible;
  list.innerHTML = visibleProjects.map(({ project, index }) => `
    <button class="alpha-row ${index === currentAlphaIndex ? "active" : ""}" data-alpha-index="${index}">
      <b>${project.symbol}</b>
      <span>${project.name} · ${project.bias}</span>
      <strong>${project.risk}</strong>
    </button>
  `).join("");
  const project = alphaProjects[currentAlphaIndex];
  const market = project.market || {};
  detail.innerHTML = `
    <div class="detail-head">
      <div><span>${project.status} · ${project.binanceSymbol} · ${project.custom ? "本地保存" : "内置观察"}</span><h3>${project.symbol} · ${project.name}</h3></div>
      <strong>风险 ${project.risk}/100</strong>
    </div>
    <div class="alpha-verdict ${project.risk >= 80 ? "danger" : project.risk >= 70 ? "warn" : ""}">
      <b>${project.bias}</b>
      <span>${project.verdict || "综合大户减仓、CEX 转入、流动性变化、做市商库存偏移和 Binance 公开市场数据得出。"}</span>
    </div>
    <div class="market-grid">
      <div><span>24h 涨跌</span><b class="${Number(market.changePercent || 0) < 0 ? "negative" : "positive"}">${market.changePercent || "待同步"}</b></div>
      <div><span>24h 成交额</span><b>${market.quoteVolume || "待同步"}</b></div>
      <div><span>盘口偏向</span><b>${market.depthBias || "待同步"}</b></div>
      <div><span>近期成交压力</span><b>${market.tradePressure || "待同步"}</b></div>
    </div>
    <div class="alpha-chart">
      <div class="chart-head"><b>${project.symbol} K线</b><span>${project.chartLabel || "同步信号后展示 Binance 1h K线"}</span></div>
      ${project.chartSvg || `<div class="chart-empty">暂无 K 线数据，点击刷新信号或添加可交易项目后生成。</div>`}
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

function renderAlpha(selected = 0) {
  currentAlphaIndex = Math.max(0, Math.min(selected, alphaProjects.length - 1));
  const list = document.querySelector("#alphaList");
  const detail = document.querySelector("#alphaDetail");
  if (!list || !detail) return;

  const visibleProjects = getVisibleAlphaProjects();
  if (!visibleProjects.length) {
    list.innerHTML = `<div class="empty-state">没有匹配项目。可以输入项目名、交易对或合约地址添加新的 Alpha 观察。</div>`;
    detail.innerHTML = `<div class="empty-state">输入 Binance 交易对后，ChianPulse 会先创建本地观察，再尝试同步公开行情和 Alpha 代理数据。</div>`;
    return;
  }

  const activeVisible = visibleProjects.some(item => item.index === currentAlphaIndex) ? currentAlphaIndex : visibleProjects[0].index;
  currentAlphaIndex = activeVisible;
  list.innerHTML = `
    <div class="alpha-table-wrap">
      <table class="alpha-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>流动性</th>
            <th>持币/庄家</th>
            <th>市值/价格</th>
            <th>24h</th>
            <th>成交压力</th>
            <th>K线</th>
            <th>动作</th>
          </tr>
        </thead>
        <tbody>
          ${visibleProjects.map(({ project, index }) => renderAlphaTableRow(project, index)).join("")}
        </tbody>
      </table>
    </div>
  `;
  renderAlphaDetail(alphaProjects[currentAlphaIndex]);
}

function renderAlphaTableRow(project, index) {
  const metrics = getAlphaMetrics(project);
  const changeClass = metrics.changeValue < 0 ? "negative" : "positive";
  const active = index === currentAlphaIndex ? "active" : "";
  return `
    <tr class="alpha-row ${active}" data-alpha-index="${index}">
      <td>
        <button type="button" class="alpha-project-button" data-alpha-index="${index}" title="查看 ${escapeAttr(project.symbol)} 详情">
          <span class="star">☆</span>
          <span class="token-mark">${escapeHtml(project.symbol.slice(0, 2))}</span>
          <span>
            <b>${escapeHtml(project.symbol)}</b>
            <small>${escapeHtml(project.name)} · ${escapeHtml(project.contract || project.binanceSymbol)}</small>
          </span>
        </button>
      </td>
      <td>${metrics.liquidity}</td>
      <td><b>${metrics.holders}</b><small>${metrics.makerCount}</small></td>
      <td><b>${metrics.marketCap}</b><small>${metrics.price}</small></td>
      <td class="${changeClass}">${metrics.change}</td>
      <td><b>${escapeHtml(project.bias)}</b><small>风险 ${project.risk}/100</small></td>
      <td>${renderMiniTrend(project)}</td>
      <td>
        <div class="alpha-actions">
          <button type="button" class="mini-button" data-alpha-refresh="${index}" title="刷新行情">↻</button>
          <button type="button" class="mini-button" data-view-target="alerts" title="创建预警">⚡</button>
        </div>
      </td>
    </tr>
  `;
}

function renderAlphaDetail(project) {
  const detail = document.querySelector("#alphaDetail");
  if (!detail || !project) return;
  const market = project.market || {};
  detail.innerHTML = `
    <div class="detail-head">
      <div><span>${project.status} · ${project.binanceSymbol} · ${project.custom ? "本地保存" : "内置观察"}</span><h3>${project.symbol} · ${project.name}</h3></div>
      <strong>风险 ${project.risk}/100</strong>
    </div>
    <div class="alpha-verdict ${project.risk >= 80 ? "danger" : project.risk >= 70 ? "warn" : ""}">
      <b>${project.bias}</b>
      <span>${project.verdict || "综合大户减仓、CEX 转入、流动性变化、做市商库存偏移和 Binance 公开市场数据得出。"}</span>
    </div>
    <div class="market-grid">
      <div><span>24h 涨跌</span><b class="${Number(market.changePercent || 0) < 0 ? "negative" : "positive"}">${market.changePercent || "待同步"}</b></div>
      <div><span>24h 成交额</span><b>${market.quoteVolume || "待同步"}</b></div>
      <div><span>盘口偏向</span><b>${market.depthBias || "待同步"}</b></div>
      <div><span>近期成交压力</span><b>${market.tradePressure || "待同步"}</b></div>
    </div>
    <div class="alpha-chart">
      <div class="chart-head"><b>${project.symbol} K线</b><span>${project.chartLabel || "点击刷新信号后展示 Binance 1h K线"}</span></div>
      ${project.chartSvg || `<div class="chart-empty">暂无 K 线数据。点击刷新信号后会同步行情；接口不可用时仍保留观察列表。</div>`}
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

function getAlphaMetrics(project) {
  const market = project.market || {};
  const changeValue = Number(String(market.changePercent || "0").replace("%", ""));
  const synthetic = Math.max(1, project.risk || 50);
  return {
    liquidity: market.quoteVolume || `$${(synthetic * 13.7).toFixed(1)}K`,
    holders: project.holders || `${(synthetic * 317).toLocaleString("en-US")}`,
    makerCount: `${project.makers?.length || 0} 个候选地址`,
    marketCap: project.marketCap || market.quoteVolume || `$${(synthetic * 0.43).toFixed(2)}M`,
    price: project.price || project.binanceSymbol,
    change: market.changePercent || `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(2)}%`,
    changeValue
  };
}

function renderMiniTrend(project) {
  const risk = Math.max(20, Math.min(90, project.risk || 50));
  const down = /砸盘|卖压|下跌/.test(project.bias || "");
  const color = down ? "#ff5f66" : "#41d98d";
  const points = Array.from({ length: 18 }, (_, i) => {
    const base = down ? 22 + i * 1.8 : 46 - i * 1.4;
    const wave = Math.sin((i + risk) * 0.85) * 7;
    return `${i * 7},${Math.max(8, Math.min(54, base + wave))}`;
  }).join(" ");
  const bars = Array.from({ length: 10 }, (_, i) => `<rect x="${i * 11}" y="${42 - (i % 4) * 5}" width="4" height="${10 + (i % 4) * 5}" fill="rgba(255,255,255,.16)" />`).join("");
  return `<svg class="mini-trend" viewBox="0 0 120 60" aria-hidden="true">${bars}<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

document.querySelector("#alphaList")?.addEventListener("click", event => {
  const refresh = event.target.closest("[data-alpha-refresh]");
  if (!refresh) return;
  event.stopPropagation();
  syncAlphaMarketData(Number(refresh.dataset.alphaRefresh));
});

document.querySelector("#alphaSearchInput")?.addEventListener("input", event => {
  const query = event.target.value.trim();
  alphaSearchTerm = query.toUpperCase();
  renderAlpha(currentAlphaIndex);
  clearTimeout(alphaSearchTimer);
  alphaSearchTimer = setTimeout(() => searchAlphaProjects(query), 260);
});

document.querySelector("#alphaLibraryForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#alphaAddInput");
  const raw = input.value.trim().toUpperCase();
  if (!raw) return;
  await addAlphaFromQuery(raw);
  input.value = "";
});

document.querySelector("#alphaSearchResults")?.addEventListener("click", async event => {
  const button = event.target.closest("[data-alpha-add]");
  if (!button) return;
  await addAlphaCandidate({
    symbol: button.dataset.symbol,
    name: button.dataset.name,
    binanceSymbol: button.dataset.binanceSymbol,
    contract: button.dataset.contract || "",
    source: button.dataset.source || "搜索结果"
  });
});

async function addAlphaFromQuery(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return;
  const candidate = isContractAddress(query)
    ? await lookupContractCandidate(query)
    : makeSymbolCandidate(query);
  await addAlphaCandidate(candidate);
}

async function addAlphaCandidate(candidate) {
  const symbol = candidate.symbol.toUpperCase().replace(/USDT$/, "");
  const binanceSymbol = candidate.binanceSymbol || `${symbol}USDT`;
  const existingIndex = alphaProjects.findIndex(project => project.binanceSymbol === binanceSymbol || project.symbol === symbol || project.contract === candidate.contract);
  if (existingIndex >= 0) {
    alphaSearchTerm = "";
    document.querySelector("#alphaSearchInput").value = "";
    renderAlpha(existingIndex);
    await syncAlphaMarketData(existingIndex);
    return;
  }

  alphaProjects.unshift(createAlphaProject(symbol, binanceSymbol, candidate));
  saveAlphaProjects();
  alphaSearchTerm = "";
  document.querySelector("#alphaSearchInput").value = "";
  renderAlphaSearchResults([]);
  renderAlpha(0);
  await syncAlphaMarketData(0);
}

function getVisibleAlphaProjects() {
  return alphaProjects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => {
      if (!alphaSearchTerm) return true;
      return [project.symbol, project.name, project.binanceSymbol, project.contract, project.bias].some(value => String(value || "").toUpperCase().includes(alphaSearchTerm));
    });
}

async function searchAlphaProjects(query) {
  const normalized = query.trim().toUpperCase();
  if (!normalized) {
    renderAlphaSearchResults([]);
    return;
  }
  const status = document.querySelector("#alphaApiStatus");
  if (status) status.textContent = "正在搜索 Alpha 项目，优先查询 ChianPulse Alpha 代理；不可用时使用本地项目库和公开 DEX 数据。";

  try {
    let proxyResults = [];
    try {
      proxyResults = await searchAlphaViaProxy(normalized);
    } catch {
      proxyResults = [];
    }
    const results = proxyResults.length
      ? proxyResults
      : isContractAddress(normalized)
        ? [await lookupContractCandidate(normalized)]
        : buildNameSearchResults(normalized);
    renderAlphaSearchResults(results.filter(Boolean));
  } catch (error) {
    renderAlphaSearchResults([]);
    if (status) status.textContent = "搜索暂时没有返回结果，可以直接输入交易对添加观察。";
  }
}

function buildNameSearchResults(query) {
  const local = [...alphaProjects, ...alphaSeedCatalog]
    .filter(project => [project.symbol, project.name, project.binanceSymbol].some(value => String(value || "").toUpperCase().includes(query)))
    .map(project => ({
      symbol: project.symbol,
      name: project.name,
      binanceSymbol: project.binanceSymbol || `${project.symbol}USDT`,
      contract: project.contract || "",
      source: project.custom ? "本地观察" : "Alpha 候选库"
    }));
  const symbol = query.replace(/USDT$/, "");
  const direct = { symbol, name: `${symbol} Alpha`, binanceSymbol: query.endsWith("USDT") ? query : `${symbol}USDT`, contract: "", source: "Binance 交易对候选" };
  return uniqueCandidates([direct, ...local]);
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter(candidate => {
    const key = `${candidate.binanceSymbol}-${candidate.contract || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function renderAlphaSearchResults(results) {
  const box = document.querySelector("#alphaSearchResults");
  if (!box) return;
  if (!results.length) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = results.map(candidate => `
    <article class="alpha-result">
      <div>
        <b>${escapeHtml(candidate.symbol)}</b>
        <span>${escapeHtml(candidate.name)} · ${escapeHtml(candidate.binanceSymbol || "待匹配交易对")}</span>
        ${candidate.contract ? `<small>${escapeHtml(candidate.contract)}</small>` : ""}
      </div>
      <button type="button" class="secondary-button" data-alpha-add data-symbol="${escapeAttr(candidate.symbol)}" data-name="${escapeAttr(candidate.name)}" data-binance-symbol="${escapeAttr(candidate.binanceSymbol || "")}" data-contract="${escapeAttr(candidate.contract || "")}" data-source="${escapeAttr(candidate.source || "搜索结果")}">添加观察</button>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function makeSymbolCandidate(query) {
  const symbol = query.toUpperCase().replace(/USDT$/, "");
  const known = alphaSeedCatalog.find(project => project.symbol === symbol || project.binanceSymbol === query);
  return known || { symbol, name: `${symbol} Alpha`, binanceSymbol: query.endsWith("USDT") ? query : `${symbol}USDT`, source: "手动添加" };
}

async function lookupContractCandidate(contract) {
  const response = await fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${contract}`, {}, 3500);
  if (!response.ok) throw new Error(`DexScreener API ${response.status}`);
  const data = await response.json();
  const pair = (data.pairs || []).find(item => item.baseToken?.address?.toLowerCase() === contract.toLowerCase()) || data.pairs?.[0];
  if (!pair) throw new Error("No token pair");
  const symbol = (pair.baseToken?.symbol || "TOKEN").toUpperCase();
  return {
    symbol,
    name: pair.baseToken?.name || `${symbol} Token`,
    binanceSymbol: `${symbol}USDT`,
    contract,
    source: `${pair.chainId || "DEX"} 合约搜索`
  };
}

async function searchAlphaViaProxy(query) {
  const payload = await alphaProxyGet("search", { keyword: query, q: query, query });
  return normalizeAlphaTokens(payload).map(token => ({
    symbol: token.symbol,
    name: token.name,
    binanceSymbol: token.binanceSymbol,
    contract: token.contract,
    chainId: token.chainId,
    source: "Binance Web3 Market API"
  }));
}

function isContractAddress(value) {
  return /^0x[a-f0-9]{40}$/i.test(value) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

async function syncAlphaCatalog() {
  const status = document.querySelector("#alphaApiStatus");
  const button = document.querySelector("#syncAlphaBtn");
  if (button) button.disabled = true;
  if (status) status.textContent = "正在通过 ChianPulse Alpha 代理同步 Binance Web3 Market API；代理不可用时会同步本地候选库。";

  let catalog = alphaSeedCatalog;
  try {
    const proxyPayload = await alphaProxyGet("hot", { limit: 30 });
    const proxyCatalog = normalizeAlphaTokens(proxyPayload);
    if (proxyCatalog.length) catalog = proxyCatalog;
  } catch (error) {
    if (status) status.textContent = "Alpha 代理暂不可用或未配置 Key，正在同步本地 Alpha 候选库。";
  }

  const existingKeys = new Set(alphaProjects.map(project => `${project.symbol}-${project.binanceSymbol}-${project.contract || ""}`));
  const additions = catalog
    .filter(candidate => !existingKeys.has(`${candidate.symbol}-${candidate.binanceSymbol}-${candidate.contract || ""}`))
    .map(candidate => createAlphaProject(candidate.symbol, candidate.binanceSymbol, {
      ...candidate,
      source: candidate.source || (catalog === alphaSeedCatalog ? "Binance Alpha 候选库" : "Binance Web3 Market API")
    }));

  if (additions.length) {
    alphaProjects.unshift(...additions);
    saveAlphaProjects();
  }

  renderAlpha(0);
  renderAlphaSearchResults([]);

  try {
    await syncAlphaMarketData(0);
    if (status) {
      status.textContent = additions.length
        ? `已同步 ${additions.length} 个 Alpha 项目。若已配置代理 Key，则数据来自 Binance Web3 Market API；否则来自本地候选库。`
        : "Alpha 项目库已是最新。若已配置代理 Key，则数据来自 Binance Web3 Market API；否则来自本地候选库。";
    }
  } finally {
    if (button) button.disabled = false;
  }
}

function createAlphaProject(symbol, binanceSymbol, candidate = {}) {
  return {
    custom: true,
    symbol,
    name: candidate.name || `${symbol} Alpha`,
    binanceSymbol,
    contract: candidate.contract || "",
    chainId: candidate.chainId || "",
    status: "新观察",
    risk: 58,
    bias: "等待行情确认",
    verdict: `已加入 Alpha 项目库，来源：${candidate.source || "手动添加"}。等待同步公开市场数据后生成初始异常判断。`,
    makers: candidate.contract ? [candidate.contract, "待接入 CEX 入金路径", "待接入做市地址簇"] : ["待接入链上持仓标签", "待接入 CEX 入金路径", "待接入做市地址簇"],
    signals: [
      "已创建观察对象",
      "等待公开市场 API 返回价格、成交额和盘口深度",
      "后续可叠加链上持仓集中度与庄家地址行为"
    ]
  };
}

function loadSavedAlphaProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(alphaStorageKey) || "[]");
    if (!Array.isArray(saved)) return;
    saved.reverse().forEach(project => {
      if (!isValidAlphaProject(project)) return;
      const existingIndex = alphaProjects.findIndex(item => item.binanceSymbol === project.binanceSymbol);
      if (existingIndex >= 0) {
        alphaProjects[existingIndex] = { ...alphaProjects[existingIndex], ...project, custom: Boolean(project.custom) };
      } else {
        alphaProjects.unshift({ ...project, custom: true });
      }
    });
  } catch (error) {
    localStorage.removeItem(alphaStorageKey);
  }
}

function saveAlphaProjects() {
  try {
    const saved = alphaProjects.filter(project => project.custom);
    localStorage.setItem(alphaStorageKey, JSON.stringify(saved));
  } catch (error) {
    const status = document.querySelector("#alphaApiStatus");
    if (status) status.textContent = "浏览器本地存储不可用，新增 Alpha 观察可能无法在刷新后保留。";
  }
}

function isValidAlphaProject(project) {
  return project
    && typeof project.symbol === "string"
    && typeof project.binanceSymbol === "string"
    && Array.isArray(project.makers)
    && Array.isArray(project.signals);
}

async function syncAlphaMarketData(selected = 0) {
  const project = alphaProjects[selected] || alphaProjects[0];
  const status = document.querySelector("#alphaApiStatus");
  const button = document.querySelector("#refreshAlphaBtn");
  if (!project) return;

  if (status) status.textContent = `正在同步 Binance 公开市场 API：${project.binanceSymbol}`;
  if (button) button.disabled = true;

  try {
    await enrichAlphaFromProxy(project);
    const [ticker, depth, trades, klines] = await Promise.all([
      binanceGet("/api/v3/ticker/24hr", { symbol: project.binanceSymbol }),
      binanceGet("/api/v3/depth", { symbol: project.binanceSymbol, limit: 20 }),
      binanceGet("/api/v3/trades", { symbol: project.binanceSymbol, limit: 30 }),
      binanceGet("/api/v3/klines", { symbol: project.binanceSymbol, interval: "1h", limit: 48 })
    ]);

    project.market = {
      changePercent: `${formatSigned(ticker.priceChangePercent)}%`,
      quoteVolume: formatUsd(ticker.quoteVolume),
      depthBias: describeDepthBias(depth),
      tradePressure: describeTradePressure(trades)
    };
    project.chartSvg = project.chartSvg || renderKlineChart(project, klines);
    applyAlphaVerdict(project, ticker, depth, trades);

    if (status) status.textContent = `已同步 ${project.binanceSymbol}。已优先尝试 Binance Web3 Alpha 代理，并用公开市场行情补齐盘口信号。`;
    saveAlphaProjects();
    renderAlpha(selected);
  } catch (error) {
    if (status) status.textContent = `Binance 公开市场 API 暂不可达或该交易对未开放：${project.binanceSymbol}。当前展示本地 Alpha 观察模型。`;
  } finally {
    if (button) button.disabled = false;
  }
}

async function enrichAlphaFromProxy(project) {
  if (!project.contract && !project.chainId) return;
  try {
    const params = {
      chainId: project.chainId,
      tokenAddress: project.contract,
      contractAddress: project.contract,
      address: project.contract,
      interval: "1h",
      limit: 48
    };
    const [candles, holders, topTraders] = await Promise.allSettled([
      alphaProxyGet("candles", params),
      alphaProxyGet("holders", params),
      alphaProxyGet("topTraders", params)
    ]);

    const candleData = candles.status === "fulfilled" ? normalizeCandles(candles.value) : [];
    if (candleData.length) project.chartSvg = renderKlineChart(project, candleData);

    const holderRows = holders.status === "fulfilled" ? normalizeAddressRows(holders.value) : [];
    const traderRows = topTraders.status === "fulfilled" ? normalizeAddressRows(topTraders.value) : [];
    const candidates = [...holderRows.slice(0, 3), ...traderRows.slice(0, 2)].filter(Boolean);
    if (candidates.length) {
      project.makers = candidates.map(row => row.label || row.address || row.owner || row.wallet).filter(Boolean);
    }
    if (holderRows.length || traderRows.length) {
      project.signals = [
        holderRows.length ? `Top holder 数据已返回 ${holderRows.length} 条，重点观察集中度变化。` : "Top holder 数据暂未返回。",
        traderRows.length ? `Top trader 数据已返回 ${traderRows.length} 条，重点观察净卖出和净买入。` : "Top trader 数据暂未返回。",
        "已接入 Binance Web3 Market API 代理，可继续叠加官方 Alpha 项目标签。"
      ];
    }
  } catch {
    project.proxyStatus = "Alpha 代理暂不可用，已降级到公开行情。";
  }
}

async function alphaProxyGet(action, params = {}) {
  const url = new URL(`${alphaProxyBase}/api/alpha`, location.origin);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const response = await fetchWithTimeout(url.toString(), {}, 3500);
  if (!response.ok) throw new Error(`Alpha proxy ${response.status}`);
  const payload = await response.json();
  if (payload.ok === false) throw new Error(payload.error || "Alpha proxy unavailable");
  return payload.data || payload;
}

async function fetchWithTimeout(url, options = {}, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeAlphaTokens(payload) {
  const rows = extractRows(payload);
  return rows.map(row => {
    const symbol = String(row.symbol || row.tokenSymbol || row.baseTokenSymbol || row.ticker || "").toUpperCase();
    if (!symbol) return null;
    return {
      symbol,
      name: row.name || row.tokenName || row.baseTokenName || `${symbol} Alpha`,
      binanceSymbol: row.binanceSymbol || row.cexSymbol || `${symbol}USDT`,
      contract: row.contractAddress || row.tokenAddress || row.address || row.ca || "",
      chainId: row.chainId || row.chain || row.network || "",
      source: "Binance Web3 Market API"
    };
  }).filter(Boolean);
}

function normalizeCandles(payload) {
  return extractRows(payload).map(item => Array.isArray(item) ? item : [
    item.openTime || item.time || item.t,
    item.open || item.o,
    item.high || item.h,
    item.low || item.l,
    item.close || item.c
  ]).filter(item => item.length >= 5);
}

function normalizeAddressRows(payload) {
  return extractRows(payload).map(row => ({
    ...row,
    label: row.label || row.name || row.address || row.wallet || row.owner
  }));
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const direct = payload.data || payload.result || payload.rows || payload.list || payload.items || payload.tokens;
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === "object") return extractRows(direct);
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

async function binanceGet(path, params) {
  const url = new URL(`https://api.binance.com${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetchWithTimeout(url, {}, 6000);
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

function applyAlphaVerdict(project, ticker, depth, trades) {
  const change = Number(ticker.priceChangePercent);
  const volume = Number(ticker.quoteVolume);
  const bidValue = sumDepth(depth.bids || []);
  const askValue = sumDepth(depth.asks || []);
  const depthImbalance = bidValue + askValue ? (bidValue - askValue) / (bidValue + askValue) : 0;
  const sellCount = trades.filter(trade => trade.isBuyerMaker).length;
  const buyCount = trades.length - sellCount;
  const sellPressure = trades.length ? sellCount / trades.length : 0.5;
  const highVolume = volume >= 20_000_000;

  if (change <= -8 && sellPressure >= 0.58) {
    project.bias = "疑似砸盘";
    project.status = "高风险";
    project.risk = highVolume ? 88 : 80;
    project.verdict = "价格快速下跌且主动卖出占优，若同时出现 CEX 入金或链上大户减仓，需要优先推送。";
  } else if (change >= 10 && buyCount > sellCount * 1.2) {
    project.bias = "疑似拉盘";
    project.status = "高波动";
    project.risk = highVolume ? 76 : 70;
    project.verdict = "价格强势上行且主动买入偏多，短线可能处在拉盘或情绪加速阶段。";
  } else if (Math.abs(change) <= 5 && depthImbalance > 0.18 && sellPressure <= 0.48) {
    project.bias = "疑似吸筹";
    project.status = "观察";
    project.risk = 64;
    project.verdict = "价格波动不大但买盘深度偏强，可能存在低调承接或分批吸筹。";
  } else if (depthImbalance < -0.2 && sellPressure >= 0.55) {
    project.bias = "卖压偏重";
    project.status = "中风险";
    project.risk = 72;
    project.verdict = "盘口卖墙较厚且主动卖出偏多，后续需要重点观察是否演变为砸盘。";
  } else {
    project.bias = "均衡观察";
    project.status = "观察";
    project.risk = highVolume ? 58 : 52;
    project.verdict = "公开市场数据暂未显示极端方向，继续等待链上大户、CEX 和流动性信号确认。";
  }

  project.signals = [
    `24h 涨跌 ${formatSigned(change)}%，成交额 ${formatUsd(volume)}`,
    `盘口深度：${describeDepthBias(depth)}`,
    `最近成交：${describeTradePressure(trades)}`
  ];
}

function renderKlineChart(project, klines) {
  const candles = (klines || []).map(item => ({
    open: Number(item[1]),
    high: Number(item[2]),
    low: Number(item[3]),
    close: Number(item[4])
  })).filter(item => [item.open, item.high, item.low, item.close].every(Number.isFinite));
  if (!candles.length) return "";

  const width = 720;
  const height = 260;
  const pad = { top: 18, right: 58, bottom: 24, left: 10 };
  const min = Math.min(...candles.map(item => item.low));
  const max = Math.max(...candles.map(item => item.high));
  const range = max - min || 1;
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const slot = innerWidth / candles.length;
  const bodyWidth = Math.max(3, slot * 0.58);
  const y = value => pad.top + (max - value) / range * innerHeight;
  const last = candles[candles.length - 1];
  const grid = [0, 0.25, 0.5, 0.75, 1].map(step => {
    const gy = pad.top + step * innerHeight;
    const label = max - step * range;
    return `<line x1="${pad.left}" y1="${gy.toFixed(1)}" x2="${width - pad.right}" y2="${gy.toFixed(1)}" /><text x="${width - pad.right + 8}" y="${(gy + 4).toFixed(1)}">${formatPrice(label)}</text>`;
  }).join("");
  const candleSvg = candles.map((item, index) => {
    const cx = pad.left + index * slot + slot / 2;
    const openY = y(item.open);
    const closeY = y(item.close);
    const highY = y(item.high);
    const lowY = y(item.low);
    const up = item.close >= item.open;
    const color = up ? "#41d98d" : "#ff5f66";
    const bodyY = Math.min(openY, closeY);
    const bodyH = Math.max(2, Math.abs(openY - closeY));
    return `<g class="candle ${up ? "up" : "down"}"><line x1="${cx.toFixed(1)}" y1="${highY.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${lowY.toFixed(1)}" stroke="${color}" /><rect x="${(cx - bodyWidth / 2).toFixed(1)}" y="${bodyY.toFixed(1)}" width="${bodyWidth.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${color}" /></g>`;
  }).join("");

  project.chartLabel = `Binance 1h · 最新 ${formatPrice(last.close)} · 高 ${formatPrice(max)} · 低 ${formatPrice(min)}`;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${project.symbol} 1小时K线图">
    <g class="chart-grid">${grid}</g>
    <line class="last-price-line" x1="${pad.left}" y1="${y(last.close).toFixed(1)}" x2="${width - pad.right}" y2="${y(last.close).toFixed(1)}" />
    <g>${candleSvg}</g>
  </svg>`;
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (number >= 100) return number.toFixed(2);
  if (number >= 1) return number.toFixed(4);
  return number.toPrecision(4);
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
