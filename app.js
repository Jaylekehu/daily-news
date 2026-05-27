const fallbackReports = [
  {
    date: "2026-05-25",
    generatedAt: "2026-05-26T10:10:00+08:00",
    items: [
      {
        date: "2026-05-25",
        domain: "民生",
        title: "重庆永川特大暴雨：9人死亡、11人失联",
        subtitle: "永川区遭遇瞬时极端特大暴雨，山洪和地质灾害救援持续推进。",
        sourceName: "央视新闻",
        sourceUrl: "https://news.cctv.com/",
        region: "domestic",
        priority: 1,
        generatedAt: "2026-05-26T10:10:00+08:00"
      },
      {
        date: "2026-05-25",
        domain: "大模型",
        title: "DeepSeek-V4-Pro API永久降至原价四分之一",
        subtitle: "开发者调用成本下降，大模型价格战再次升温。",
        sourceName: "财新",
        sourceUrl: "https://companies.caixin.com/",
        region: "domestic",
        priority: 2,
        generatedAt: "2026-05-26T10:10:00+08:00"
      },
      {
        date: "2026-05-25",
        domain: "国际",
        title: "海外AI监管继续升温",
        subtitle: "模型安全、芯片出口和企业预发布评估成为国际AI新闻主线。",
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/",
        region: "international",
        priority: 3,
        generatedAt: "2026-05-26T10:10:00+08:00"
      }
    ]
  }
];

const domainStyle = {
  民生: { icon: "民", color: "life" },
  互联网: { icon: "网", color: "web" },
  大模型: { icon: "模", color: "ai" },
  数码: { icon: "数", color: "digital" },
  汽车: { icon: "车", color: "auto" },
  交通: { icon: "交", color: "traffic" },
  财经: { icon: "财", color: "finance" },
  国际: { icon: "际", color: "global" },
  其他: { icon: "讯", color: "default" }
};

const board = document.querySelector("#report-board");

function formatDate(dateText) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(`${dateText}T12:00:00+08:00`));
}

function normalizeItem(report, item, index) {
  return {
    date: item.date || report.date,
    domain: item.domain || "其他",
    title: item.title || "未命名热点",
    subtitle: item.subtitle || "暂无摘要。",
    sourceName: item.sourceName || item.source || "来源",
    sourceUrl: item.sourceUrl || item.url || "#",
    region: item.region || "domestic",
    priority: Number(item.priority || index + 1),
    generatedAt: item.generatedAt || report.generatedAt
  };
}

function renderReports(reports) {
  const sortedReports = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  board.replaceChildren(...sortedReports.map(renderReportSection));
}

function renderReportSection(report) {
  const section = document.createElement("section");
  section.className = "date-section";

  const items = [...(report.items || [])]
    .map((item, index) => normalizeItem(report, item, index))
    .sort((a, b) => a.priority - b.priority);

  const heading = document.createElement("div");
  heading.className = "date-heading";
  heading.innerHTML = `
    <div>
      <span>${formatDate(report.date)}</span>
      <strong>${items.length} 条热点</strong>
    </div>
    <em>${new Date(report.generatedAt).toLocaleString("zh-CN", { hour12: false })}</em>
  `;

  const grid = document.createElement("div");
  grid.className = "hot-grid";

  items.forEach((item, index) => {
    const meta = domainStyle[item.domain] || domainStyle.其他;
    const card = document.createElement("article");
    card.className = `hot-card ${meta.color}`;
    card.innerHTML = `
      <div class="rank">${String(index + 1).padStart(2, "0")}</div>
      <div class="tag" aria-label="${escapeHtml(item.domain)}">
        <span>${meta.icon}</span>
        <b>${escapeHtml(item.domain)}</b>
      </div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.subtitle)}</p>
      <a class="source" href="${item.sourceUrl}" target="_blank" rel="noreferrer">${escapeHtml(
        item.sourceName
      )}</a>
    `;
    grid.append(card);
  });

  section.append(heading, grid);
  return section;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadReports() {
  try {
    const archiveIndex = await fetchJson("./public/data/archive/index.json");
    const dates = Array.isArray(archiveIndex.dates) ? archiveIndex.dates : [];
    const reports = await Promise.all(
      dates.map((date) => fetchJson(`./public/data/archive/${date}.json`))
    );
    renderReports(reports.length ? reports : [await fetchJson("./public/data/latest.json")]);
  } catch {
    try {
      renderReports([await fetchJson("./public/data/latest.json")]);
    } catch {
      renderReports(fallbackReports);
    }
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

loadReports();
