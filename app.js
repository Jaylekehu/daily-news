const PAGE_SIZE = 5;

const fallbackReports = [
  {
    date: "2026-05-25",
    generatedAt: "2026-05-26T10:10:00+08:00",
    items: [
      {
        date: "2026-05-25",
        domain: "大模型",
        title: "日报数据暂时不可用",
        subtitle: "页面会在最新数据恢复后自动显示日报流。",
        sourceName: "本地兜底",
        sourceUrl: "#",
        region: "domestic",
        priority: 1,
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
const state = {
  latest: null,
  dates: [],
  loadedReports: [],
  nextIndex: 0,
  loading: false,
  done: false,
  observer: null,
  sentinel: null
};

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

function renderReports() {
  const validReports = state.loadedReports.filter((report) => report?.date && Array.isArray(report.items));
  const uniqueReports = [...new Map(validReports.map((report) => [report.date, report])).values()];
  const sortedReports = uniqueReports.sort((a, b) => b.date.localeCompare(a.date));
  board.replaceChildren(...sortedReports.map(renderReportSection));
  board.append(renderSentinel());
}

function renderReportSection(report) {
  const section = document.createElement("section");
  section.className = "date-section";

  const items = [...report.items]
    .map((item, index) => normalizeItem(report, item, index))
    .sort((a, b) => a.priority - b.priority);

  const heading = document.createElement("div");
  heading.className = "date-heading";
  heading.innerHTML = `
    <div>
      <span>${formatDate(report.date)}</span>
      <strong>${items.length} 条热点</strong>
    </div>
    <em>${formatGeneratedAt(report.generatedAt)}</em>
  `;

  const grid = document.createElement("div");
  grid.className = "hot-grid";

  items.forEach((item, index) => {
    const meta = domainStyle[item.domain] || domainStyle["其他"];
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
      <a class="source" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(
        item.sourceName
      )}</a>
    `;
    grid.append(card);
  });

  section.append(heading, grid);
  return section;
}

function renderSentinel() {
  if (!state.sentinel) {
    state.sentinel = document.createElement("div");
    state.sentinel.className = "load-sentinel";
  }

  if (state.loading) {
    state.sentinel.textContent = "加载中...";
  } else if (state.done) {
    state.sentinel.textContent = "已加载全部日报";
  } else {
    state.sentinel.textContent = "";
  }

  return state.sentinel;
}

function formatGeneratedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { hour12: false });
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
    state.latest = await fetchJson("./public/data/latest.json");
    const archiveDates = await loadArchiveDates();
    state.dates = uniqueDates([state.latest.date, ...archiveDates]);
    await loadNextPage();
    setupInfiniteLoading();
  } catch {
    state.loadedReports = fallbackReports;
    state.done = true;
    renderReports();
  }
}

async function loadArchiveDates() {
  try {
    const archiveIndex = await fetchJson("./public/data/archive/index.json");
    return Array.isArray(archiveIndex.dates) ? archiveIndex.dates : [];
  } catch {
    return [];
  }
}

async function loadNextPage() {
  if (state.loading || state.done) return;

  const pageDates = state.dates.slice(state.nextIndex, state.nextIndex + PAGE_SIZE);
  if (!pageDates.length) {
    state.done = true;
    renderReports();
    return;
  }

  state.loading = true;
  renderReports();

  const results = await Promise.allSettled(pageDates.map(loadReportByDate));
  const reports = results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);

  state.loadedReports.push(...reports);
  state.nextIndex += PAGE_SIZE;
  state.done = state.nextIndex >= state.dates.length;
  state.loading = false;
  renderReports();
}

async function loadReportByDate(date) {
  if (state.latest?.date === date) return state.latest;
  return fetchJson(`./public/data/archive/${date}.json`);
}

function uniqueDates(dates) {
  return [...new Set(dates.filter(Boolean))].sort((a, b) => b.localeCompare(a));
}

function setupInfiniteLoading() {
  const sentinel = renderSentinel();

  if ("IntersectionObserver" in window) {
    state.observer?.disconnect();
    state.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextPage();
      },
      { rootMargin: "500px 0px" }
    );
    state.observer.observe(sentinel);
    return;
  }

  window.addEventListener(
    "scroll",
    () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;
      if (nearBottom) loadNextPage();
    },
    { passive: true }
  );
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

loadReports();
