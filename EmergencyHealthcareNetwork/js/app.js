

const NAV_ITEMS = [
  { label: "Home", href: "index.html", pages: ["home"] },
  { label: "Hospital", services: ["hospital", "bed", "ambulance"], menu: [
      { label: "Hospital", href: "search.html?service=hospital" },
      { label: "ICU / CCU Bed", href: "search.html?service=bed" },
      { label: "Ambulance", href: "search.html?service=ambulance" }
  ] },
  { label: "Blood", href: "blood.html", pages: ["blood"] },
  { label: "Map", href: "locator.html", pages: ["locator"] },
  { label: "More", pages: ["about"], services: ["diagnostic", "doctor"], menu: [
      { label: "Diagnostic Service", href: "search.html?service=diagnostic" },
      { label: "Doctor / Specialist", href: "search.html?service=doctor" },
      { label: "About & Contacts", href: "about.html" }
  ] }
];

function isNavActive(item) {
  const page = document.body.dataset.page;
  if (item.pages && item.pages.includes(page)) return true;
  const service = getQueryParams().service;
  return (page === "search" || page === "results") && Boolean(item.services) && item.services.includes(service);
}

function navItemHtml(item) {
  const active = isNavActive(item);
  if (item.menu) {
    const links = item.menu.map(function (m) {
      return '<li><a class="dropdown-item" href="' + m.href + '">' + m.label + "</a></li>";
    }).join("");
    return '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle' + (active ? " active" : "") + '" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">' + item.label + "</a>" +
           '<ul class="dropdown-menu">' + links + "</ul></li>";
  }
  return '<li class="nav-item"><a class="nav-link' + (active ? " active" : "") + '"' + (active ? ' aria-current="page"' : "") + ' href="' + item.href + '">' + item.label + "</a></li>";
}

function renderLayout() {
  document.getElementById("site-nav").innerHTML =
   
    '<div class="app-nav">' +
      
      '<div class="container topbar">' +
        '<a class="brand" href="index.html"><i class="bi bi-heart-pulse-fill" aria-hidden="true"></i> <span><i>MediReach : Emergency Healthcare Network</i></span></a>' +
        '<form class="nav-search" id="navSearch" role="search" novalidate>' +
          '<label class="visually-hidden" for="navSearchInput">Search hospitals, blood, doctors...</label>' +
          '<input class="form-control" id="navSearchInput" type="search" placeholder="Search: ICU, ambulance, B+, cardiology..." autocomplete="off">' +
          '<button class="btn btn-light" type="submit"><i class="bi bi-search" aria-hidden="true"></i><span class="visually-hidden">Search</span></button>' +
        "</form>" +
        '<a class="btn btn-danger btn-call" href="tel:999"><i class="bi bi-telephone-fill" aria-hidden="true"></i> <span>Call 999</span></a>' +
      "</div>" +
   
      '<nav class="navbar navbar-expand-lg navbar-dark py-0" aria-label="Main navigation">' +
        '<div class="container">' +
          '<button class="navbar-toggler my-1" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle menu">' +
            '<span class="navbar-toggler-icon"></span> <span class="ms-1">Menu</span></button>' +
          '<div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav">' + NAV_ITEMS.map(navItemHtml).join("") + "</ul></div>" +
        "</div>" +
      "</nav>" +
    "</div>";

  document.getElementById("site-footer").innerHTML =
    '<div class="container py-3 small text-secondary"> It is not real data .We just use some manual data to show our project . </div>';

 
  document.body.insertAdjacentHTML("beforeend",
    '<div class="modal fade" id="detailsModal" tabindex="-1" aria-labelledby="detailsModalTitle" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"><div class="modal-content">' +
        '<div class="modal-header"><h2 class="modal-title h5" id="detailsModalTitle"></h2>' +
          '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
        '<div class="modal-body" id="detailsModalBody"></div>' +
        '<div class="modal-footer" id="detailsModalFooter"></div>' +
      "</div></div></div>");

  initNavSearch();
}

function initNavSearch() {
  const form = document.getElementById("navSearch");
  const input = document.getElementById("navSearchInput");

  const params = getQueryParams();
  if (document.body.dataset.page === "results" && params.service === "all" && params.q) input.value = params.q;

  input.addEventListener("input", function () { input.classList.remove("is-invalid"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (text.length < 2) {
      
      input.classList.add("is-invalid");
      input.value = "";
      input.placeholder = "Type at least 2 letters";
      input.focus();
      return;
    }
    const query = new URLSearchParams({ service: "all", q: text });
    const loc = getActiveLocation();
    if (loc) { query.set("lat", loc.lat); query.set("lng", loc.lng); query.set("loc", loc.label); }
    window.location.href = "results.html?" + query.toString();
  });
}

function openDetails(result, userLoc) {
  document.getElementById("detailsModalTitle").textContent = result.item.name;
  document.getElementById("detailsModalBody").innerHTML = buildDetailsHtml(result);
  document.getElementById("detailsModalFooter").innerHTML =
    '<a class="btn btn-danger" href="tel:' + escapeHtml(result.item.phone.replace(/[^0-9+]/g, "")) + '"><i class="bi bi-telephone-fill" aria-hidden="true"></i> Call ' + escapeHtml(result.item.phone) + "</a>" +
    '<a class="btn btn-outline-primary" target="_blank" rel="noopener" href="' + directionsUrl(result.item, userLoc) + '"><i class="bi bi-sign-turn-right" aria-hidden="true"></i> Get Directions</a>' +
    '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
  bootstrap.Modal.getOrCreateInstance(document.getElementById("detailsModal")).show();
}


function showLocationMessage(message, kind) {
  const box = document.getElementById("locationStatus");
  if (!box) return;
  box.textContent = message;
  box.className = "location-status mt-2 " + (kind === "error" ? "text-danger" : kind === "success" ? "text-success" : "text-secondary");
}

function renderLocationWidget(containerId, onChange, options) {
  const stacked = Boolean(options && options.stacked);
  const colBtn = stacked ? "col-12" : "col-12 col-md-auto";
  const colInput = stacked ? "col-12" : "col-12 col-md";
  const areaOptions = AREAS.map(function (a) { return '<option value="' + escapeHtml(a.name) + '"></option>'; }).join("");

  document.getElementById(containerId).innerHTML =
    '<div class="location-widget">' +
      '<div class="row g-2 align-items-center">' +
        '<div class="' + colBtn + '"><button type="button" class="btn btn-danger w-100" id="btnUseLocation"><i class="bi bi-crosshair" aria-hidden="true"></i> Use my location</button></div>' +
        '<div class="' + colInput + '"><div class="input-group">' +
          '<label class="visually-hidden" for="areaInput">Or type your area</label>' +
          '<input type="text" class="form-control" id="areaInput" list="areaList" placeholder="Type your area " autocomplete="off">' +
          '<button type="button" class="btn btn-dark" id="btnSetArea">Set</button>' +
        "</div></div>" +
      "</div>" +
      '<datalist id="areaList">' + areaOptions + "</datalist>" +
      '<div id="locationStatus" class="location-status mt-2" role="status" aria-live="polite"></div>' +
    "</div>";

  const saved = getActiveLocation();
  if (saved) showLocationMessage("Location set: " + saved.label, "success");
  else showLocationMessage("Set your location to see distances.", "info");

  document.getElementById("btnUseLocation").addEventListener("click", async function () {
    const btn = this;
    btn.disabled = true;
    showLocationMessage("Getting your location...", "info");
    try {
      const pos = await getUserLocation();
      saveLocation({ lat: pos.lat, lng: pos.lng, label: "Your current location", source: "gps" });
      showLocationMessage("Location set: your current location", "success");
      if (onChange) onChange();
    } catch (err) {
      
      if (err && err.code === 1) {
        showLocationMessage("Location access was denied. You can continue by selecting a location manually.", "error");
      } else {
        showLocationMessage("We could not get your location. Please type an area instead.", "error");
      }
    }
    btn.disabled = false;
  });


  function setAreaFromInput() {
    const typed = document.getElementById("areaInput").value.trim().toLowerCase();
    if (typed === "") {
      showLocationMessage("Please type an area name first.", "error");
      return;
    }
    const area = AREAS.find(function (a) { return a.name.toLowerCase().includes(typed); });
    if (!area) {
      
      showLocationMessage('We could not find "' + document.getElementById("areaInput").value.trim() + '". Please choose one of the suggested areas.', "error");
      return;
    }
    saveLocation({ lat: area.lat, lng: area.lng, label: area.name, source: "area" });
    document.getElementById("areaInput").value = area.name;
    showLocationMessage("Location set: " + area.name, "success");
    if (onChange) onChange();
  }
  document.getElementById("btnSetArea").addEventListener("click", setAreaFromInput);
  document.getElementById("areaInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); setAreaFromInput(); }
  });
}

document.addEventListener("DOMContentLoaded", renderLayout);
