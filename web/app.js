const DATA_URL = "./data/brevets_2027.json";
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DATE_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es-ES", { weekday: "long", timeZone: "UTC" });
const state = {
  events: [], filtered: [], clubs: [], filteredClubs: [],
  view: "home", month: 0,
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
  homeDateList: document.querySelector("#home-date-list"),
  homeClubList: document.querySelector("#home-club-list"),
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
  ["home", "table", "calendar", "clubs"]
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
      clubs.set(event.organizer, { name: event.organizer, acpCodes: new Set(), locations: new Set(), distances: new Set(), contacts: new Set(), emails: new Set(), events: [], website: null });
    }
    const club = clubs.get(event.organizer);
    if (event.acp_code) club.acpCodes.add(event.acp_code);
    club.locations.add(event.start_locality);
    club.distances.add(event.distance_km);
    if (event.ride_organizer) club.contacts.add(event.ride_organizer);
    const email = event.organizer_email || event.contact_email || event.email;
    if (email) club.emails.add(email);
    club.events.push(event);
    club.website ||= event.organizer_url || event.detail_source_url || null;
  }
  return [...clubs.values()].map((club) => ({
    ...club,
    acpCodes: [...club.acpCodes].sort(),
    locations: [...club.locations].sort((a, b) => a.localeCompare(b, "es")),
    distances: [...club.distances].sort((a, b) => a - b),
    contacts: [...club.contacts].sort((a, b) => a.localeCompare(b, "es")),
    emails: [...club.emails].sort((a, b) => a.localeCompare(b, "es")),
    events: club.events.sort((a, b) => a.date.localeCompare(b.date)),
  })).sort((a, b) => a.name.localeCompare(b.name, "es"));
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
    club.name, ...club.acpCodes, ...club.locations, ...club.contacts, ...club.emails,
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

function renderHomeDirectories() {
  const dateFragment = document.createDocumentFragment();
  for (const event of state.events.slice(0, 4)) {
    const row = document.createElement("div");
    row.className = "directory-row date-row";
    const date = makeText("time", "directory-date", SHORT_DATE_FORMAT.format(new Date(`${event.date}T00:00:00Z`)));
    date.dateTime = event.date;
    const detail = document.createElement("div");
    detail.append(makeText("strong", "", event.start_locality), makeText("small", "", event.organizer));
    row.append(date, detail, makeText("span", `directory-distance ${distanceClass(event.distance_km)}`, `${event.distance_km} km`));
    dateFragment.append(row);
  }
  el.homeDateList.replaceChildren(dateFragment);

  const clubFragment = document.createDocumentFragment();
  for (const club of state.clubs.slice(0, 4)) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "directory-row club-row";
    const detail = document.createElement("div");
    detail.append(makeText("strong", "", club.name), makeText("small", "", `Próximo: ${SHORT_DATE_FORMAT.format(new Date(`${club.events[0].date}T00:00:00Z`))}`));
    row.append(detail, makeText("span", "club-event-count", `${club.events.length} ${club.events.length === 1 ? "brevet" : "brevets"}`));
    row.addEventListener("click", () => { el.organizer.value = club.name; applyFilters(); switchView("table"); });
    clubFragment.append(row);
  }
  el.homeClubList.replaceChildren(clubFragment);
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
    if (club.contacts.length || club.emails.length) {
      const contact = document.createElement("div");
      contact.className = "club-contact";
      if (club.contacts.length) contact.append(makeText("p", "", `${club.contacts.length === 1 ? "Responsable" : "Responsables"}: ${club.contacts.join(" · ")}`));
      for (const email of club.emails) {
        const link = makeText("a", "", email);
        link.href = `mailto:${email}`;
        contact.append(link);
      }
      card.append(contact);
    }
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

function render() {
  renderTable();
  renderCalendar();
  renderClubs();
  updateResultCount();
}

function updateResultCount() {
  if (state.view === "home") el.count.textContent = "Calendario oficial 2027";
  else if (state.view === "clubs") el.count.textContent = `${state.filteredClubs.length} ${state.filteredClubs.length === 1 ? "club" : "clubes"}`;
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
  const eventView = ["table", "calendar"].includes(view);
  el.workspace.classList.toggle("event-mode", eventView);
  el.workspace.classList.toggle("clubs-mode", view === "clubs");
  el.workspace.classList.toggle("content-mode", view === "home");
  el.search.placeholder = view === "clubs" ? "Buscar club o localidad" : "Buscar club o población";
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
    state.month = Math.max(0, Number(state.events[0].date.slice(5, 7)) - 1);
    el.eventTotal.textContent = state.events.length;
    el.clubTotal.textContent = state.clubs.length;
    el.monthTotal.textContent = new Set(state.events.map((event) => event.date.slice(5, 7))).size;
    fillControls();
    renderHomeDirectories();
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
el.calendarMonth.addEventListener("change", () => { state.month = Number(el.calendarMonth.value); el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); });
el.previousMonth.addEventListener("click", () => { if (state.month > 0) { state.month -= 1; el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); } });
el.nextMonth.addEventListener("click", () => { if (state.month < 11) { state.month += 1; el.month.value = String(state.month + 1).padStart(2, "0"); applyFilters(); } });
window.addEventListener("resize", renderCalendar);
window.addEventListener("popstate", (event) => {
  const historyView = event.state?.view || window.location.hash.slice(1) || "home";
  switchView(panels[historyView] ? historyView : "home", false, false);
});

init();
