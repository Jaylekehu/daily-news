const fallbackReport = {
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
    },
    {
      date: "2026-05-25",
      domain: "互联网",
      title: "处方药网售合规指南发布：AI不得代审方",
      subtitle: "指南要求实名购药、凭真实处方销售，处方审核必须由执业药师完成。",
      sourceName: "国家医保局",
      sourceUrl: "https://www.nhsa.gov.cn/",
      region: "domestic",
      priority: 4,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "大模型",
      title: "DeepSeek降价带动算力租赁概念股下跌",
      subtitle: "模型调用价格变化传导至算力租赁预期，多家上市公司回应业务影响。",
      sourceName: "第一财经",
      sourceUrl: "https://www.yicai.com/",
      region: "domestic",
      priority: 5,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "互联网",
      title: "宇树科技IPO拟6月1日上会",
      subtitle: "市场关注其冲击A股人形机器人第一股及募资用途。",
      sourceName: "新浪财经",
      sourceUrl: "https://finance.sina.com.cn/",
      region: "domestic",
      priority: 6,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "数码",
      title: "荣耀600系列发布，国补价2294.15元起",
      subtitle: "新品主打影像、护眼屏和大电池，首销表现将检验大电池路线热度。",
      sourceName: "荣耀官网",
      sourceUrl: "https://www.honor.com/cn/",
      region: "domestic",
      priority: 7,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "国际",
      title: "台湾打击英伟达AI芯片走私",
      subtitle: "芯片出口管制、灰色供应链与大模型算力需求继续纠缠。",
      sourceName: "Tom's Hardware",
      sourceUrl: "https://www.tomshardware.com/",
      region: "international",
      priority: 8,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "汽车",
      title: "新能源车讨论从价格战转向价值竞争",
      subtitle: "车企调价、权益变化和成本压力让购车讨论回到配置与利润空间。",
      sourceName: "新浪财经",
      sourceUrl: "https://finance.sina.com.cn/",
      region: "domestic",
      priority: 9,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "交通",
      title: "京港高铁雄商段全线拉通试验启动",
      subtitle: "综合检测列车从商丘站驶出，线路进入联调联试关键阶段。",
      sourceName: "新华社",
      sourceUrl: "https://www.xinhuanet.com/",
      region: "domestic",
      priority: 10,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "国际",
      title: "Gemini加速进入搜索和办公",
      subtitle: "海外科技媒体复盘Google的AI攻势，搜索重构成为核心关注点。",
      sourceName: "Axios",
      sourceUrl: "https://www.axios.com/",
      region: "international",
      priority: 11,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "国际",
      title: "英伟达业绩受AI芯片需求推高",
      subtitle: "高端AI芯片需求仍是业绩核心驱动力，算力基础设施热度未降。",
      sourceName: "AP",
      sourceUrl: "https://apnews.com/",
      region: "international",
      priority: 12,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "国际",
      title: "AI公司开放模型预发布评估",
      subtitle: "模型安全评估正从自愿承诺走向更制度化的预发布测试。",
      sourceName: "Bloomberg",
      sourceUrl: "https://www.bloomberg.com/",
      region: "international",
      priority: 13,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "财经",
      title: "央行流动性工具继续稳定市场预期",
      subtitle: "公开市场和中期流动性操作仍是资金面关注重点。",
      sourceName: "央视新闻",
      sourceUrl: "https://jingji.cctv.com/",
      region: "domestic",
      priority: 14,
      generatedAt: "2026-05-26T10:10:00+08:00"
    },
    {
      date: "2026-05-25",
      domain: "民生",
      title: "极端天气应急响应成为高频议题",
      subtitle: "多地强对流天气推动预警、救援和城市韧性讨论升温。",
      sourceName: "中新网",
      sourceUrl: "https://www.chinanews.com.cn/",
      region: "domestic",
      priority: 15,
      generatedAt: "2026-05-26T10:10:00+08:00"
    }
  ]
};

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

const els = {
  date: document.querySelector("#report-date"),
  status: document.querySelector("#report-status"),
  filter: document.querySelector("#domain-filter"),
  board: document.querySelector("#report-board")
};

let activeReport = fallbackReport;

function formatDate(dateText) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(`${dateText}T12:00:00+08:00`));
}

function domains(report) {
  return [...new Set(report.items.map((item) => item.domain))];
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function normalizeItem(item, index) {
  return {
    date: item.date || activeReport.date,
    domain: item.domain || "其他",
    title: item.title || "未命名热点",
    subtitle: item.subtitle || "暂无摘要。",
    sourceName: item.sourceName || item.source || "来源",
    sourceUrl: item.sourceUrl || item.url || "#",
    region: item.region || "domestic",
    priority: Number(item.priority || index + 1),
    generatedAt: item.generatedAt || activeReport.generatedAt
  };
}

function render() {
  const selected = els.filter.value || "all";
  const items = activeReport.items
    .map(normalizeItem)
    .sort((a, b) => a.priority - b.priority);
  const visibleItems =
    selected === "all" ? items : items.filter((item) => item.domain === selected);

  els.date.textContent = formatDate(activeReport.date);

  const section = document.createElement("section");
  section.className = "date-section";

  const heading = document.createElement("div");
  heading.className = "date-heading";
  heading.innerHTML = `
    <div>
      <span>${formatDate(activeReport.date)}</span>
      <strong>${visibleItems.length} 条热点</strong>
    </div>
    <em>生成 ${new Date(activeReport.generatedAt).toLocaleString("zh-CN", {
      hour12: false
    })}</em>
  `;

  const grid = document.createElement("div");
  grid.className = "hot-grid";

  visibleItems.forEach((item, index) => {
    const meta = domainStyle[item.domain] || domainStyle.其他;
    const card = document.createElement("article");
    card.className = `hot-card ${meta.color}`;
    card.innerHTML = `
      <div class="rank">${String(index + 1).padStart(2, "0")}</div>
      <div class="tag" aria-label="${item.domain}">
        <span>${meta.icon}</span>
        <b>${item.domain}</b>
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
  els.board.replaceChildren(section);
}

function hydrateFilters(report) {
  const previous = els.filter.value || "all";
  els.filter.replaceChildren(
    createOption("all", "全部"),
    ...domains(report).map((domain) => createOption(domain, domain))
  );
  els.filter.value = [...els.filter.options].some((option) => option.value === previous)
    ? previous
    : "all";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadReport() {
  try {
    const response = await fetch("./public/data/latest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    activeReport = await response.json();
    els.status.textContent = "最新日报已加载";
  } catch (error) {
    activeReport = fallbackReport;
    els.status.textContent = "未能读取最新日报，正在显示内置兜底数据";
  }

  hydrateFilters(activeReport);
  render();
}

els.filter.addEventListener("change", render);
loadReport();
