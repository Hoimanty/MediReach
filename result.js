
let allResults = [];     
let shownResults = [];    
let serviceKey = "";      
let criteria = {};        
let userLoc = null;
let resultsMap = null;
let pins = {};


const ALL_SEARCH_SOURCES = [
  { key: "hospital",   criteria: { department: "any" } },
  { key: "ambulance",  criteria: { ambulanceType: "any" } },
  { key: "blood",      criteria: {} },
  { key: "diagnostic", criteria: { testType: "any" } },
  { key: "doctor",     criteria: {} }
];


function showLoading() {
  document.getElementById("resultsArea").innerHTML =
    '<div class="state-box" role="status"><div class="spinner-border text-danger mb-3" aria-hidden="true"></div>' +
    '<p class="mb-0">Finding available emergency services...</p></div>';
}

function showProblem(title, text, buttonHtml) {
  document.getElementById("resultsArea").innerHTML =
    '<div class="state-box"><i class="bi bi-exclamation-octagon fs-1 text-danger" aria-hidden="true"></i>' +
    '<h2 class="h5 mt-2">' + title + "</h2><p>" + text + "</p>" + (buttonHtml || "") + "</div>";
}


function describeSearch() {
  if (serviceKey === "all") return 'Searching everything for "' + criteria.q + '" near ' + userLoc.label;
  const parts = [SERVICES[serviceKey].label];
  if (criteria.bedType) parts.push(optionLabel("bedType", criteria.bedType));
  if (criteria.bloodGroup) parts.push(criteria.bloodGroup);
  if (criteria.quantity) parts.push(criteria.quantity + (serviceKey === "blood" ? " unit(s)" : " bed(s)"));
  if (criteria.ambulanceType) parts.push(optionLabel("ambulanceType", criteria.ambulanceType));
  if (criteria.department) parts.push(optionLabel("department", criteria.department));
  if (criteria.specialty) parts.push(optionLabel("specialty", criteria.specialty));
  if (criteria.testType) parts.push(optionLabel("testType", criteria.testType));
  return parts.join(" - ") + " near " + userLoc.label;
}


function filterResults(list) {
  const nameText = document.getElementById("nameSearch").value.trim().toLowerCase();
  const maxKm = Number(document.getElementById("maxDistance").value);
  const hideUnavailable = document.getElementById("onlyAvailable").checked;

  return list.filter(function (r) {
    if (nameText !== "" && !r.item.name.toLowerCase().includes(nameText)) return false;
    if (maxKm > 0 && r.distance > maxKm) return false;
    if (hideUnavailable && r.avail.status === "unavailable") return false;
    return true;
  });
}


function sortResults(list, mode) {
  const sorted = list.slice(); // copy so the original order is untouched
  sorted.sort(function (a, b) {
    if (mode === "nearest") return a.distance - b.distance;
    if (mode === "farthest") return b.distance - a.distance;
    const byStatus = STATUS_ORDER[a.avail.status] - STATUS_ORDER[b.avail.status];
    return byStatus !== 0 ? byStatus : a.distance - b.distance;
  });
  return sorted;
}


function renderResults(list) {
  const area = document.getElementById("resultsArea");
  document.getElementById("resultCount").textContent =
    "Showing " + list.length + " of " + allResults.length + " matching result(s).";

  pins = drawMarkers(resultsMap, list, userLoc, function (r) { openDetails(r, userLoc); });

  if (list.length === 0) {
    const message = serviceKey === "all" && allResults.length === 0
      ? '<h2 class="h5 mt-2">Nothing matched "' + escapeHtml(criteria.q) + '".</h2><p>Try another word, like ICU, ambulance, B+, insulin or cardiology.</p>'
      : '<h2 class="h5 mt-2">No available services found nearby.</h2><p>Try expanding your search area.</p>';
    area.innerHTML = '<div class="state-box"><i class="bi bi-search fs-1 text-secondary" aria-hidden="true"></i>' + message +
      '<button type="button" class="btn btn-dark" id="btnClearFilters">Clear filters</button></div>';
    return;
  }
  area.innerHTML = '<div class="d-grid gap-3">' + list.map(function (r) {
    return renderResultCard(r, userLoc, { locate: true });
  }).join("") + "</div>";
}


function refreshResults() {
  const filtered = filterResults(allResults);
  shownResults = sortResults(filtered, document.getElementById("sortSelect").value);
  renderResults(shownResults);
}

function clearFilters() {
  document.getElementById("nameSearch").value = "";
  document.getElementById("maxDistance").value = "0";
  document.getElementById("onlyAvailable").checked = false;
  document.getElementById("sortSelect").value = "smart";
  refreshResults();
}


function evaluateForSearchAll(item, source, query) {
  if (source.key === "blood") {
    const group = BLOOD_GROUPS.find(function (g) { return g.toLowerCase() === query; });
    return evaluateAvailability(item, "blood", group ? { bloodGroup: group, quantity: 1 } : {});
  }
  return evaluateAvailability(item, source.key, source.criteria);
}

async function loadAllResults(query) {
  const lists = await Promise.all(ALL_SEARCH_SOURCES.map(function (s) { return loadServiceData(SERVICES[s.key].file); }));
  const results = [];
  ALL_SEARCH_SOURCES.forEach(function (source, i) {
    lists[i].forEach(function (item) {rttttgtt
      if (!matchesQuery(item, source.key, query)) return;
      const avail = evaluateForSearchAll(item, source, query.toLowerCase());
      if (avail === null) return;
      results.push({ item: item, avail: avail, key: source.key,
                     distance: calculateDistance(userLoc.lat, userLoc.lng, item.latitude, item.longitude) });
    });
  });
  return results;
}

async function initResults() {
  const params = getQueryParams();
  serviceKey = params.service;
  criteria = params;
  const isAll = serviceKey === "all";

  if (!isAll && !SERVICES[serviceKey]) {
    showProblem("We do not know that service.", "Please start a new search.", '<a class="btn btn-danger" href="search.html">Start a search</a>');
    return;
  }
  if (isAll && (!params.q || params.q.trim().length < 2)) {
    showProblem("Please type at least 2 letters in the search box.", "For example: ICU, ambulance, B+, insulin.", "");
    return;
  }

 
  const fromUrl = { lat: parseFloat(params.lat), lng: parseFloat(params.lng), label: params.loc || "your location", source: "url" };
  userLoc = isValidLocation(fromUrl) ? fromUrl : getActiveLocation();
  
  if (isValidLocation(fromUrl) && !getActiveLocation()) saveLocation(fromUrl);

  if (!userLoc && isAll) {
    userLoc = DEFAULT_LOCATION; 
  if (!userLoc) {
    showProblem("Your location is missing or invalid.", "We need it to find the nearest services.", '<a class="btn btn-danger" href="search.html?service=' + serviceKey + '">Set location</a>');
    return;
  }

  document.getElementById("resultsTitle").textContent = isAll ? "Search results" : SERVICES[serviceKey].label + " results";
  document.getElementById("resultsSummary").textContent = describeSearch() + (userLoc.source === "default" ? " (default location - set yours on the Home page)" : "");
  document.getElementById("modifySearch").href = isAll ? "index.html" : "search.html?" + new URLSearchParams(params).toString();
  if (isAll) document.getElementById("modifySearch").innerHTML = '<i class="bi bi-house" aria-hidden="true"></i> Home';

  if (resultsMap) { resultsMap.setCenter({ lat: userLoc.lat, lng: userLoc.lng }); resultsMap.setZoom(12); }

  showLoading();
  try {
    if (isAll) {
      allResults = await loadAllResults(params.q.trim());
    } else {
      const data = await loadServiceData(SERVICES[serviceKey].file);   // fetch + JSON
      allResults = buildResults(data, serviceKey, criteria, userLoc);   // match + distance
    }
    refreshResults();                                                   // filter + sort + render
  } catch (error) {
    console.error(error);
    showProblem("Unable to load service data.", "Please try again. (If you opened the file directly, run it with a local web server - see README.)",
                '<button type="button" class="btn btn-danger" id="btnRetry">Try again</button>');
  }
}

document.addEventListener("DOMContentLoaded", function () {
  resultsMap = createMap("map", getActiveLocation() || DEFAULT_LOCATION);

  ["nameSearch", "maxDistance", "onlyAvailable", "sortSelect"].forEach(function (id) {
    document.getElementById(id).addEventListener(id === "nameSearch" ? "input" : "change", refreshResults);
  });

  
  document.getElementById("resultsArea").addEventListener("click", function (e) {
    const detailsBtn = e.target.closest(".btn-details");
    const locateBtn = e.target.closest(".btn-locate");
    const btn = detailsBtn || locateBtn;
    if (btn) {
      const result = shownResults.find(function (r) { return r.item.id === btn.dataset.id && r.key === btn.dataset.key; });
      if (!result) return;
      if (detailsBtn) openDetails(result, userLoc);
      else focusPin(resultsMap, pins, result);
      return;
    }
    if (e.target.closest("#btnClearFilters")) clearFilters();
    if (e.target.closest("#btnRetry")) initResults();
  });

  initResults();
});
