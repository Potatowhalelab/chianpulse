const events = [
  ["high", "做市商钱包库存异常下降", "Wintermute 标记地址在 12 分钟内转出 18,420 ETH，CEX 入金路径已确认。", "刚刚"],
  ["mid", "巨鲸开始分批建仓", "0x7a91...c4F2 连续 9 笔买入 LINK，总规模 $6.8M，滑点保持低位。", "18 秒前"],
  ["high", "合约管理员权限变更", "新部署代理合约触发 owner 转移，并伴随 mint 权限开放调用。", "42 秒前"],
  ["low", "跨链资金归集", "Base 到 Arbitrum 出现 74 笔稳定币桥接，疑似资金池再平衡。", "1 分钟前"],
  ["mid", "交易所热钱包大额流出", "Binance 标记钱包向 3 个新地址转出 2,100 BTC，历史相似事件后波动升高。", "2 分钟前"],
  ["high", "闪电贷攻击模式匹配", "某低流动性池出现价格操纵、借贷、偿还闭环，风险评分 91/100。", "3 分钟前"]
];

const feed = document.querySelector("#eventFeed");

function renderEvents() {
  feed.innerHTML = events.map(([severity, title, body, time]) => `
    <article class="event-card">
      <span class="severity ${severity}">${severity === "high" ? "高危" : severity === "mid" ? "关注" : "信息"}</span>
      <div>
        <h4>${title}</h4>
        <p>${body}</p>
      </div>
      <span class="event-time">${time}</span>
    </article>
  `).join("");
}

renderEvents();

setInterval(() => {
  const first = events.shift();
  events.push(first);
  renderEvents();
}, 4200);

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
