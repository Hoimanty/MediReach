

let locatorMap = null;
let locatorPins = {};
let locatorUser = DEFAULT_LOCATION;
let locatorAll = [];     
let locatorShown = [];    


function filterLocator() {
  const layer = document.querySelector('input[name="layer"]:checked').value;
  const hideUnavailable = document.getElementById("onlyAvailable").checked;
  return locatorAll.filter(function (r) {
    if (layer !== "all" && r.key !== layer) return false;
    if (hideUnavailable && r.avail.status === "unavailable") return false;
    return true;
  }).sort(function (a, b) { return a.distance - b.distance; });
}

function renderLocatorList() {
  const list = document.getElementById("locatorList");
  document.getElementById("resultCount").textContent = "Showing " + locatorShown.length + " nearby place(s), nearest first.";
  if (locatorShown.length === 0) {
    list.innerHTML = '<div class="state-box"><h2 class="h6">No available services found nearby.</h2><p class="mb-0">Try showing unavailable places too.</p></div>';
    return;
  }
  list.innerHTML = '<div class="d-grid gap-3">' + locatorShown.map(function (r) {
    return renderResultCard(r, locatorUser, { locate: true });
  }).join("") + "</div>";
}


function refreshLocator() {
  locatorAll.forEach(function (r) {
    r.distance = calculateDistance(locatorUser.lat, locatorUser.lng, r.item.latitude, r.item.longitude);
  });
  locatorShown = filterLocator();
  renderLocatorList();
  locatorPins = drawMarkers(locatorMap, locatorShown, locatorUser, function (r) { openDetails(r, locatorUser); });
}

function onLocatorLocationChanged() {
  locatorUser = getActiveLocation() || DEFAULT_LOCATION;
  refreshLocator();
}

async function initLocator() {
  const list = document.getElementById("locatorList");
  list.innerHTML = '<div class="state-box" role="status"><div class="spinner-border text-danger mb-3" aria-hidden="true"></div><p class="mb-0">Finding available emergency services...</p></div>';
  try {
    
    const both = await Promise.all([
      loadServiceData(SERVICES.hospital.file),
      loadServiceData(SERVICES.ambulance.file)
    ]);
    locatorAll = buildResults(both[0], "hospital", { department: "any" }, locatorUser)
      .concat(buildResults(both[1], "ambulance", { ambulanceType: "any" }, locatorUser));
    refreshLocator();
  } catch (error) {
    console.error(error);
    list.innerHTML = '<div class="state-box"><i class="bi bi-exclamation-octagon fs-1 text-danger" aria-hidden="true"></i>' +
                     '<h2 class="h5 mt-2">Unable to load service data.</h2><p>Please try again.</p>' +
                     '<button type="button" class="btn btn-danger" id="btnRetry">Try again</button></div>';
  }
}

document.addEventListener("DOMContentLoaded", function () {
  locatorUser = getActiveLocation() || DEFAULT_LOCATION;
  locatorMap = createMap("map", locatorUser);
  renderLocationWidget("locationBox", onLocatorLocationChanged);
  if (locatorUser.source === "default") {
    showLocationMessage("Showing distances from " + DEFAULT_LOCATION.label + ". Set your location for accurate results.", "info");
  }

  document.querySelectorAll('input[name="layer"], #onlyAvailable').forEach(function (el) {
    el.addEventListener("change", refreshLocator);
  });

  document.getElementById("locatorList").addEventListener("click", function (e) {
    if (e.target.closest("#btnRetry")) { initLocator(); return; }
    const detailsBtn = e.target.closest(".btn-details");
    const locateBtn = e.target.closest(".btn-locate");
    const btn = detailsBtn || locateBtn;
    if (!btn) return;
    const result = locatorShown.find(function (r) { return r.item.id === btn.dataset.id && r.key === btn.dataset.key; });
    if (!result) return;
    if (detailsBtn) openDetails(result, locatorUser);
    else focusPin(locatorMap, locatorPins, result);
  });

  initLocator();
});
