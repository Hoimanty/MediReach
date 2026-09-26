function bigButton(key, extraClass) {
  const s = SERVICES[key];
  return '<a class="big-btn ' + (extraClass || "") + '" href="search.html?service=' + key + '">' +
           '<i class="bi ' + s.icon + '" aria-hidden="true"></i><span>' + s.label + "</span></a>";
}

document.addEventListener("DOMContentLoaded", function () {
  const hospitalKeys = Object.keys(SERVICES).filter(function (k) { return SERVICES[k].group === "hospital"; });
  const otherKeys = Object.keys(SERVICES).filter(function (k) { return !SERVICES[k].group; });

  document.getElementById("hospitalGroup").innerHTML =
    '<h2 class="group-title"><i class="bi bi-hospital" aria-hidden="true"></i> Hospital</h2>' +
    '<div class="row g-2">' + hospitalKeys.map(function (k) {
      return '<div class="col-12 col-md-4">' + bigButton(k, "big-btn-red") + "</div>";
    }).join("") + "</div>";


  document.getElementById("otherServices").innerHTML = otherKeys.map(function (k) {
    return '<div class="col-6 col-md-4">' + bigButton(k) + "</div>";
  }).join("");

  renderLocationWidget("locationBox");
});
