const fallbackCurrent = {
  recordedAt: new Date().toISOString(),
  mmiValue: 65.51,
  moodLabel: "Greed",
  moodComment: "the greed zone.",
  niftyValue: 24200,
};

const fallbackWeeklyRows = [
  { summary_date: "2026-04-16", avg_value: 66.3, high_value: 67.1, low_value: 64.8, sample_count: 375, open_value: 64.9, close_value: 66.3 },
  { summary_date: "2026-04-15", avg_value: 62.37, high_value: 64.2, low_value: 58.9, sample_count: 376, open_value: 59.1, close_value: 62.37 },
  { summary_date: "2026-04-14", avg_value: 62.1, high_value: 63.7, low_value: 59.8, sample_count: 375, open_value: 60.2, close_value: 62.1 },
  { summary_date: "2026-04-13", avg_value: 60.99, high_value: 62.5, low_value: 57.6, sample_count: 375, open_value: 57.9, close_value: 60.99 },
  { summary_date: "2026-04-10", avg_value: 53.36, high_value: 56.2, low_value: 48.7, sample_count: 375, open_value: 49.3, close_value: 53.36 },
  { summary_date: "2026-04-09", avg_value: 47.28, high_value: 50.8, low_value: 41.9, sample_count: 375, open_value: 42.5, close_value: 47.28 },
  { summary_date: "2026-04-08", avg_value: 40.58, high_value: 44.2, low_value: 36.5, sample_count: 375, open_value: 37.1, close_value: 40.58 },
];

const fallbackHistoryRows = [
  ["16-04-2026 15:59:03", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:58:01", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:57:04", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:56:02", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:55:06", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:54:02", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:53:04", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:52:04", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:51:05", "65.51", "the greed zone.", "16-04-26", "April"],
  ["16-04-2026 15:50:03", "65.51", "the greed zone.", "16-04-26", "April"],
];

const averages = {
  daily: 66.3,
  five: 61.03,
  ten: 48.61,
  total: 46,
};

const thresholds = [
  { label: "Extreme Fear", max: 20, tone: "signal-down" },
  { label: "Fear", max: 40, tone: "signal-down" },
  { label: "Neutral", max: 60, tone: "signal-up" },
  { label: "Greed", max: 80, tone: "signal-up" },
  { label: "Extreme Greed", max: 100, tone: "signal-up" },
];

function classify(value) {
  return thresholds.find((zone) => value <= zone.max) || thresholds[thresholds.length - 1];
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function formatDateLabel(dateValue) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatHistoryTimestamp(dateValue) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

function monthName(dateValue) {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(dateValue));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }
  return response.json();
}

function renderTable(rows) {
  const tbody = document.getElementById("history-body");
  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.timestamp}</td>
          <td>${row.mmi}</td>
          <td>${row.comment}</td>
          <td>${row.date}</td>
          <td>${row.month}</td>
        </tr>`
    )
    .join("");
}

function renderSignals(current) {
  const items = [
    ["Daily Avg", averages.daily],
    ["5 Period Avg", averages.five],
    ["10 Period Avg", averages.ten],
    ["Total Avg", averages.total],
  ];

  const list = document.getElementById("signal-list");
  list.innerHTML = items
    .map(([label, value]) => {
      const above = current > value;
      return `
        <div class="signal-item">
          <div>
            <small>${label}</small>
            <strong>${above ? "Above" : "Below"} ${formatNumber(value)}</strong>
          </div>
          <span class="${above ? "signal-up" : "signal-down"}">${above ? "Up" : "Down"}</span>
        </div>`;
    })
    .join("");
}

function renderChartInto(svgId, values) {
  const svg = document.getElementById(svgId);
  const width = 820;
  const height = svgId === "weekly-chart" ? 220 : 260;
  const pad = 24;

  if (!values.length) {
    svg.innerHTML = "";
    return;
  }

  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const range = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;

  const points = values
    .map((value, index) => {
      const x = pad + index * stepX;
      const y = height - pad - ((value - min) / range) * (height - pad * 2);
      return [x, y];
    })
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  svg.innerHTML = `
    <defs>
      <linearGradient id="${svgId}-lineFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#7dd3fc" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="rgba(255,255,255,0.02)" />
    <polyline
      points="${points}"
      fill="none"
      stroke="#7dd3fc"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polyline
      points="${points} ${width - pad},${height - pad} ${pad},${height - pad}"
      fill="url(#${svgId}-lineFill)"
      stroke="none"
    />
  `;
}

function renderWeeklyCards(rows) {
  const cards = document.getElementById("weekly-cards");
  cards.innerHTML = rows
    .map(
      (row) => `
        <div class="week-card">
          <div class="week-card-top">
            <strong>${row.label}</strong>
            <span class="week-chip">${row.zone}</span>
          </div>
          <div class="week-meta">
            <span>Avg ${formatNumber(row.avg)}</span>
            <span>High ${formatNumber(row.high)}</span>
            <span>Low ${formatNumber(row.low)}</span>
            <span>${row.count} readings</span>
          </div>
        </div>`
    )
    .join("");
}

function setCurrentView(current) {
  const zone = classify(current.mmiValue);
  document.getElementById("current-mmi").textContent = `${formatNumber(current.mmiValue)}%`;
  document.getElementById("current-zone").textContent = zone.label;
  document.getElementById("current-zone").className = `zone-badge ${zone.tone}`;
  document.getElementById("current-comment").textContent = current.moodComment;
  document.getElementById("nifty-value").textContent = current.niftyValue ? Number(current.niftyValue).toLocaleString("en-IN") : "—";
  document.getElementById("daily-avg").textContent = formatNumber(averages.daily);
  document.getElementById("avg-5").textContent = formatNumber(averages.five);
  document.getElementById("avg-10").textContent = formatNumber(averages.ten);
  document.getElementById("avg-total").textContent = formatNumber(averages.total);
  document.getElementById("last-updated").textContent = `Updated ${new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(current.recordedAt))}`;
  document.getElementById("market-status").textContent = "Market open";
  renderSignals(current.mmiValue);
}

async function loadDashboard() {
  try {
    const [current, week, history] = await Promise.all([
      fetchJson("/api/current"),
      fetchJson("/api/week"),
      fetchJson("/api/history?days=7"),
    ]);

    setCurrentView(current);

    const weeklyRows = (week.rows || [])
      .slice()
      .reverse()
      .map((row) => ({
        label: formatDateLabel(`${row.summary_date}T00:00:00Z`),
        avg: Number(row.avg_value),
        high: Number(row.high_value),
        low: Number(row.low_value),
        count: Number(row.sample_count),
        zone: classify(Number(row.avg_value)).label,
      }));

    const historyRows = (history.rows || [])
      .slice()
      .map((row) => ({
        timestamp: formatHistoryTimestamp(row.recorded_at),
        mmi: formatNumber(row.mmi_value),
        comment: row.mood_comment,
        date: formatDateLabel(row.recorded_at),
        month: monthName(row.recorded_at),
      }))
      .reverse();

    renderChartInto(
      "mmi-chart",
      history.rows ? history.rows.slice().reverse().map((row) => Number(row.mmi_value)) : [fallbackCurrent.mmiValue]
    );
    renderWeeklyCards(weeklyRows);
    renderChartInto("weekly-chart", weeklyRows.map((row) => row.avg));
    renderTable(historyRows);
  } catch (_error) {
    setCurrentView(fallbackCurrent);

    const weeklyRows = fallbackWeeklyRows.map((row) => ({
      label: formatDateLabel(`${row.summary_date}T00:00:00Z`),
      avg: Number(row.avg_value),
      high: Number(row.high_value),
      low: Number(row.low_value),
      count: Number(row.sample_count),
      zone: classify(Number(row.avg_value)).label,
    }));

    const historyRows = fallbackHistoryRows.map(([timestamp, mmi, comment, date, month]) => ({
      timestamp,
      mmi,
      comment,
      date,
      month,
    }));

    renderChartInto("mmi-chart", [52.3, 54.1, 51.6, 49.8, 47.2, 44.9, 48.1, 51.8, 55.6, 58.4, 60.2, 63.8, 66.1, 64.7, 61.9, 59.4, 57.2, 54.8, 53.1, 52.4, 54.9, 58.6, 61.7, 63.1, 65.2, 66.0, 64.8, 62.9, 60.4, 58.7, 57.1, 56.4, 57.9, 60.3, 62.8, 64.5, 65.1, 65.5, 65.5, 65.51]);
    renderWeeklyCards(weeklyRows);
    renderChartInto("weekly-chart", weeklyRows.map((row) => row.avg));
    renderTable(historyRows);
  }
}

loadDashboard();
