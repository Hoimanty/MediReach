
let banks = [];                
let bloodUser = DEFAULT_LOCATION;
let bloodShown = [];            
let selectedGroup = "all";      


function stockLevel(units) {
  if (units >= 10) return { cls: "tile-ok", label: "Good" };
  if (units > 0) return { cls: "tile-low", label: "Low" };
  return { cls: "tile-none", label: "Out" };
}

function makeBankResult(bank) {
  const distance = calculateDistance(bloodUser.lat, bloodUser.lng, bank.latitude, bank.longitude);

  const criteria = selectedGroup === "all" ? {} : { bloodGroup: selectedGroup, quantity: 1 };
  const avail = evaluateAvailability(bank, "blood", criteria);
  return { item: bank, avail: avail, distance: distance, key: "blood" };
}


function filterBanks(list) {
  const inStockOnly = document.getElementById("inStockOnly").checked;
  return list.filter(function (r) {
    if (!inStockOnly) return true;
    if (selectedGroup === "all") return r.avail.status !== "unavailable";
    return (r.item.stock[selectedGroup] || 0) > 0;
  });
}

function renderTile(group, units) {
  const level = stockLevel(units);
  const selected = group === selectedGroup ? " tile-selected" : "";
  return '<div class="blood-tile ' + level.cls + selected + '" role="listitem" aria-label="' + group + ": " + units + " units, " + level.label + '">' +
           '<span class="tile-group">' + group + "</span>" +
           '<span class="tile-units">' + units + "</span>" +
           '<span class="tile-label">' + level.label + "</span>" +
         "</div>";
}

function renderBloodBoard() {
  const all = banks.map(makeBankResult);
  bloodShown = filterBanks(all).sort(function (a, b) { return a.distance - b.distance; });

  const groupText = selectedGroup === "all" ? "any group" : selectedGroup;
  document.getElementById("resultCount").textContent =
    bloodShown.length + " blood bank(s) with " + groupText + " - nearest first.";

  const area = document.getElementById("bloodArea");
  if (bloodShown.length === 0) {
    area.innerHTML = '<div class="state-box"><i class="bi bi-droplet fs-1 text-secondary" aria-hidden="true"></i>' +
      '<h2 class="h5 mt-2">No available services found nearby.</h2><p>Try another blood group or turn off "Only show blood banks that have it in stock".</p></div>';
    return;
  }

  area.innerHTML = '<div class="row g-3">' + bloodShown.map(function (r) {
    const b = r.item;
    const tiles = BLOOD_GROUPS.map(function (g) { return renderTile(g, b.stock[g]); }).join("");
    return '<div class="col-md-6 col-xl-4"><article class="card blood-card h-100">' +
      '<div class="card-body">' +
        '<div class="d-flex justify-content-between align-items-start gap-2 mb-1">' +
          '<h3 class="h5 mb-0">' + escapeHtml(b.name) + "</h3>" + statusBadge(r.avail.status) +
        "</div>" +
        '<p class="mb-2"><strong>' + formatDistance(r.distance) + '</strong> <span class="text-secondary">- ' + escapeHtml(b.address) + "</span></p>" +
        '<div class="tile-grid mb-2" role="list">' + tiles + "</div>" +
        '<p class="small text-secondary mb-0"><i class="bi bi-clock-history" aria-hidden="true"></i> Update: ' + escapeHtml(formatUpdated(b.lastUpdated)) + " | " + escapeHtml(b.openHours) + "</p>" +
      "</div>" +
      '<div class="card-footer bg-transparent d-flex flex-wrap gap-2">' +
        '<button type="button" class="btn btn-dark btn-sm btn-details" data-id="' + escapeHtml(b.id) + '">View Details</button>' +
        '<a class="btn btn-danger btn-sm" href="tel:' + escapeHtml(b.phone.replace(/[^0-9+]/g, "")) + '"><i class="bi bi-telephone-fill" aria-hidden="true"></i> Call</a>' +
        '<a class="btn btn-outline-primary btn-sm" target="_blank" rel="noopener" href="' + directionsUrl(b, bloodUser) + '"><i class="bi bi-sign-turn-right" aria-hidden="true"></i> Directions</a>' +
      "</div></article></div>";
  }).join("") + "</div>";
}

function renderGroupPicker() {
  const groups = ["all"].concat(BLOOD_GROUPS);
  document.getElementById("groupPicker").innerHTML = groups.map(function (g) {
    const id = "grp-" + g.replace("+", "pos").replace("-", "neg");
    return '<input type="radio" class="btn-check" name="group" id="' + id + '" value="' + g + '"' + (g === selectedGroup ? " checked" : "") + ">" +
           '<label class="btn btn-outline-danger" for="' + id + '">' + (g === "all" ? "All" : g) + "</label>";
  }).join("");
}

async function initBlood() {
  document.getElementById("bloodArea").innerHTML =
    '<div class="state-box" role="status"><div class="spinner-border text-danger mb-3" aria-hidden="true"></div><p class="mb-0">Finding available emergency services...</p></div>';
  try {
    banks = await loadServiceData(SERVICES.blood.file);
    renderBloodBoard();
  } catch (error) {
    console.error(error);
    document.getElementById("bloodArea").innerHTML =
      '<div class="state-box"><i class="bi bi-exclamation-octagon fs-1 text-danger" aria-hidden="true"></i>' +
      '<h2 class="h5 mt-2">Unable to load service data.</h2><p>Please try again.</p>' +
      '<button type="button" class="btn btn-danger" id="btnRetry">Try again</button></div>';
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bloodUser = getActiveLocation() || DEFAULT_LOCATION;


  const wanted = getQueryParams().group;
  if (wanted && BLOOD_GROUPS.includes(wanted)) selectedGroup = wanted;

  renderGroupPicker();
  renderLocationWidget("locationBox", function () {
    bloodUser = getActiveLocation() || DEFAULT_LOCATION;
    renderBloodBoard();
  }, { stacked: true });
  if (bloodUser.source === "default") {
    showLocationMessage("Showing distances from " + DEFAULT_LOCATION.label + ". Set your location for accurate results.", "info");
  }

  document.getElementById("groupPicker").addEventListener("change", function (e) {
    selectedGroup = e.target.value;
    renderBloodBoard();
  });
  document.getElementById("inStockOnly").addEventListener("change", renderBloodBoard);

  document.getElementById("bloodArea").addEventListener("click", function (e) {
    if (e.target.closest("#btnRetry")) { initBlood(); return; }
    const btn = e.target.closest(".btn-details");
    if (!btn) return;
    const result = bloodShown.find(function (r) { return r.item.id === btn.dataset.id; });
    if (result) openDetails(result, bloodUser);
  });

  initBlood();
});
