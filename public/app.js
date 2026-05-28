const state = {
  data: null,
  filter: "all",
  search: "",
  refreshTimer: null,
  authSession: null,
};

const AUTH_STORAGE_KEY = "facilityflow-auth-session";

const defaultLocation = {
  name: "Johannesburg Operations Hub",
  lat: -26.2041,
  lng: 28.0473,
};

const marketplaceFeatures = [
  {
    title: "Contractor Hub",
    text: "Approve vendors, compare maintenance partners, and control service-level delivery from the employer portal.",
    tag: "Marketplace",
  },
  {
    title: "Compliance Watch",
    text: "Track inspections, risk actions, and expiring compliance items across buildings and equipment.",
    tag: "Safety",
  },
  {
    title: "Space Services",
    text: "Manage cleaning, meeting rooms, workspace support, and shared service requests across sites.",
    tag: "Operations",
  },
  {
    title: "Procurement Flow",
    text: "Source spares, raise purchase requests, and connect damage reports to stock and supplier actions.",
    tag: "Supply",
  },
];

const appTiles = [
  { name: "Asset Control", detail: "Register, update, and search every facility asset.", color: "amber" },
  { name: "Damage Desk", detail: "Prioritize damaged items and assign repairs fast.", color: "rose" },
  { name: "Work Allocation", detail: "Plan technicians, due dates, and live WIP execution.", color: "slate" },
  { name: "Reports Vault", detail: "Store, review, and govern reports and supporting files.", color: "emerald" },
  { name: "Teams Connect", detail: "Launch communications and collaboration from the dashboard.", color: "blue" },
  { name: "AI Brain", detail: "Read operational signals and suggest next best actions.", color: "gold" },
];

const qs = (selector) => document.querySelector(selector);

function loadAuthSession() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveAuthSession(session) {
  state.authSession = session;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearAuthSession() {
  state.authSession = null;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function toast(message) {
  const el = qs("#toast");
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseDateOnly(value) {
  if (!value) {
    return null;
  }
  const parts = String(value).split("-");
  if (parts.length !== 3) {
    return null;
  }
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatWeekday(dateValue) {
  return dateValue.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMonthKey(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return value || "Unknown";
  }
  const [year, month] = value.split("-");
  const dateValue = new Date(Number(year), Number(month) - 1, 1);
  return dateValue.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function getWeekBounds(referenceDate = new Date()) {
  const current = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(current);
  start.setDate(current.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

async function fetchState() {
  const response = await fetch("/api/state");
  state.data = await response.json();
  render();
}

async function fetchPowerBIRecords() {
  const response = await fetch("/api/powerbi-records");
  return response.json();
}

async function runAutomationNow() {
  const response = await fetch("/api/automation-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return response.json();
}

async function loginWithPassword(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

function matchesSearch(item) {
  if (!state.search) {
    return true;
  }
  const text = JSON.stringify(item).toLowerCase();
  return text.includes(state.search);
}

function filteredAssets() {
  const assets = state.data.assets.filter(matchesSearch);
  if (state.filter === "all") {
    return assets;
  }
  return assets.filter((asset) => asset.status.toLowerCase() === state.filter);
}

function allowedEmailDomain() {
  return String(state.data?.settings?.allowedEmailDomain || "unisa.ac.za")
    .toLowerCase()
    .replace(/^@/, "")
    .trim();
}

function hasValidAuth() {
  const session = state.authSession;
  if (!session?.email || !session?.role) {
    return false;
  }
  return session.email.toLowerCase().endsWith(`@${allowedEmailDomain()}`);
}

function renderMetrics() {
  const assets = state.data.assets;
  const damaged = assets.filter((asset) => asset.status.toLowerCase() === "damaged");
  const openWork = state.data.workOrders.filter((item) => item.status.toLowerCase() !== "completed");

  qs("#metricAssets").textContent = assets.length;
  qs("#metricDamaged").textContent = damaged.length;
  qs("#metricWorkOrders").textContent = openWork.length;
  qs("#metricReports").textContent = state.data.reports.length;
  qs("#metricApps").textContent = appTiles.length;
}

function renderSettings() {
  const form = qs("#settingsForm");
  const settings = state.data.settings || {};
  if (!form) {
    return;
  }

  [
    "companyName",
    "allowedEmailDomain",
    "aiMode",
    "gpsSiteName",
    "gpsLat",
    "gpsLng",
    "autoRefreshSeconds",
    "studentSupportEmail",
    "studentSupportPhone",
    "accessibilityStandard",
    "doodleLink",
    "doodleSSOLink",
    "outlookLink",
    "teamsLink",
    "powerAutomateLink",
    "powerBILink",
    "whatsAppLink",
    "telegramLink",
  ].forEach((key) => {
    if (form.elements[key]) {
      form.elements[key].value = settings[key] ?? "";
    }
  });

  if (form.elements.employerCanEdit) {
    form.elements.employerCanEdit.checked = Boolean(settings.employerCanEdit);
  }
}

function renderAuth() {
  const overlay = qs("#authOverlay");
  const authStatus = qs("#authStatus");
  const userName = qs("#currentUserName");
  const userEmail = qs("#currentUserEmail");
  const domain = allowedEmailDomain();

  if (hasValidAuth()) {
    overlay.classList.add("hidden");
    document.body.classList.remove("app-locked");
    userName.textContent = state.authSession.displayName || "Signed In User";
    userEmail.textContent = `${state.authSession.email || ""} | ${state.authSession.role || "user"}`;
    return;
  }

  overlay.classList.remove("hidden");
  document.body.classList.add("app-locked");
  userName.textContent = "Guest";
  userEmail.textContent = `Sign in with @${domain}`;
  authStatus.textContent = `Use your work email ending with @${domain} to access the app.`;
}

function renderStudentSupport() {
  const supportItems = state.data.studentSupport || [];
  const workstations = state.data.workstations || [];
  const settings = state.data.settings || {};

  qs("#supportStandardText").textContent =
    `${settings.accessibilityStandard || "WCAG 2.2 AA"} with integrated academic, career, personal, and accessibility support.`;

  qs("#studentSupportEmailLink").href = `mailto:${settings.studentSupportEmail || "studentsupport@unisa.ac.za"}`;
  qs("#studentSupportPhoneLink").href = `tel:${settings.studentSupportPhone || "0800001870"}`;

  qs("#studentSupportList").innerHTML = supportItems
    .filter(matchesSearch)
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.title)}</strong><br />
          ${escapeHtml(item.channel)}<br />
          <span class="muted">${escapeHtml(item.detail)}</span>
        </li>
      `
    )
    .join("");

  qs("#workstationTableBody").innerHTML =
    workstations
      .filter(matchesSearch)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.id)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.location)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(item.internet)}</td>
            <td>${escapeHtml(item.accessibility)}</td>
          </tr>
        `
      )
      .join("") || `<tr><td colspan="6">No workstation records found.</td></tr>`;
}

function renderPowerTools() {
  const settings = state.data.settings || {};
  const flows = state.data.powerAutomation || [];
  const runs = state.data.automationRuns || [];

  qs("#powerAutomateLink").href = settings.powerAutomateLink || "https://make.powerautomate.com/";
  qs("#powerBILink").href = settings.powerBILink || "https://app.powerbi.com/";
  qs("#powerAutomateLaunch").href = settings.powerAutomateLink || "https://make.powerautomate.com/";
  qs("#powerBILaunch").href = settings.powerBILink || "https://app.powerbi.com/";
  qs("#powerBIExport").href = "/api/powerbi-records";
  qs("#automationStatus").textContent =
    `Automation mode: ${settings.automationMode || "Seconds Automation"} | Refresh every ${settings.autoRefreshSeconds || 5} seconds.`;

  qs("#powerAutomationList").innerHTML = flows
    .filter(matchesSearch)
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.name)}</strong><br />
          Trigger: ${escapeHtml(item.trigger)}<br />
          Action: ${escapeHtml(item.action)}<br />
          <span class="muted">Status: ${escapeHtml(item.status)}</span>
        </li>
      `
    )
    .join("");

  qs("#automationRunList").innerHTML = runs
    .slice(0, 5)
    .filter(matchesSearch)
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.id)}</strong><br />
          ${escapeHtml(item.message)}<br />
          <span class="muted">${escapeHtml(item.processedAt)}</span>
        </li>
      `
    )
    .join("");
}

async function renderPowerBIRecords() {
  const payload = await fetchPowerBIRecords();

  qs("#powerBITableBody").innerHTML = Object.entries(payload.counts)
    .filter(([key]) => matchesSearch(key))
    .map(
      ([key, value]) => `
        <tr>
          <td>${escapeHtml(key)}</td>
          <td>${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");

  qs("#bookingCapacityTableBody").innerHTML = (payload.bookingCapacity || [])
    .filter(matchesSearch)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.centerName)}</td>
          <td>${escapeHtml(item.bookings)}</td>
          <td>${escapeHtml(item.spacesAvailable)}</td>
          <td>${escapeHtml(item.spacesRemaining)}</td>
        </tr>
      `
    )
    .join("");

  const bookingRecords = state.data?.bookings || [];
  const centers = [...new Set(bookingRecords.map((item) => item.centerName).filter(Boolean))];
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Map(
    (payload.monthlyBookingSummary || []).map((item) => [`${item.month}__${item.centerName}`, item])
  );
  const monthlyRows = [];

  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${currentYear}-${String(month).padStart(2, "0")}`;
    const centerList = centers.length ? centers : ["No Center"];
    centerList.forEach((centerName) => {
      const existing = monthlyMap.get(`${monthKey}__${centerName}`);
      monthlyRows.push(
        existing || {
          month: monthKey,
          centerName,
          bookings: 0,
          studentRecords: 0,
          emailRecords: 0,
          spacesAvailable: 0,
          spacesRemaining: 0,
        }
      );
    });
  }

  qs("#monthlyBookingTableBody").innerHTML = monthlyRows
    .filter(matchesSearch)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(formatMonthKey(item.month))}</td>
          <td>${escapeHtml(item.centerName)}</td>
          <td>${escapeHtml(item.bookings)}</td>
          <td>${escapeHtml(item.studentRecords)}</td>
          <td>${escapeHtml(item.emailRecords)}</td>
          <td>${escapeHtml(item.spacesAvailable)}</td>
          <td>${escapeHtml(item.spacesRemaining)}</td>
        </tr>
      `
    )
    .join("");
}

function renderDoodle() {
  const settings = state.data.settings || {};
  const bookings = state.data.bookings || [];
  const doodleUrl = settings.doodleLink || "https://doodle.com/";
  const doodleSSOUrl = settings.doodleSSOLink || "https://doodle.com/login/sso";
  const { start, end } = getWeekBounds(new Date());
  const weeklyBookings = bookings.filter((item) => {
    const dateValue = parseDateOnly(item.bookingDate);
    return dateValue && dateValue >= start && dateValue <= end;
  });
  const weeklySummary = new Map();
  const centers = [...new Set(bookings.map((item) => item.centerName).filter(Boolean))];
  const students = [...new Set(bookings.map((item) => item.studentName).filter(Boolean))];
  const emails = [...new Set(bookings.map((item) => item.email).filter(Boolean))];
  const months = [...new Set(bookings.map((item) => String(item.bookingDate || "").slice(0, 7)).filter(Boolean))];
  const totalBookings = bookings.reduce((sum, item) => sum + Number(item.bookingNumber || 0), 0);

  qs("#doodleLink").href = doodleUrl;
  qs("#doodleInlineLogin").href = "#doodle";
  qs("#doodleLaunch").href = doodleUrl;
  qs("#doodleSSOLaunch").href = doodleSSOUrl;
  qs("#doodleExport").href = "/api/export-doodle-bookings";
  qs("#doodleMetricBookings").textContent = totalBookings;
  qs("#doodleMetricCentres").textContent = centers.length;
  qs("#doodleMetricStudents").textContent = students.length;
  qs("#doodleMetricEmails").textContent = emails.length;
  qs("#doodleMetricMonths").textContent = months.length;
  qs("#doodleLiveStatus").textContent =
    `Showing ${weeklyBookings.length} weekly booking records and ${totalBookings} total booked slots across ${months.length} month(s). Auto-refresh follows your automation setting.`;

  qs("#doodleBookingTableBody").innerHTML = bookings
    .filter(matchesSearch)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.id)}</td>
          <td>${escapeHtml(item.centerName)}</td>
          <td>${escapeHtml(item.studentName)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.bookingNumber)}</td>
          <td>${escapeHtml(item.spacesAvailable)}</td>
          <td>${escapeHtml(item.bookingDate)}</td>
        </tr>
      `
    )
    .join("");

  for (let offset = 0; offset < 7; offset += 1) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + offset);
    const dayLabel = formatWeekday(dayDate);
    (centers.length ? centers : ["No Center"]).forEach((centerName) => {
      weeklySummary.set(`${dayLabel}__${centerName}`, {
        dayLabel,
        centerName,
        bookings: 0,
        spacesAvailable: 0,
        studentRecords: 0,
      });
    });
  }

  weeklyBookings.forEach((item) => {
    const dateValue = parseDateOnly(item.bookingDate);
    const dayLabel = dateValue ? formatWeekday(dateValue) : "Unknown";
    const key = `${dayLabel}__${item.centerName}`;
    const existing = weeklySummary.get(key) || {
      dayLabel,
      centerName: item.centerName,
      bookings: 0,
      spacesAvailable: Number(item.spacesAvailable || 0),
      studentRecords: 0,
    };
    existing.bookings += Number(item.bookingNumber || 0);
    existing.studentRecords += 1;
    if (Number(item.spacesAvailable || 0) > 0) {
      existing.spacesAvailable = Number(item.spacesAvailable || 0);
    }
    weeklySummary.set(key, existing);
  });

  qs("#weeklyBookingTableBody").innerHTML =
    Array.from(weeklySummary.values())
      .filter(matchesSearch)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.dayLabel)}</td>
            <td>${escapeHtml(item.centerName)}</td>
            <td>${escapeHtml(item.bookings)}</td>
            <td>${escapeHtml(item.spacesAvailable)}</td>
            <td>${escapeHtml(item.studentRecords)}</td>
          </tr>
        `
      )
      .join("") || `<tr><td colspan="5">No booking records found for the current week.</td></tr>`;
}

function renderAssets() {
  const rows = filteredAssets()
    .map(
      (asset) => `
        <tr>
          <td>${escapeHtml(asset.id)}</td>
          <td>${escapeHtml(asset.name)}</td>
          <td>${escapeHtml(asset.status)}</td>
          <td>${escapeHtml(asset.location)}</td>
          <td>${escapeHtml(asset.category)}</td>
          <td>${escapeHtml(asset.notes)}</td>
        </tr>
      `
    )
    .join("");

  qs("#assetTableBody").innerHTML =
    rows ||
    `<tr><td colspan="6">No assets match the current search or filter.</td></tr>`;
}

function renderWorkOrders() {
  const items = state.data.workOrders
    .filter(matchesSearch)
    .map(
      (job) => `
      <li>
        <strong>${escapeHtml(job.title)}</strong><br />
        ${escapeHtml(job.id)} | ${escapeHtml(job.status)} | ${escapeHtml(job.priority)}<br />
        Assigned to ${escapeHtml(job.assignedTo)}${job.assetId ? ` for ${escapeHtml(job.assetId)}` : ""}
      </li>
    `
    )
    .join("");
  qs("#workOrderList").innerHTML = items || "<li>No work orders found.</li>";
}

function renderChecklist() {
  qs("#maintenanceList").innerHTML = state.data.maintenanceChecklist
    .filter(matchesSearch)
    .map((item) => `<li><strong>${escapeHtml(item.item)}</strong><br />${escapeHtml(item.status)}</li>`)
    .join("");

  qs("#wipList").innerHTML = state.data.wip
    .filter(matchesSearch)
    .map((item) => `<li><strong>${escapeHtml(item.title)}</strong><br />${escapeHtml(item.status)}</li>`)
    .join("");
}

function renderPortals() {
  const employer = state.data.employees
    .filter((person) => person.portal === "Employer")
    .filter(matchesSearch)
    .map(
      (person) => `<li><strong>${escapeHtml(person.name)}</strong><br />${escapeHtml(person.role)} | ${escapeHtml(person.email)}</li>`
    )
    .join("");
  const employee = state.data.employees
    .filter((person) => person.portal === "Employee")
    .filter(matchesSearch)
    .map(
      (person) => `<li><strong>${escapeHtml(person.name)}</strong><br />${escapeHtml(person.role)} | ${escapeHtml(person.team)}</li>`
    )
    .join("");

  qs("#employerPortal").innerHTML = employer || "<li>No employer records found.</li>";
  qs("#employeePortal").innerHTML = employee || "<li>No employee records found.</li>";
}

function renderReports() {
  qs("#reportList").innerHTML = state.data.reports
    .filter(matchesSearch)
    .map(
      (report) => `
      <li>
        <strong>${escapeHtml(report.title)}</strong><br />
        ${escapeHtml(report.category)} | ${escapeHtml(report.uploadedBy)}<br />
        ${escapeHtml(report.fileName)}
      </li>
    `
    )
    .join("");
}

function renderAI() {
  qs("#aiSummary").textContent = state.data.ai.summary;
  qs("#aiAlerts").innerHTML = state.data.ai.alerts.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  qs("#aiRecommendations").innerHTML = state.data.ai.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  qs("#activityList").innerHTML = state.data.activity
    .slice(0, 8)
    .filter(matchesSearch)
    .map((item) => `<li>${escapeHtml(item.message)}<br /><span class="muted small">${escapeHtml(item.timestamp)}</span></li>`)
    .join("");
}

function renderLinks() {
  const settings = state.data.settings || {};
  const whatsAppUrl = settings.whatsAppLink || "https://wa.me/";
  const telegramUrl = settings.telegramLink || "https://t.me/";
  const lat = settings.gpsLat ?? defaultLocation.lat;
  const lng = settings.gpsLng ?? defaultLocation.lng;
  const siteName = settings.gpsSiteName || defaultLocation.name;
  const mapQuery = `${lat},${lng}`;
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`;
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  qs("#outlookLink").href = settings.outlookLink || "https://outlook.office.com/mail/";
  qs("#teamsLink").href = settings.teamsLink || "https://teams.microsoft.com/";
  qs("#powerAutomateLink").href = settings.powerAutomateLink || "https://make.powerautomate.com/";
  qs("#powerBILink").href = settings.powerBILink || "https://app.powerbi.com/";
  qs("#whatsAppLink").href = whatsAppUrl;
  qs("#telegramLink").href = telegramUrl;
  qs("#whatsAppLaunch").href = whatsAppUrl;
  qs("#telegramLaunch").href = telegramUrl;
  qs("#gpsMapFrame").src = `${mapsUrl}&z=14&output=embed`;
  qs("#mapsLink").href = mapsUrl;
  qs("#navigationLink").href = navigationUrl;
  qs("#facilityAddress").textContent = siteName;
  qs("#facilityCoordinates").textContent = `Latitude/Longitude: ${lat}, ${lng}`;
}

function renderMarketplace() {
  qs("#marketplaceFeatures").innerHTML = marketplaceFeatures
    .filter(matchesSearch)
    .map(
      (item) => `
        <article class="market-card">
          <span class="pill">${escapeHtml(item.tag)}</span>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="muted">${escapeHtml(item.text)}</p>
        </article>
      `
    )
    .join("");

  qs("#appsGrid").innerHTML = appTiles
    .filter(matchesSearch)
    .map(
      (app) => `
        <article class="app-tile ${escapeHtml(app.color)}">
          <div class="app-icon">${escapeHtml(app.name.slice(0, 1))}</div>
          <div>
            <h4>${escapeHtml(app.name)}</h4>
            <p class="muted">${escapeHtml(app.detail)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function render() {
  renderAuth();
  renderMetrics();
  renderSettings();
  renderMarketplace();
  renderStudentSupport();
  renderDoodle();
  renderPowerTools();
  renderAssets();
  renderWorkOrders();
  renderChecklist();
  renderPortals();
  renderReports();
  renderAI();
  renderLinks();
  renderPowerBIRecords().catch((error) => toast(`Power BI records failed: ${error.message}`));
  startAutoRefresh();
}

function startAutoRefresh() {
  const seconds = Math.max(2, Number(state.data?.settings?.autoRefreshSeconds || 5));
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }
  state.refreshTimer = setInterval(() => {
    fetchState().catch(() => {});
  }, seconds * 1000);
}

async function postJson(url, form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const checkbox = form.querySelector('input[name="employerCanEdit"]');
  if (checkbox) {
    payload.employerCanEdit = checkbox.checked;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Request failed.");
  }
}

async function uploadAssetFile() {
  const input = qs("#excelUpload");
  const file = input.files[0];
  if (!file) {
    toast("Choose an Excel or CSV file first.");
    return;
  }

  const response = await fetch(`/api/upload-assets?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: await file.arrayBuffer(),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Upload failed.");
  }
  toast(`Imported ${result.count} assets from ${file.name}.`);
  input.value = "";
  await fetchState();
}

function wireEvents() {
  state.authSession = loadAuthSession();

  qs("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  qs("#refreshBtn").addEventListener("click", fetchState);

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.filter = button.dataset.filter;
      renderAssets();
    });
  });

  qs("#assetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await postJson("/api/assets", event.target);
      event.target.reset();
      toast("Asset added.");
      await fetchState();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#workOrderForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await postJson("/api/workorders", event.target);
      event.target.reset();
      toast("Work order created.");
      await fetchState();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#reportForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await postJson("/api/reports", event.target);
      event.target.reset();
      toast("Report saved.");
      await fetchState();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#uploadBtn").addEventListener("click", async () => {
    try {
      await uploadAssetFile();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await postJson("/api/settings", event.target);
      toast("Settings saved.");
      await fetchState();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    try {
      const result = await loginWithPassword(payload.workEmail, payload.password);
      if (!result.ok) {
        throw new Error(result.error || "Login failed.");
      }
      saveAuthSession(result.user);
      toast("Signed in successfully.");
      render();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#logoutBtn").addEventListener("click", () => {
    clearAuthSession();
    render();
    toast("You have been logged out.");
  });

  qs("#runAutomationBtn").addEventListener("click", async () => {
    try {
      const result = await runAutomationNow();
      if (!result.ok) {
        throw new Error(result.error || "Automation failed.");
      }
      toast("Automation completed in seconds.");
      await fetchState();
    } catch (error) {
      toast(error.message);
    }
  });

  qs("#doodleSessionSync").addEventListener("click", (event) => {
    event.preventDefault();
    window.open(qs("#doodleLaunch").href, "_blank", "noopener,noreferrer");
  });

  qs("#doodleInlineLogin").addEventListener("click", (event) => {
    event.preventDefault();
    window.open(qs("#doodleLaunch").href, "_blank", "noopener,noreferrer");
  });
}

wireEvents();
fetchState().catch((error) => {
  toast(`Failed to load app: ${error.message}`);
});
