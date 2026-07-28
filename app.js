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
const headerDate = document.querySelector("#header-date");
const heroCount = document.querySelector("#hero-count");
const heroGlobalCount = document.querySelector("#hero-global-count");
const heroUpdated = document.querySelector("#hero-updated");
const heroIssue = document.querySelector("#hero-issue");
const state = {
  latest: null,
  dates: [],
  loadedReports: [],
  nextIndex: 0,
  loading: false,
  done: false,
  observer: null,
  sentinel: null,
  motionContext: null,
  scrollTween: null,
  chromeReady: false,
  introAnimated: false
};

function formatDate(dateText) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(`${dateText}T12:00:00+08:00`));
}

function formatCompactDate(dateText) {
  const date = new Date(`${dateText}T12:00:00+08:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  })
    .format(date)
    .replace("/", ".");
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
    sourceType: item.sourceType || "news",
    trendPlatforms: Array.isArray(item.trendPlatforms) ? item.trendPlatforms : [],
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
  syncEditionMeta(sortedReports[0]);
  window.requestAnimationFrame(initMotion);
}

function renderReportSection(report) {
  const section = document.createElement("section");
  const isLatest = report.date === state.latest?.date;
  section.className = `date-section${isLatest ? " is-latest" : ""}`;
  section.dataset.date = report.date;

  const items = [...report.items]
    .map((item, index) => normalizeItem(report, item, index))
    .sort((a, b) => a.priority - b.priority);

  const heading = document.createElement("div");
  heading.className = "date-heading";
  heading.innerHTML = `
    <span class="edition-index" aria-hidden="true">${formatCompactDate(report.date)}</span>
    <div class="date-heading__copy">
      <span class="date-heading__kicker">${isLatest ? "TODAY'S EDITION" : "ARCHIVE EDITION"}</span>
      <h2>${formatDate(report.date)}</h2>
    </div>
    <div class="date-heading__meta">
      <strong>${String(items.length).padStart(2, "0")} STORIES</strong>
      <time datetime="${escapeHtml(report.generatedAt || "")}">${formatGeneratedAt(report.generatedAt)}</time>
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "hot-grid";

  items.forEach((item, index) => {
    const meta = domainStyle[item.domain] || domainStyle["其他"];
    const card = document.createElement("article");
    const regionLabel = item.region === "international" ? "GLOBAL" : "CN";
    const isTrending = item.sourceType === "hotTrend";
    card.className = `hot-card ${meta.color} story-${index + 1}${
      isTrending ? " is-trending" : ""
    }`;
    card.style.setProperty("--story-index", index);
    card.innerHTML = `
      <a
        class="card-link"
        href="${sanitizeUrl(item.sourceUrl)}"
        target="_blank"
        rel="noreferrer"
        aria-label="阅读：${escapeHtml(item.title)}"
      >
        <div class="card-signal">
          <span class="rank">${String(index + 1).padStart(2, "0")}</span>
          <div class="tag" aria-label="${escapeHtml(item.domain)}">
            <span>${meta.icon}</span>
            <b>${escapeHtml(item.domain)}</b>
          </div>
          ${isTrending ? '<span class="trend-badge">热榜</span>' : ""}
          <span class="region">${regionLabel}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.subtitle)}</p>
        <div class="source">
          <span>SOURCE</span>
          <strong>${escapeHtml(item.sourceName)}</strong>
          <i aria-hidden="true">↗</i>
        </div>
        <span class="card-corner" aria-hidden="true"></span>
      </a>
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
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeUrl(value) {
  if (!value || value === "#") return "#";

  try {
    const url = new URL(value, window.location.href);
    if (!["http:", "https:"].includes(url.protocol)) return "#";
    return escapeHtml(url.href);
  } catch {
    return "#";
  }
}

function syncEditionMeta(report) {
  if (!report) return;
  const items = Array.isArray(report.items) ? report.items : [];
  const globalItems = items.filter((item) => item.region === "international").length;
  const issueNumber = report.date.replaceAll("-", "").slice(2);

  headerDate.textContent = formatCompactDate(report.date);
  heroCount.textContent = String(items.length).padStart(2, "0");
  heroGlobalCount.textContent = String(globalItems).padStart(2, "0");
  heroUpdated.textContent = formatTime(report.generatedAt);
  heroIssue.textContent = issueNumber;
}

function initMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger);

  state.motionContext?.revert();
  state.scrollTween?.kill();

  if (reduceMotion) {
    gsap.set(".scroll-meter__bar", { scaleX: 1 });
    return;
  }

  state.motionContext = gsap.context(() => {
    if (!state.introAnimated) {
      const intro = gsap.timeline({
        defaults: { duration: 0.9, ease: "power3.out" }
      });

      intro
        .from(".site-header", { y: -48, autoAlpha: 0 }, 0)
        .from(".hero__eyebrow span", { y: 18, autoAlpha: 0, stagger: 0.08 }, 0.12)
        .from(
          ".hero__title-row",
          { yPercent: 115, rotation: 3, transformOrigin: "left bottom", stagger: 0.1 },
          0.16
        )
        .from(".hero__manifesto, .hero__stats", { y: 30, autoAlpha: 0, stagger: 0.1 }, 0.46)
        .from(".hero__edition", { x: 50, autoAlpha: 0 }, 0.52)
        .from(".hero__disc", { scale: 0.3, rotation: -40, autoAlpha: 0 }, 0.58);

      state.introAnimated = true;
    }

    document.querySelectorAll(".date-section").forEach((section) => {
      const heading = section.querySelector(".date-heading");
      const cards = section.querySelectorAll(".hot-card");

      gsap.from(heading, {
        y: 42,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 90%",
          once: true
        }
      });

      gsap.from(cards, {
        y: 56,
        autoAlpha: 0,
        rotationX: 5,
        transformOrigin: "center bottom",
        duration: 0.9,
        ease: "power3.out",
        stagger: { amount: 0.55, from: "start" },
        scrollTrigger: {
          trigger: section.querySelector(".hot-grid"),
          start: "top 86%",
          once: true
        }
      });

      cards.forEach((card, index) => {
        const direction = index % 2 === 0 ? -0.35 : 0.35;
        card.addEventListener("pointerenter", () => {
          gsap.to(card, {
            y: -8,
            rotation: direction,
            duration: 0.32,
            ease: "power2.out",
            overwrite: "auto"
          });
        });
        card.addEventListener("pointerleave", () => {
          gsap.to(card, {
            y: 0,
            rotation: 0,
            duration: 0.45,
            ease: "power3.out",
            overwrite: "auto"
          });
        });
      });
    });

    gsap.to(".hero__disc", {
      rotation: 90,
      y: 80,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    });
  });

  state.scrollTween = gsap.fromTo(
    ".scroll-meter__bar",
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "max",
        scrub: 0.25
      }
    }
  );

  initChromeMotion(gsap);
  ScrollTrigger.refresh();
}

function initChromeMotion(gsap) {
  if (state.chromeReady || !window.matchMedia("(pointer: fine)").matches) return;

  const aura = document.querySelector(".cursor-aura");
  const moveX = gsap.quickTo(aura, "x", { duration: 0.65, ease: "power3" });
  const moveY = gsap.quickTo(aura, "y", { duration: 0.65, ease: "power3" });

  window.addEventListener(
    "pointermove",
    (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
    },
    { passive: true }
  );
  state.chromeReady = true;
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
