/* JeevanRoute frontend demo.
   This is a JavaScript simulation of the C++ logic (priority queue, DFS/BFS routing, need matching). It does not communicate
   with main.cpp automatically; run the C++ program separately for the DSA/OOP demo. */
"use strict";

const locations = [
  "Village A", "Village B", "Village C", "Village D", "Village E",
  "City Center", "Rural Area", "Main Road", "Village Road", "District Center"
];

// Undirected sample road network. Weights are illustrative distances in kilometres.
const roadEdges = [
  ["Village A", "Village B", 4], ["Village A", "Village C", 7],
  ["Village B", "Village D", 5], ["Village B", "City Center", 8],
  ["Village C", "Village E", 3], ["Village C", "Rural Area", 6],
  ["Village D", "Main Road", 4], ["Village D", "Village Road", 7],
  ["Village E", "Village Road", 5], ["City Center", "Main Road", 3],
  ["City Center", "District Center", 6], ["Rural Area", "Village Road", 4],
  ["Main Road", "District Center", 5], ["Village Road", "District Center", 4],
  ["Rural Area", "District Center", 8]
];

const graph = Object.fromEntries(locations.map(location => [location, []]));
roadEdges.forEach(([a, b, distance]) => {
  graph[a].push({ to: b, distance });
  graph[b].push({ to: a, distance });
});

let patients = [];
let emergencyQueue = [];
let dispatchHistory = [];
let hospitalNotifications = [];
let nextPatientId = 1;
let toastTimer = null;

const ambulances = [
  { id: 1, type: "basic", location: "Village A", available: true },
  { id: 2, type: "advanced", location: "Village B", available: true },
  { id: 3, type: "basic", location: "Village C", available: false },
  { id: 4, type: "advanced", location: "Village D", available: true },
  { id: 5, type: "basic", location: "Village E", available: false }
];

const hospitals = [
  { id: 1, name: "City Hospital", location: "City Center", oxygen: true, ventilator: true, icu: true, surgeon: true },
  { id: 2, name: "Rural Care Hospital", location: "Rural Area", oxygen: true, ventilator: false, icu: false, surgeon: false },
  { id: 3, name: "Emergency Care Hospital", location: "Main Road", oxygen: true, ventilator: true, icu: true, surgeon: false },
  { id: 4, name: "Community Hospital", location: "Village Road", oxygen: false, ventilator: false, icu: false, surgeon: false },
  { id: 5, name: "District Hospital", location: "District Center", oxygen: true, ventilator: false, icu: true, surgeon: true }
];

const NEED_KEYS = ["oxygen", "ventilator", "icu", "surgeon"];
const NEED_LABELS = { oxygen: "Oxygen", ventilator: "Ventilator", icu: "ICU", surgeon: "Surgeon" };
const SEVERITY = { 1: "Stable", 2: "Serious", 3: "Critical" };
const blockedRoads = new Set();
let seqCounter = 0;
let highlightRecord = null;
const roadKey = (a, b) => [a, b].sort().join("|");
const needsText = needs => NEED_KEYS.filter(k => (needs || {})[k]).map(k => NEED_LABELS[k]).join(", ") || "None";

/* ROUTING WITHOUT DIJKSTRA
   DFS (backtracking) lists every open route and we keep the cheapest in km.
   BFS finds the route with the fewest road segments. Blocked roads are skipped. */
function allRoutes(start, destination) {
  const routes = [];
  if (!graph[start] || !graph[destination]) return routes;
  const visited = new Set();
  (function dfs(node, path, km) {
    visited.add(node);
    path.push(node);
    if (node === destination) routes.push({ path: [...path], distance: km });
    else for (const edge of graph[node]) {
      if (visited.has(edge.to) || blockedRoads.has(roadKey(node, edge.to))) continue;
      dfs(edge.to, path, km + edge.distance);
    }
    path.pop();
    visited.delete(node);
  })(start, [], 0);
  return routes.sort((a, b) => a.distance - b.distance || a.path.length - b.path.length);
}

function fewestStops(start, destination) {
  const parent = { [start]: null };
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (current === destination) break;
    for (const edge of graph[current]) {
      if (edge.to in parent || blockedRoads.has(roadKey(current, edge.to))) continue;
      parent[edge.to] = current;
      queue.push(edge.to);
    }
  }
  if (!(destination in parent)) return null;
  const path = [];
  for (let node = destination; node !== null; node = parent[node]) path.unshift(node);
  return path;
}

function shortestPath(start, destination) {
  const routes = allRoutes(start, destination);
  if (!routes.length) return { distance: Infinity, path: [] };
  const fewest = fewestStops(start, destination);
  return {
    distance: routes[0].distance, path: routes[0].path, routeCount: routes.length,
    alternate: routes[1] || null,
    fewest: fewest && fewest.length < routes[0].path.length ? fewest : null
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showSection(sectionId, clickedButton) {
  document.querySelectorAll(".page-section").forEach(section => section.classList.remove("active-section"));
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.classList.add("active-section");
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.section === sectionId));
  const headings = {
    dashboard: ["Dashboard", "A clearer view of patients, ambulances and hospital readiness."],
    patients: ["Patients", "Register and manage patient records."],
    emergency: ["Emergency queue", "Report requests and process ambulance dispatches."],
    ambulances: ["Ambulances", "Monitor the fleet and ambulance availability."],
    hospitals: ["Hospitals", "Review sample facility capabilities and locations."],
    history: ["Dispatch history", "Review previous dispatch decisions."],
    notifications: ["Hospital pre-alerts", "View incoming ambulance dispatch notifications."]
  };
  document.getElementById("page-title").textContent = headings[sectionId][0];
  document.getElementById("page-subtitle").textContent = headings[sectionId][1];
}

function openRegisterPatient() {
  document.getElementById("patient-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("patient-name").focus(), 50);
}
function closeRegisterPatient() {
  document.getElementById("patient-modal").classList.add("hidden");
}
function findPatient(id) {
  return patients.find(patient => patient.id === Number(id));
}

function registerPatient(event) {
  event.preventDefault();
  const name = document.getElementById("patient-name").value.trim();
  const age = Number(document.getElementById("patient-age").value);
  const location = document.getElementById("patient-location").value;
  if (!name || !Number.isInteger(age) || age < 0 || age > 120 || !locations.includes(location)) {
    showToast("Check patient details", "Enter a valid name, age and location.", "error");
    return;
  }
  patients.push({ id: nextPatientId++, name, age, location });
  document.getElementById("patient-form").reset();
  closeRegisterPatient();
  renderAll();
  showToast("Patient registered", `${name} has been added to patient records.`);
}

function sortQueue() {
  emergencyQueue.sort((a, b) => findPatient(b).severity - findPatient(a).severity || findPatient(a).seq - findPatient(b).seq);
}

function reportEmergency(event) {
  event.preventDefault();
  const select = document.getElementById("emergency-patient");
  const patientId = Number(select.value);
  const patient = findPatient(patientId);
  if (!patient) {
    showToast("Select a patient", "Register a patient before reporting an emergency.", "error");
    return;
  }
  if (emergencyQueue.includes(patientId) || dispatchHistory.some(item => item.patientId === patientId && !item.completed)) {
    showToast("Already in queue", "This patient already has a pending or active dispatch.", "error");
    return;
  }
  patient.severity = Number(document.getElementById("emergency-severity").value);
  patient.needs = Object.fromEntries(NEED_KEYS.map(key => [key, document.getElementById("need-" + key).checked]));
  patient.seq = ++seqCounter;
  emergencyQueue.push(patientId);
  sortQueue();
  select.value = "";
  document.querySelectorAll("#emergency-form input[type=checkbox]").forEach(box => { box.checked = false; });
  renderAll();
  showToast("Emergency reported", `${patient.name} (${SEVERITY[patient.severity]}) was added to the priority queue.`);
}

// Basic ambulances cannot carry critical or ventilator patients; advanced ones can carry anyone.
function canAmbulanceHandle(ambulance, patient) {
  return ambulance.type === "advanced" || (!patient.needs.ventilator && patient.severity !== 3);
}

function chooseAmbulance(patient) {
  const free = ambulances.filter(ambulance => ambulance.available);
  const capable = free.filter(ambulance => canAmbulanceHandle(ambulance, patient));
  let best = null;
  for (const ambulance of capable) {
    const route = shortestPath(ambulance.location, patient.location);
    if (route.distance < (best?.route.distance ?? Infinity)) best = { ambulance, route };
  }
  if (best) return { best };
  return { reason: !free.length ? "All ambulances are busy. Return one to service before retrying."
    : !capable.length ? "No free ambulance can carry this patient (basic units cannot take critical or ventilator patients)."
    : "No free ambulance can reach the patient (roads blocked)." };
}

// Prefer a hospital that meets every need; otherwise the closest partial match.
function chooseHospital(patient) {
  let full = null, partial = null;
  for (const hospital of hospitals) {
    const route = shortestPath(patient.location, hospital.location);
    if (route.distance === Infinity) continue;
    const missing = NEED_KEYS.filter(key => patient.needs[key] && !hospital[key]);
    const met = NEED_KEYS.filter(key => patient.needs[key] && hospital[key]).length;
    const choice = { hospital, route, missing, met };
    if (!missing.length) { if (!full || route.distance < full.route.distance) full = choice; }
    else if (!partial || met > partial.met || (met === partial.met && route.distance < partial.route.distance)) partial = choice;
  }
  return full || partial;
}

function processEmergency() {
  if (!emergencyQueue.length) {
    showToast("Queue is empty", "Report an emergency before processing the queue.", "error");
    return;
  }
  const patient = findPatient(emergencyQueue[0]);
  if (!patient) {
    emergencyQueue.shift();
    renderAll();
    showToast("Patient not found", "The invalid queue entry was removed.", "error");
    return;
  }
  const { best: ambulanceChoice, reason } = chooseAmbulance(patient);
  if (!ambulanceChoice) {
    showToast("No ambulance available", reason, "error");
    return;
  }
  const hospitalChoice = chooseHospital(patient);
  if (!hospitalChoice) {
    showToast("No reachable hospital", "Every route to a hospital is blocked.", "error");
    return;
  }
  const missing = hospitalChoice.missing.map(key => NEED_LABELS[key]);
  if (missing.length && !window.confirm(`No hospital meets every need.\nClosest match: ${hospitalChoice.hospital.name} (missing: ${missing.join(", ")}).\nDispatch anyway?`)) return;

  emergencyQueue.shift();
  ambulanceChoice.ambulance.available = false;
  const record = {
    id: dispatchHistory.length + 1,
    patientId: patient.id,
    patientName: patient.name,
    ambulanceId: ambulanceChoice.ambulance.id,
    ambulanceBase: ambulanceChoice.ambulance.location,
    hospitalName: hospitalChoice.hospital.name,
    hospitalLocation: hospitalChoice.hospital.location,
    patientLocation: patient.location,
    ambulanceDistance: ambulanceChoice.route.distance,
    ambulancePath: ambulanceChoice.route.path,
    ambulanceRoute: ambulanceChoice.route,
    hospitalDistance: hospitalChoice.route.distance,
    hospitalPath: hospitalChoice.route.path,
    hospitalRoute: hospitalChoice.route,
    severity: patient.severity,
    needs: { ...patient.needs },
    warning: missing.join(", "),
    emergencyType: `${SEVERITY[patient.severity]} emergency`,
    preAlertSent: false,
    time: new Date().toISOString(),
    completed: false
  };
  dispatchHistory.unshift(record);
  highlightRecord = record;
  renderAll();
  renderLatestDispatch(record);
  showToast("Ambulance dispatched", `AMB-${record.ambulanceId} assigned to ${patient.name}.`);
  showSection("emergency", document.querySelector('[data-section="emergency"]'));
}

function routeLines(label, route) {
  const arrow = path => path.map(escapeHTML).join(" → ");
  return `<p class="route-path"><i class="fa-solid fa-route"></i> ${label}: ${arrow(route.path)} · ${route.distance} km (${route.routeCount} routes checked with DFS)</p>`
    + (route.alternate ? `<p class="route-path alt">Alternate route (DFS): ${arrow(route.alternate.path)} · ${route.alternate.distance} km</p>` : "")
    + (route.fewest ? `<p class="route-path alt">Fewest stops (BFS): ${arrow(route.fewest)}</p>` : "");
}

function renderLatestDispatch(record) {
  const container = document.getElementById("latest-dispatch");
  container.classList.remove("hidden");
  container.innerHTML = `
    <h3><i class="fa-solid fa-circle-check"></i> Dispatch recommendation created</h3>
    <p><strong>Patient:</strong> ${escapeHTML(record.patientName)} · ${escapeHTML(record.patientLocation)} · <span class="sev sev-${record.severity}">${SEVERITY[record.severity]}</span></p>
    <p><strong>Needs:</strong> ${needsText(record.needs)}</p>
    <p><strong>Ambulance:</strong> AMB-${record.ambulanceId} (${ambulances.find(a => a.id === record.ambulanceId).type}) from ${escapeHTML(record.ambulanceBase)} · ${record.ambulanceDistance} km to patient</p>
    ${routeLines("Ambulance route", record.ambulanceRoute)}
    <p><strong>Suggested hospital:</strong> ${escapeHTML(record.hospitalName)} · ${record.hospitalDistance} km from patient</p>
    ${record.warning ? `<p class="route-path"><i class="fa-solid fa-triangle-exclamation"></i> Hospital is missing: ${escapeHTML(record.warning)}</p>` : ""}
    ${routeLines("Hospital route", record.hospitalRoute)}
    <div class="prealert-action">
      <span class="prealert-status ${record.preAlertSent ? "sent" : ""}" id="prealert-status-${record.id}">${record.preAlertSent ? "Pre-Alert Sent" : "Hospital not notified yet"}</span>
      <button class="btn btn-primary" id="prealert-button-${record.id}" onclick="sendHospitalPreAlert(${record.id})" ${record.preAlertSent ? "disabled" : ""}><i class="fa-solid fa-bell"></i> ${record.preAlertSent ? "Pre-Alert Sent" : "Send Hospital Pre-Alert"}</button>
    </div>
  `;
}

// ---- Road map (SVG). Click a road to block or reopen it. ----
const nodePos = {
  "Village A": [70, 70], "Village B": [220, 70], "Village D": [380, 70], "Main Road": [550, 70],
  "Village C": [70, 210], "Rural Area": [230, 230], "City Center": [400, 210],
  "Village E": [70, 350], "Village Road": [260, 350], "District Center": [530, 330]
};

function toggleRoad(a, b) {
  const key = roadKey(a, b);
  const nowBlocked = !blockedRoads.has(key);
  if (nowBlocked) blockedRoads.add(key); else blockedRoads.delete(key);
  renderMap(highlightRecord);
  showToast(nowBlocked ? "Road blocked" : "Road reopened", `${a} ↔ ${b}. New dispatches will route around it.`);
}

function renderMap(record) {
  const host = document.getElementById("road-map");
  if (!host) return;
  const onPath = (path, a, b) => !!path && path.some((node, i) => i < path.length - 1 && roadKey(node, path[i + 1]) === roadKey(a, b));
  let svg = '<svg viewBox="0 0 620 420" role="img" aria-label="Road network map">';
  roadEdges.forEach(([a, b, km]) => {
    const [x1, y1] = nodePos[a], [x2, y2] = nodePos[b];
    const cls = blockedRoads.has(roadKey(a, b)) ? "blocked"
      : record && onPath(record.ambulancePath, a, b) ? "amb"
      : record && onPath(record.hospitalPath, a, b) ? "hosp" : "";
    svg += `<g class="road ${cls}" onclick="toggleRoad('${a}','${b}')"><title>${a} ↔ ${b}: ${km} km (click to block or reopen)</title>`
      + `<line class="hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="vis" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
      + `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}">${km}</text></g>`;
  });
  locations.forEach(name => {
    const [x, y] = nodePos[name];
    const hospital = hospitals.some(h => h.location === name);
    const patientHere = record && record.patientLocation === name;
    svg += `<g class="node ${hospital ? "hospital" : "village"} ${patientHere ? "patient" : ""}"><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y + 32}">${name}</text></g>`;
  });
  host.innerHTML = svg + "</svg>";
}

function sendHospitalPreAlert(dispatchId) {
  const record = dispatchHistory.find(item => item.id === dispatchId);
  if (!record) {
    showToast("Dispatch not found", "Create a dispatch before sending a pre-alert.", "error");
    return;
  }
  if (record.preAlertSent) {
    showToast("Already sent", "A pre-alert has already been created for this dispatch.", "error");
    return;
  }
  const notification = {
    id: Date.now(),
    dispatchId: record.id,
    patientName: record.patientName,
    patientLocation: record.patientLocation,
    emergencyType: record.emergencyType || "Emergency dispatch",
    ambulanceId: record.ambulanceId,
    hospitalName: record.hospitalName,
    hospitalLocation: record.hospitalLocation,
    hospitalDistance: record.hospitalDistance,
    dispatchTime: record.time,
    sentAt: new Date().toISOString(),
    acknowledged: false
  };
  record.preAlertSent = true;
  hospitalNotifications.unshift(notification);
  renderHospitalNotifications();
  renderLatestDispatch(record);
  showToast("Hospital pre-alert sent", `${record.hospitalName} has a new alert in the Hospital Alerts dashboard.`);
}

function acknowledgeHospitalAlert(notificationId) {
  const notification = hospitalNotifications.find(item => item.id === notificationId);
  if (!notification) return;
  notification.acknowledged = true;
  notification.acknowledgedAt = new Date().toISOString();
  renderHospitalNotifications();
  showToast("Alert acknowledged", `${notification.hospitalName} marked the alert as received.`);
}

function renderHospitalNotifications() {
  const container = document.getElementById("hospital-notification-list");
  const empty = document.getElementById("no-notifications");
  if (!container) return;
  container.innerHTML = "";
  if (!hospitalNotifications.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><strong>No hospital alerts yet</strong><p>Send a pre-alert after processing an emergency dispatch.</p></div>';
  }
  hospitalNotifications.forEach(alert => {
    const card = document.createElement("article");
    card.className = "panel notification-card";
    const sentTime = new Date(alert.sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    card.innerHTML = `
      <div class="notification-heading">
        <div><span class="eyebrow">INCOMING AMBULANCE · DISPATCH #${alert.dispatchId}</span><h3><i class="fa-solid fa-hospital"></i> ${escapeHTML(alert.hospitalName)}</h3><p>${escapeHTML(alert.hospitalLocation)}</p></div>
        <span class="notification-state ${alert.acknowledged ? "acknowledged" : ""}">${alert.acknowledged ? "Acknowledged" : "Awaiting acknowledgement"}</span>
      </div>
      <div class="notification-details">
        <div><small>Patient</small><strong>${escapeHTML(alert.patientName)}</strong></div>
        <div><small>Emergency</small><strong>${escapeHTML(alert.emergencyType)}</strong></div>
        <div><small>Ambulance</small><strong>AMB-${String(alert.ambulanceId).padStart(2, "0")}</strong></div>
        <div><small>Pickup location</small><strong>${escapeHTML(alert.patientLocation)}</strong></div>
        <div><small>Hospital route distance</small><strong>${alert.hospitalDistance} km</strong></div>
        <div><small>Alert sent</small><strong>${escapeHTML(sentTime)}</strong></div>
      </div>
      ${alert.acknowledged ? `<p class="ack-time"><i class="fa-solid fa-check-circle"></i> Acknowledged at ${new Date(alert.acknowledgedAt).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"})}</p>` : `<button class="btn btn-primary" onclick="acknowledgeHospitalAlert(${alert.id})"><i class="fa-solid fa-check"></i> Acknowledge receipt</button>`}
    `;
    container.appendChild(card);
  });
  const pending = hospitalNotifications.filter(item => !item.acknowledged).length;
  document.getElementById("alert-count").textContent = pending;
  document.getElementById("notification-count").textContent = `${hospitalNotifications.length} alert${hospitalNotifications.length === 1 ? "" : "s"}`;
}

function markAmbulanceAvailable(id) {
  const ambulance = ambulances.find(item => item.id === Number(id));
  if (!ambulance) return;
  ambulance.available = true;
  const activeRecord = dispatchHistory.find(record => record.ambulanceId === ambulance.id && !record.completed);
  if (activeRecord) activeRecord.completed = true;
  renderAll();
  showToast("Ambulance available", `AMB-${ambulance.id} has been returned to service.`);
}

function renderPatients() {
  const tbody = document.getElementById("patient-table");
  const empty = document.getElementById("no-patients");
  tbody.innerHTML = "";
  empty.classList.toggle("hidden", patients.length > 0);
  patients.forEach(patient => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>PT-${String(patient.id).padStart(3, "0")}</td>
      <td><div class="person-cell"><span class="avatar">${escapeHTML(patient.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHTML(patient.name)}</strong><small>Patient record</small></span></div></td>
      <td>${patient.age}</td><td>${escapeHTML(patient.location)}</td>
      <td><button class="table-action" onclick="queuePatient(${patient.id})">Report emergency</button></td>`;
    tbody.appendChild(row);
  });
  document.getElementById("patient-count-chip").textContent = `${patients.length} record${patients.length === 1 ? "" : "s"}`;
  const select = document.getElementById("emergency-patient");
  const selected = select.value;
  select.innerHTML = '<option value="">Select a registered patient</option>';
  patients.forEach(patient => {
    const option = document.createElement("option");
    option.value = patient.id;
    option.textContent = `PT-${String(patient.id).padStart(3, "0")} · ${patient.name} — ${patient.location}`;
    select.appendChild(option);
  });
  if (patients.some(patient => String(patient.id) === selected)) select.value = selected;
}

function queuePatient(id) {
  showSection("emergency", document.querySelector('[data-section="emergency"]'));
  document.getElementById("emergency-patient").value = String(id);
  document.getElementById("emergency-patient").focus();
}

function renderEmergencyQueue() {
  const container = document.getElementById("emergency-list");
  const preview = document.getElementById("dashboard-queue");
  const badge = document.getElementById("emergency-queue-badge");
  const count = emergencyQueue.length;
  badge.textContent = `${count} waiting`;
  document.getElementById("queue-panel-count").textContent = `${count} waiting`;
  document.getElementById("nav-queue-count").textContent = count;
  container.innerHTML = "";
  preview.innerHTML = "";
  if (!count) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-check-circle"></i><strong>No emergency requests</strong><p>New requests will appear here.</p></div>';
    preview.innerHTML = '<div class="empty-state compact"><i class="fa-solid fa-check-circle"></i><strong>No patients waiting</strong><p>The emergency queue is clear.</p></div>';
    return;
  }
  emergencyQueue.forEach((id, index) => {
    const patient = findPatient(id);
    if (!patient) return;
    const markup = `<div class="queue-person"><span class="avatar">${escapeHTML(patient.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHTML(patient.name)}</strong><small><span class="sev sev-${patient.severity}">${SEVERITY[patient.severity]}</span> ${escapeHTML(patient.location)} · Needs: ${needsText(patient.needs)}</small></span></div><span class="queue-position">#${index + 1} waiting</span>`;
    const item = document.createElement("div");
    item.className = "queue-item";
    item.innerHTML = markup;
    container.appendChild(item);
    if (index < 3) {
      const previewItem = document.createElement("div");
      previewItem.className = "queue-item";
      previewItem.innerHTML = markup;
      preview.appendChild(previewItem);
    }
  });
}

function renderAmbulances() {
  const container = document.getElementById("ambulance-grid");
  container.innerHTML = "";
  ambulances.forEach(ambulance => {
    const card = document.createElement("article");
    card.className = "resource-card";
    const active = dispatchHistory.find(record => record.ambulanceId === ambulance.id && !record.completed);
    card.innerHTML = `<div class="resource-top"><span class="resource-symbol"><i class="fa-solid fa-truck-medical"></i></span><span class="status-badge ${ambulance.available ? "available" : "busy"}">${ambulance.available ? "Available" : "On dispatch"}</span></div>
      <h3>AMB-${String(ambulance.id).padStart(2, "0")}</h3><p class="resource-sub">${ambulance.type === "advanced" ? "Advanced life support (ventilator)" : "Basic life support"}</p>
      <div class="resource-meta"><div class="meta-row"><span>Base location</span><strong>${escapeHTML(ambulance.location)}</strong></div><div class="meta-row"><span>Status</span><strong>${ambulance.available ? "Ready for assignment" : "Currently busy"}</strong></div>${active ? `<div class="meta-row"><span>Assigned patient</span><strong>${escapeHTML(active.patientName)}</strong></div>` : ""}</div>
      ${ambulance.available ? "" : `<button class="resource-action" onclick="markAmbulanceAvailable(${ambulance.id})"><i class="fa-solid fa-rotate-left"></i> Mark available</button>`}`;
    container.appendChild(card);
  });
  const available = ambulances.filter(item => item.available).length;
  document.getElementById("available-ambulances").textContent = available;
  document.getElementById("ambulance-summary").textContent = `${available} available · ${ambulances.length - available} busy`;
}

function renderHospitals() {
  const container = document.getElementById("hospital-grid");
  container.innerHTML = "";
  hospitals.forEach(hospital => {
    const card = document.createElement("article");
    card.className = "resource-card";
    const suitable = NEED_KEYS.every(key => hospital[key]);
    card.innerHTML = `<div class="resource-top"><span class="resource-symbol"><i class="fa-solid fa-hospital"></i></span><span class="status-badge ${suitable ? "suitable" : "limited"}">${suitable ? "All services" : "Limited capability"}</span></div>
      <h3>${escapeHTML(hospital.name)}</h3><p class="resource-sub">Facility ID · H-${String(hospital.id).padStart(2, "0")}</p>
      <div class="resource-meta"><div class="meta-row"><span>Location</span><strong>${escapeHTML(hospital.location)}</strong></div></div>
      <div class="capability-list"><span class="capability ${hospital.icu ? "" : "off"}"><i class="fa-solid fa-${hospital.icu ? "check" : "xmark"}"></i> ICU ${hospital.icu ? "listed" : "not listed"}</span><span class="capability ${hospital.oxygen ? "" : "off"}"><i class="fa-solid fa-${hospital.oxygen ? "check" : "xmark"}"></i> Oxygen ${hospital.oxygen ? "listed" : "not listed"}</span>${["ventilator", "surgeon"].map(key => `<span class="capability ${hospital[key] ? "" : "off"}"><i class="fa-solid fa-${hospital[key] ? "check" : "xmark"}"></i> ${NEED_LABELS[key]} ${hospital[key] ? "listed" : "not listed"}</span>`).join("")}</div>`;
    container.appendChild(card);
  });
}

function renderHistory() {
  const tbody = document.getElementById("history-table");
  const empty = document.getElementById("no-history");
  tbody.innerHTML = "";
  empty.classList.toggle("hidden", dispatchHistory.length > 0);
  dispatchHistory.forEach(record => {
    const row = document.createElement("tr");
    const date = new Date(record.time).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    row.innerHTML = `<td>${date}${record.completed ? '<br><span class="resource-sub">Returned to service</span>' : ""}</td><td><div class="person-cell"><span class="avatar">${escapeHTML(record.patientName.charAt(0).toUpperCase())}</span><span><strong>${escapeHTML(record.patientName)}</strong><small>${escapeHTML(record.patientLocation)}</small></span></div></td><td>AMB-${String(record.ambulanceId).padStart(2, "0")}</td><td>${escapeHTML(record.hospitalName)}</td><td>${record.ambulanceDistance} km to patient · ${record.hospitalDistance} km to hospital</td>`;
    tbody.appendChild(row);
  });
}

function updateDashboard() {
  document.getElementById("total-patients").textContent = patients.length;
  document.getElementById("queue-count").textContent = emergencyQueue.length;
  document.getElementById("total-hospitals").textContent = hospitals.length;
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function renderAll() {
  renderPatients();
  renderEmergencyQueue();
  renderAmbulances();
  renderHospitals();
  renderHistory();
  renderHospitalNotifications();
  renderMap(highlightRecord);
  updateDashboard();
}

function showToast(title, message, type = "success") {
  const toast = document.getElementById("toast");
  document.getElementById("toast-title").textContent = title;
  document.getElementById("toast-message").textContent = message;
  const icon = document.getElementById("toast-icon");
  icon.className = type === "error" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-check";
  toast.classList.toggle("error", type === "error");
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}
function hideToast() {
  document.getElementById("toast").classList.remove("show");
}
function clearHistory() {
  if (!dispatchHistory.length) {
    showToast("Nothing to clear", "Dispatch history is already empty.", "error");
    return;
  }
  if (!window.confirm("Clear all dispatch history? This cannot be undone.")) return;
  dispatchHistory = [];
  highlightRecord = null;
  renderAll();
  document.getElementById("latest-dispatch").classList.add("hidden");
  showToast("History cleared", "Dispatch history has been cleared.");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("patient-form").addEventListener("submit", registerPatient);
  document.getElementById("emergency-form").addEventListener("submit", reportEmergency);
  document.getElementById("patient-modal").addEventListener("click", event => {
    if (event.target.id === "patient-modal") closeRegisterPatient();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeRegisterPatient();
  });
  renderAll();
});
