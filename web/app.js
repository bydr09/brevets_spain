const DATA_URL = "./data/brevets_2027.json";
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DATE_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es-ES", { weekday: "long", timeZone: "UTC" });
const COMMUNITY_CENTERS = {
  "Andalucía": [37.45, -4.6],
  "Aragón": [41.65, -0.9],
  "Castilla y León": [41.65, -4.72],
  "Castilla-La Mancha": [39.28, -3.1],
  "Catalunya": [41.7, 1.7],
  "Comunidad de Madrid": [40.42, -3.7],
  "Comunidad Foral de Navarra": [42.7, -1.64],
  "Comunitat Valenciana": [39.6, -0.5],
  "Galicia": [42.75, -7.8],
  "Illes Balears": [39.57, 2.65],
  "Región de Murcia": [37.98, -1.13],
};

const state = {
  events: [], filtered: [], clubs: [], filteredClubs: [], territories: [],
  view: "home", month: 0, map: null, markerLayer: null,
};

const el = {
  form: document.querySelector("#filters"),
  search: document.querySelector("#search"),
  distance: document.querySelector("#distance"),
  month: document.querySelector("#month"),
  territory: document.querySelector("#territory"),
  organizer: document.querySelector("#organizer"),
  count: document.querySelector("#result-count"),
  tableBody: document.querySelector("#event-table-body"),
  tableEmpty: document.querySelector("#table-empty"),
  clubGrid: document.querySelector("#club-grid"),
  clubsEmpty: document.querySelector("#clubs-empty"),
  territoryGrid: document.querySelector("#territory-grid"),
  mapTerritoryList: document.querySelector("#map-territory-list"),
  upcomingGrid: document.querySelector("#upcoming-grid"),
  quickSearchForm: document.querySelector("#quick-search-form"),
  quickSearch: document.querySelector("#quick-search"),
  workspace: document.querySelector(".workspace"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarMonth: document.querySelector("#calendar-month"),
  previousMonth: document.querySelector("#previous-month"),
  nextMonth: document.querySelector("#next-month"),
  eventTotal: document.querySelector("#event-total"),
  clubTotal: document.querySelector("#club-total"),
  monthTotal: document.querySelector("#month-total"),
};

const panels = Object.fromEntries(
  ["home", "table", "calendar", "map", "clubs", "territories", "guide"]
    .map((view) => [view, document.querySelector(`#${view}-view`)]),
);

function normalized(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
}

function makeText(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function distanceClass(distance) {
  if (distance >= 1000) return "d1000";
  if (distance >= 600) return "d600";
  if (distance >= 400) return "d400";
  if (distance >= 300) return "d300";
  return "d200";
}

function addOption(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.append(option);
}

function fillControls() {
  unique(state.events.map((event) => event.distance_km)).sort((a, b) => a - b)
    .forEach((distance) => addOption(el.distance, distance, `${Number(distance).toLocaleString("es-ES")} km`));
  unique(state.events.map((event) => event.organizer))
    .forEach((organizer) => addOption(el.organizer, organizer, organizer));
  unique(state.events.map((event) => event.autonomous_community))
    .forEach((territory) => addOption(el.territory, territory, territory));
  MONTH_NAMES.forEach((month, index) => {
    addOption(el.month, String(index + 1).padStart(2, "0"), month);
    addOption(el.calendarMonth, index, `${month} 2027`);
  });
}

function aggregateClubs(events) {
  const clubs = new Map();
  for (const event of events) {
    if (!clubs.has(event.organizer)) {
      clubs.set(event.organizer, { name: event.organizer, acpCodes: new Set(), locations: new Set(), distances: new Set(), events: [], website: null });
    }
    const club = clubs.get(event.organizer);
    if (event.acp_code) club.acpCodes.add(event.acp_code);
    club.locations.add(event.start_locality);
    club.distances.add(event.distance_km);
    club.events.push(event);
    club.website ||= event.organizer_url || event.detail_source_url || null;
  }
  return [...clubs.values()].map((club) => ({
    ...club,
    acpCodes: [...club.acpCodes].sort(),
    locations: [...club.locations].sort((a, b) => a.localeCompare(b, "es")),
    distances: [...club.distances].sort((a, b) => a - b),
    events: club.events.sort((a, b) => a.date.localeCompare(b.date)),
  })).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function aggregateTerritories(events) {
  const territories = new Map();
  for (const event of events) {
    const name = event.autonomous_community;
    if (!territories.has(name)) territories.set(name, { name, events: [], clubs: new Set(), places: new Set(), distances: new Set() });
    const territory = territories.get(name);
    territory.events.push(event);
    territory.clubs.add(event.organizer);
    territory.places.add(event.start_locality);
    territory.distances.add(event.distance_km);
  }
  return [...territories.values()].map((territory) => ({
    ...territory,
    clubs: [...territory.clubs], places: [...territory.places], distances: [...territory.distances].sort((a, b) => a - b),
  })).sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name, "es"));
}

function applyFilters() {
  const query = normalized(el.search.value.trim());
  state.filtered = state.events.filter((event) => {
    const searchable = normalized(`${event.name} ${event.organizer} ${event.start_locality} ${event.province} ${event.autonomous_community}`);
    return (!query || searchable.includes(query))
      && (!el.distance.value || String(event.distance_km) === el.distance.value)
      && (!el.month.value || event.date.slice(5, 7) === el.month.value)
      && (!el.territory.value || event.autonomous_community === el.territory.value)
      && (!el.organizer.value || event.organizer === el.organizer.value);
  });
  state.filteredClubs = state.clubs.filter((club) => !query || normalized([
    club.name, ...club.acpCodes, ...club.locations,
  ].join(" ")).includes(query));
  if (el.month.value) state.month = Number(el.month.value) - 1;
  render();
}

function clubWebsite(event) {
  return event.organizer_url || event.detail_source_url || event.event_url || null;
}

function renderTable() {
  const fragment = document.createDocumentFragment();
  for (const event of state.filtered) {
    const row = document.createElement("tr");
    const club = makeText("td", "club-cell", event.organizer);
    const eventDate = new Date(`${event.date}T00:00:00Z`);
    const date = document.createElement("td");
    date.className = "date-cell";
    date.append(makeText("strong", "", DATE_FORMAT.format(eventDate).replace(".", "")), makeText("span", "", WEEKDAY_FORMAT.format(eventDate)));
    const distance = document.createElement("td");
    distance.append(makeText("span", `distance-badge ${distanceClass(event.distance_km)}${event.is_600_plus_8000m ? " extreme" : ""}`, event.is_600_plus_8000m ? "600E" : `${Number(event.distance_km).toLocaleString("es-ES")} km`));
    if (event.is_600_plus_8000m) distance.append(makeText("span", "extreme-mark", "+8.000 m D+"));
    const place = document.createElement("td");
    place.className = "place-cell";
    place.append(makeText("strong", "", event.start_locality), makeText("span", "", [event.province, event.autonomous_community].filter(Boolean).join(" · ")));
    const website = document.createElement("td");
    const url = clubWebsite(event);
    if (url) {
      const link = makeText("a", "club-link", "Más información ↗");
      link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; website.append(link);
    } else website.append(makeText("span", "no-link", "—"));
    row.append(club, date, distance, place, website);
    fragment.append(row);
  }
  el.tableBody.replaceChildren(fragment);
  el.tableEmpty.hidden = state.filtered.length !== 0;
}

function renderUpcoming() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = state.events.filter((event) => new Date(`${event.date}T00:00:00`) >= now).slice(0, 6);
  const selected = upcoming.length ? upcoming : state.events.slice(0, 6);
  const fragment = document.createDocumentFragment();
  for (const event of selected) {
    const card = document.createElement("article");
    card.className = "upcoming-card";
    const top = document.createElement("div");
    top.append(makeText("span", "upcoming-date", SHORT_DATE_FORMAT.format(new Date(`${event.date}T00:00:00Z`))), makeText("span", `distance-badge ${distanceClass(event.distance_km)}`, `${event.distance_km} km`));
    card.append(top, makeText("h3", "", event.start_locality), makeText("p", "", event.organizer), makeText("small", "", event.autonomous_community));
    fragment.append(card);
  }
  el.upcomingGrid.replaceChildren(fragment);
}

function renderClubs() {
  const fragment = document.createDocumentFragment();
  for (const club of state.filteredClubs) {
    const card = document.createElement("article");
    card.className = "club-card";
    const heading = document.createElement("div");
    heading.append(makeText("h3", "", club.name), makeText("span", "club-count", `${club.events.length} brevets`));
    card.append(heading);
    if (club.acpCodes.length) card.append(makeText("p", "club-code-line", `ACP ${club.acpCodes.join(" · ")}`));
    card.append(makeText("p", "club-meta", club.locations.join(" · ")));
    const distances = document.createElement("div");
    distances.className = "club-distances";
    club.distances.forEach((distance) => distances.append(makeText("span", distanceClass(distance), `${distance}`)));
    card.append(distances);
    const footer = document.createElement("footer");
    const next = club.events[0];
    footer.append(makeText("span", "", `Próximo: ${SHORT_DATE_FORMAT.format(new Date(`${next.date}T00:00:00Z`))}`));
    const button = makeText("button", "text-action", "Ver calendario →");
    button.type = "button";
    button.addEventListener("click", () => { el.organizer.value = club.name; applyFilters(); switchView("table"); });
    footer.append(button);
    card.append(footer);
    fragment.append(card);
  }
  el.clubGrid.replaceChildren(fragment);
  el.clubsEmpty.hidden = state.filteredClubs.length !== 0;
}

function renderTerritories() {
  const fragment = document.createDocumentFragment();
  for (const territory of state.territories) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "territory-card";
    card.append(makeText("span", "territory-total", territory.events.length), makeText("h3", "", territory.name), makeText("p", "", `${territory.clubs.length} clubes · ${territory.places.length} localidades`), makeText("small", "", territory.distances.map((distance) => `${distance} km`).join(" · ")));
    card.addEventListener("click", () => { el.territory.value = territory.name; applyFilters(); switchView("table"); });
    fragment.append(card);
  }
  el.territoryGrid.replaceChildren(fragment);
}

function shortClub(name) {
  return name.replace(/club ciclista/gi, "CC").replace(/randonneurs?/gi, "Rand.").replace(/peña cicloturista/gi, "PC").replace(/penya cicloturista/gi, "PC").trim();
}

function renderCalendar() {
  const year = 2027;
  const month = state.month;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayOffset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const byDay = new Map();
  state.filtered.filter((event) => Number(event.date.slice(5, 7)) - 1 === month).forEach((event) => {
    const day = Number(event.date.slice(8, 10));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(event);
  });
  const fragment = document.createDocumentFragment();
  el.calendarGrid.style.setProperty("--calendar-weeks", cellCount / 7);
  for (let cell = 0; cell < cellCount; cell += 1) {
    const day = cell - mondayOffset + 1;
    const dayEvents = byDay.get(day) || [];
    const container = document.createElement("div");
    container.className = `calendar-day${day < 1 || day > daysInMonth ? " outside" : ""}${dayEvents.length ? " has-events" : ""}`;
    if (day >= 1 && day <= daysInMonth) {
      container.append(makeText("span", "day-number", day));
      const eventList = document.createElement("div");
      eventList.className = `calendar-events${dayEvents.length >= 6 ? " dense" : ""}`;
      for (const event of dayEvents) {
        const item = document.createElement("div");
        item.className = `calendar-event ${distanceClass(event.distance_km)}${event.is_600_plus_8000m ? " extreme" : ""}`;
        item.title = `${event.organizer} · ${event.distance_km} km · ${event.start_locality}`;
        item.append(makeText("strong", "", event.is_600_plus_8000m ? "600E" : `${event.distance_km} km`), makeText("span", "", ` · ${shortClub(event.organizer)}`));
        eventList.append(item);
      }
      container.append(eventList);
    }
    fragment.append(container);
  }
  el.calendarGrid.replaceChildren(fragment);
  el.calendarMonth.value = state.month;
  el.previousMonth.disabled = state.month === 0;
  el.nextMonth.disabled = state.month === 11;
}

function initMap() {
  if (state.map || !window.L) return;
  state.map = window.L.map("brevet-map", { scrollWheelZoom: false }).setView([40.15, -3.8], 6);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(state.map);
  state.markerLayer = window.L.layerGroup().addTo(state.map);
}

function renderMap() {
  initMap();
  const totals = aggregateTerritories(state.filtered);
  const list = document.createDocumentFragment();
  for (const territory of totals) {
    const button = document.createElement("button");
    button.type = "button";
    button.append(makeText("span", "", territory.name), makeText("strong", "", territory.events.length));
    button.addEventListener("click", () => { el.territory.value = territory.name; applyFilters(); switchView("table"); });
    list.append(button);
  }
  el.mapTerritoryList.replaceChildren(list);
  if (!state.map || !state.markerLayer) {
    document.querySelector("#brevet-map").textContent = "El mapa necesita conexión para cargar la cartografía.";
    return;
  }
  state.markerLayer.clearLayers();
  for (const territory of totals) {
    const center = COMMUNITY_CENTERS[territory.name];
    if (!center) continue;
    const marker = window.L.circleMarker(center, { radius: 8 + Math.sqrt(territory.events.length) * 2.2, color: "#12372a", weight: 2, fillColor: "#efc76a", fillOpacity: .9 });
    marker.bindTooltip(`<strong>${territory.name}</strong><br>${territory.events.length} brevets · ${territory.clubs.length} clubes`);
    marker.on("click", () => { el.territory.value = territory.name; applyFilters(); switchView("table"); });
    marker.addTo(state.markerLayer);
  }
}

function render() {
  renderTable();
  renderCalendar();
  renderClubs();
  renderMap();
  updateResultCount();
}

function updateResultCount() {
  if (["home", "guide"].includes(state.view)) el.count.textContent = "Calendario oficial 2027";
  else if (state.view === "clubs") el.count.textContent = `${state.filteredClubs.length} ${state.filteredClubs.length === 1 ? "club" : "clubes"}`;
  else if (state.view === "territories") el.count.textContent = `${state.territories.length} territorios`;
  else el.count.textContent = `${state.filtered.length} ${state.filtered.length === 1 ? "brevet" : "brevets"}`;
}

function switchView(view, persist = true, pushHistory = true) {
  if (!panels[view]) return;
  state.view = view;
  if (persist) try { localStorage.setItem("brevets-2027-view", view); } catch { /* no disponible */ }
  const targetHash = `#${view}`;
  if (pushHistory && window.location.hash !== targetHash) {
    window.history.pushState({ view }, "", targetHash);
  }
  document.querySelectorAll(".view-button").forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected);
  });
  Object.entries(panels).forEach(([name, panel]) => {
    const selected = name === view;
    panel.classList.toggle("active", selected);
    panel.hidden = !selected;
  });
  const eventView = ["table", "calendar", "map"].includes(view);
  el.workspace.classList.toggle("event-mode", eventView);
  el.workspace.classList.toggle("clubs-mode", view === "clubs");
  el.workspace.classList.toggle("content-mode", ["home", "territories", "guide"].includes(view));
  el.search.placeholder = view === "clubs" ? "Buscar club o localidad" : "Buscar club o población";
  if (view === "map") setTimeout(() => { initMap(); renderMap(); state.map?.invalidateSize(); }, 0);
  updateResultCount();
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.events = await response.json();
    state.events.sort((a, b) => a.date.localeCompare(b.date) || a.organizer.localeCompare(b.organizer, "es"));
    state.filtered = [...state.events];
    state.clubs = aggregateClubs(state.events);
    state.filteredClubs = [...state.clubs];
    state.territories = aggregateTerritories(state.events);
    state.month = Math.max(0, Number(state.events[0].date.slice(5, 7)) - 1);
    el.eventTotal.textContent = state.events.length;
    el.clubTotal.textContent = state.clubs.length;
    el.monthTotal.textContent = new Set(state.events.map((event) => event.date.slice(5, 7))).size;
    fillControls();
    renderUpcoming();
    renderTerritories();
    render();
    let savedView = "home";
    try { savedView = localStorage.getItem("brevets-2027-view") || "home"; } catch { /* no disponible */ }
    const hashView = window.location.hash.slice(1);
    const initialView = panels[hashView] ? hashView : (panels[savedView] ? savedView : "home");
    window.history.replaceState({ view: initialView }, "", `#${initialView}`);
    switchView(initialView, false, false);
  } catch (error) {
    console.error(error);
    el.count.textContent = "Error al cargar los datos";
    el.tableEmpty.hidden = false;
    el.tableEmpty.textContent = "No se pudo cargar el calendario.";
  }
}

document.querySelectorAll(".view-button").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); switchView(button.dataset.goView); }));
el.form.addEventListener("input", applyFilters);
el.form.addEventListener("change", applyFilters);
el.form.addEventListener("reset", () => setTimeout(applyFilters));
el.quickSearchForm.addEventListener("submit", (event) => { event.preventDefault(); el.search.value = el.quickSearch.value.trim(); applyFilters(); switchView("table"); });
el.calendarMonth.addEventListener("change", () => { state.month = Number(el.calendarMonth.value); el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); });
el.previousMonth.addEventListener("click", () => { if (state.month > 0) { state.month -= 1; el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); } });
el.nextMonth.addEventListener("click", () => { if (state.month < 11) { state.month += 1; el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); } });
window.addEventListener("resize", () => { renderCalendar(); state.map?.invalidateSize(); });
window.addEventListener("popstate", (event) => {
  const historyView = event.state?.view || window.location.hash.slice(1) || "home";
  switchView(panels[historyView] ? historyView : "home", false, false);
});

init();
