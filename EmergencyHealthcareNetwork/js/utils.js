
const SERVICES = {

  hospital:   { label: "Hospital",            icon: "bi-hospital",       file: "hospitals.json",   group: "hospital", hint: "Find the nearest emergency hospital." },
  bed:        { label: "ICU / CCU Bed",       icon: "bi-hospital-fill",  file: "hospitals.json",   group: "hospital", hint: "Find hospitals with a free ICU or CCU bed." },
  ambulance:  { label: "Ambulance",           icon: "bi-truck-front",    file: "ambulances.json",  group: "hospital", hint: "Find an ambulance that can be sent now." },
  blood:      { label: "Blood",               icon: "bi-droplet-fill",   file: "blood-banks.json", hint: "Find blood banks that hold your blood group." },
  diagnostic: { label: "Diagnostic Service",  icon: "bi-activity",       file: "diagnostics.json", hint: "Find X-ray, CT, MRI, ECG or lab services." },
  doctor:     { label: "Doctor / Specialist", icon: "bi-person-badge",   file: "doctors.json",     hint: "Find a specialist who is available today." }
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];


const OPTIONS = {
  bedType: [["icu", "ICU"], ["ccu", "CCU"], ["any", "Any (ICU or CCU)"]],
  ambulanceType: [["any", "Any type"], ["basic", "Basic life support"], ["icu", "ICU ambulance"], ["freezer", "Freezer / mortuary van"]],
  department: [["any", "Any department"], ["cardiology", "Cardiology (heart)"], ["trauma", "Trauma / accident"], ["neurology", "Neurology"], ["pediatrics", "Pediatrics (children)"], ["burn", "Burn unit"], ["maternity", "Maternity"]],
  specialty: [["cardiology", "Cardiologist"], ["neurology", "Neurologist"], ["pediatrics", "Pediatrician"], ["orthopedics", "Orthopedic surgeon"], ["gynecology", "Gynecologist"], ["medicine", "Medicine specialist"]],
  testType: [["any", "Any test"], ["xray", "X-ray"], ["ct-scan", "CT scan"], ["mri", "MRI"], ["ultrasound", "Ultrasound"], ["ecg", "ECG"], ["pathology", "Pathology / lab tests"]]
};

const AREAS = [
  { name: "Dhanmondi",    lat: 23.7461, lng: 90.3742 },
  { name: "Mirpur",       lat: 23.8069, lng: 90.3687 },
  { name: "Uttara",       lat: 23.8759, lng: 90.3795 },
  { name: "Gulshan",      lat: 23.7925, lng: 90.4078 },
  { name: "Banani",       lat: 23.7937, lng: 90.4066 },
  { name: "Motijheel",    lat: 23.7330, lng: 90.4172 },
  { name: "Mohammadpur",  lat: 23.7662, lng: 90.3589 },
  { name: "Farmgate",     lat: 23.7561, lng: 90.3872 },
  { name: "Bashundhara",  lat: 23.8193, lng: 90.4526 },
  { name: "Old Dhaka (Sadarghat)", lat: 23.7104, lng: 90.4074 }
];


const DEFAULT_LOCATION = { lat: 23.7561, lng: 90.3872, label: "Dhaka centre (default)", source: "default" };

const STATUS_INFO = {
  available:   { label: "Available",   cls: "status-available",   icon: "bi-check-circle-fill" },
  limited:     { label: "Limited",     cls: "status-limited",     icon: "bi-exclamation-triangle-fill" },
  unavailable: { label: "Unavailable", cls: "status-unavailable", icon: "bi-x-circle-fill" }
};
const STATUS_ORDER = { available: 0, limited: 1, unavailable: 2 };


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

function optionLabel(listName, value) {
  const found = (OPTIONS[listName] || []).find(function (pair) { return pair[0] === value; });
  return found ? found[1] : value;
}

function formatUpdated(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return "unknown";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}


async function loadServiceData(fileName) {
  const response = await fetch("data/" + fileName);
  if (!response.ok) {
    throw new Error("HTTP " + response.status + " while loading " + fileName);
  }
  return await response.json();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const toRad = function (deg) { return deg * Math.PI / 180; };
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return Math.round(km * 1000 / 10) * 10 + " m away";
  return km.toFixed(1) + " km away";
}


function getUserLocation() {
  return new Promise(function (resolve, reject) {
    if (!("geolocation" in navigator)) {
      reject({ code: 0, message: "Geolocation not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (position) {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      function (error) { reject(error); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function isValidLocation(loc) {
  return loc && isFinite(loc.lat) && isFinite(loc.lng) &&
         Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180;
}

function saveLocation(loc) {
  try { sessionStorage.setItem("ehan_location", JSON.stringify(loc)); } catch (e) {  }
}

function getActiveLocation() {
  try {
    const loc = JSON.parse(sessionStorage.getItem("ehan_location"));
    return isValidLocation(loc) ? loc : null;
  } catch (e) {
    return null;
  }
}


function statusFromCount(count, needed) {
  if (count >= needed && count > 0) return "available";
  if (count > 0) return "limited";
  return "unavailable";
}

function evaluateAvailability(item, key, criteria) {
  const needed = Number(criteria.quantity) || 1;

  switch (key) {
    case "bed": {
      const icu = item.beds.icu.available;
      const ccu = item.beds.ccu.available;
      let count = icu + ccu;
      let label = "ICU/CCU";
      if (criteria.bedType === "icu") { count = icu; label = "ICU"; }
      if (criteria.bedType === "ccu") { count = ccu; label = "CCU"; }
      return { status: statusFromCount(count, needed), text: count + " " + label + " bed(s) free" };
    }
    case "hospital": {
      if (criteria.department && criteria.department !== "any" &&
          !item.departments.includes(criteria.department)) return null;
      return { status: item.availability, text: item.emergency24h ? "24/7 emergency unit" : "Emergency unit: limited hours" };
    }
    case "ambulance": {
      if (criteria.ambulanceType && criteria.ambulanceType !== "any" &&
          item.ambulanceType !== criteria.ambulanceType) return null;
      return { status: item.availability, text: optionLabel("ambulanceType", item.ambulanceType) + " - " + item.operator };
    }
    case "blood": {
      if (!criteria.bloodGroup) {
        
        const total = BLOOD_GROUPS.reduce(function (sum, g) { return sum + item.stock[g]; }, 0);
        return { status: total >= 40 ? "available" : total > 0 ? "limited" : "unavailable", text: total + " units in stock (all groups)" };
      }
      const units = item.stock[criteria.bloodGroup] || 0;
      const text = units + " unit(s) of " + criteria.bloodGroup + (units > 0 && units < needed ? " (you need " + needed + ")" : "");
      return { status: statusFromCount(units, needed), text: text };
    }
    case "doctor": {
      if (criteria.specialty && item.specialty !== criteria.specialty) return null;
      return { status: item.availability, text: item.availabilityNote };
    }
    case "diagnostic": {
      if (criteria.testType && criteria.testType !== "any" &&
          !item.tests.includes(criteria.testType)) return null;
      return { status: item.availability, text: "Open: " + item.openHours };
    }
    default:
      return null;
  }
}

function buildResults(data, key, criteria, userLoc) {
  const results = [];
  data.forEach(function (item) {
    const avail = evaluateAvailability(item, key, criteria);
    if (avail === null) return; 
    const distance = calculateDistance(userLoc.lat, userLoc.lng, item.latitude, item.longitude);
    results.push({ item: item, avail: avail, distance: distance, key: key });
  });
  return results;
}


function searchableText(item, key) {
  const parts = [item.name, item.address, SERVICES[key].label, item.type];
  if (key === "hospital") parts.push("icu ccu bed emergency", item.departments.map(function (d) { return optionLabel("department", d); }).join(" "));
  if (key === "ambulance") parts.push(optionLabel("ambulanceType", item.ambulanceType), item.operator, item.serviceArea);
  if (key === "blood") parts.push("blood bank", BLOOD_GROUPS.join(" "));
  if (key === "doctor") parts.push(optionLabel("specialty", item.specialty), item.specialty, item.hospital, item.degrees);
  if (key === "diagnostic") parts.push(item.tests.map(function (t) { return optionLabel("testType", t) + " " + t; }).join(" "));
  return parts.join(" ").toLowerCase();
}

function matchesQuery(item, key, query) {
  const text = searchableText(item, key);
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(function (word) { return text.includes(word); });
}



function statusBadge(status) {
  const s = STATUS_INFO[status] || STATUS_INFO.unavailable;
  return '<span class="status-badge ' + s.cls + '"><i class="bi ' + s.icon + '" aria-hidden="true"></i> ' + s.label + "</span>";
}

function directionsUrl(item, userLoc) {
  let url = "https://www.google.com/maps/dir/?api=1&destination=" + item.latitude + "," + item.longitude;
  if (userLoc && userLoc.source !== "default") url += "&origin=" + userLoc.lat + "," + userLoc.lng;
  return url;
}

function cardExtras(item, key) {
  const line = function (icon, text) { return '<li><i class="bi ' + icon + '" aria-hidden="true"></i> ' + escapeHtml(text) + "</li>"; };
  switch (key) {
    case "bed":
      return [line("bi-grid-3x2-gap", "ICU " + item.beds.icu.available + "/" + item.beds.icu.total + " free  |  CCU " + item.beds.ccu.available + "/" + item.beds.ccu.total + " free")];
    case "hospital":
      return [line("bi-clipboard2-pulse", "Departments: " + item.departments.map(function (d) { return optionLabel("department", d); }).join(", "))];
    case "ambulance":
      return [line("bi-signpost-split", "Service area: " + item.serviceArea)];
    case "doctor":
      return [line("bi-hospital", item.hospital), line("bi-cash", "Fee: BDT " + item.fee)];
    case "diagnostic":
      return [line("bi-list-check", item.tests.map(function (t) { return optionLabel("testType", t); }).join(", "))];
    default:
      return [];
  }
}

function renderResultCard(r, userLoc, opts) {
  const item = r.item;
  const service = SERVICES[r.key];
  const locateBtn = opts && opts.locate
    ? '<button type="button" class="btn btn-outline-secondary btn-sm btn-locate" data-id="' + escapeHtml(item.id) + '" data-key="' + r.key + '"><i class="bi bi-pin-map" aria-hidden="true"></i> Show on map</button>'
    : "";
  return '' +
    '<article class="card result-card border-' + r.avail.status + (r.avail.status === "unavailable" ? " is-unavailable" : "") + ' h-100">' +
      '<div class="card-body">' +
        '<div class="d-flex justify-content-between align-items-start gap-2 mb-2">' +
          '<div>' +
            '<span class="type-tag"><i class="bi ' + service.icon + '" aria-hidden="true"></i> ' + service.label + "</span>" +
            '<h3 class="h5 card-title mt-1 mb-0">' + escapeHtml(item.name) + "</h3>" +
          "</div>" +
          statusBadge(r.avail.status) +
        "</div>" +
        '<p class="avail-line">' + escapeHtml(r.avail.text) + "</p>" +
        '<ul class="meta-list">' +
          '<li class="distance"><i class="bi bi-signpost-2" aria-hidden="true"></i> <strong>' + formatDistance(r.distance) + "</strong></li>" +
          '<li><i class="bi bi-geo-alt" aria-hidden="true"></i> ' + escapeHtml(item.address) + "</li>" +
          '<li><i class="bi bi-telephone" aria-hidden="true"></i> ' + escapeHtml(item.phone) + "</li>" +
          cardExtras(item, r.key).join("") +
        "</ul>" +
      "</div>" +
      '<div class="card-footer bg-transparent d-flex flex-wrap gap-2">' +
        '<button type="button" class="btn btn-dark btn-sm btn-details" data-id="' + escapeHtml(item.id) + '" data-key="' + r.key + '">View Details</button>' +
        '<a class="btn btn-danger btn-sm" href="tel:' + escapeHtml(item.phone.replace(/[^0-9+]/g, "")) + '"><i class="bi bi-telephone-fill" aria-hidden="true"></i> Call</a>' +
        '<a class="btn btn-outline-primary btn-sm" target="_blank" rel="noopener" href="' + directionsUrl(item, userLoc) + '"><i class="bi bi-sign-turn-right" aria-hidden="true"></i> Directions</a>' +
        locateBtn +
      "</div>" +
    "</article>";
}

function detailRow(label, valueHtml) {
  return '<dt class="col-sm-4">' + label + '</dt><dd class="col-sm-8">' + valueHtml + "</dd>";
}

function buildDetailsHtml(r) {
  const item = r.item;
  let rows = detailRow("Status", statusBadge(r.avail.status) + " " + escapeHtml(r.avail.text)) +
             detailRow("Distance", formatDistance(r.distance)) +
             detailRow("Address", escapeHtml(item.address)) +
             detailRow("Phone", escapeHtml(item.phone));

  switch (r.key) {
    case "bed":
    case "hospital":
      rows += detailRow("ICU beds", item.beds.icu.available + " free of " + item.beds.icu.total) +
              detailRow("CCU beds", item.beds.ccu.available + " free of " + item.beds.ccu.total) +
              detailRow("Emergency unit", item.emergency24h ? "Open 24/7" : "Limited hours") +
              detailRow("Departments", escapeHtml(item.departments.map(function (d) { return optionLabel("department", d); }).join(", ")));
      break;
    case "ambulance":
      rows += detailRow("Type", escapeHtml(optionLabel("ambulanceType", item.ambulanceType))) +
              detailRow("Operator", escapeHtml(item.operator)) +
              detailRow("Vehicle no.", escapeHtml(item.vehicleNo)) +
              detailRow("Service area", escapeHtml(item.serviceArea));
      break;
    case "blood": {
      const stockList = BLOOD_GROUPS.map(function (g) {
        return "<li>" + g + ": <strong>" + item.stock[g] + "</strong></li>";
      }).join("");
      rows += detailRow("Open hours", escapeHtml(item.openHours)) +
              detailRow("Stock (units)", '<ul class="list-inline mb-0 stock-list">' + stockList + "</ul>");
      break;
    }
    case "doctor":
      rows += detailRow("Specialty", escapeHtml(optionLabel("specialty", item.specialty))) +
              detailRow("Degrees", escapeHtml(item.degrees)) +
              detailRow("Hospital", escapeHtml(item.hospital)) +
              detailRow("Consultation fee", "BDT " + item.fee);
      break;
    case "diagnostic":
      rows += detailRow("Open hours", escapeHtml(item.openHours)) +
              detailRow("Tests", escapeHtml(item.tests.map(function (t) { return optionLabel("testType", t); }).join(", ")));
      break;
  }

  rows += detailRow("Demo update", escapeHtml(formatUpdated(item.lastUpdated)));
  return '<dl class="row mb-3">' + rows + "</dl>" +
         '<p class="small text-muted mb-0"><i class="bi bi-info-circle" aria-hidden="true"></i> Demo data with simulated availability. Always call to confirm before travelling.</p>';
}
