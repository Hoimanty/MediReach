let mapMarkers = []; 
let youMarker = null; 
function createMap(elementId, center) {
  const box = document.getElementById(elementId);
  if (typeof google === "undefined" || !google.maps) {
    box.innerHTML = '<div class="state-box h-100 border-0"><i class="bi bi-wifi-off fs-1" aria-hidden="true"></i>' +
      '<p class="mb-0">The map could not load and Check your internet connection.</p></div>';
    return null;
  }
  return new google.maps.Map(box, {
    center: { lat: center.lat, lng: center.lng },
    zoom: 13,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false
  });
}

const PIN_COLOR = { available: "#0b6e3a", limited: "#d98200", unavailable: "#4d5560" };
function pinIcon(status) {
  const color = PIN_COLOR[status] || PIN_COLOR.unavailable;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">' +
              '<circle cx="15" cy="15" r="12" fill="' + color + '" stroke="#fff" stroke-width="3"/></svg>';
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(30, 30),
    anchor: new google.maps.Point(15, 15)
  };
}

function clearMarkers() {
  mapMarkers.forEach(function (m) { m.setMap(null); });
  mapMarkers = [];
}
function drawMarkers(map, results, userLoc, onSelect) {
  const pins = {};
  if (!map) return pins;
  clearMarkers();

  const bounds = new google.maps.LatLngBounds();
  results.forEach(function (r) {
    const marker = new google.maps.Marker({
      position: { lat: r.item.latitude, lng: r.item.longitude },
      map: map,
      title: r.item.name + " - " + STATUS_INFO[r.avail.status].label + " - " + formatDistance(r.distance),
      icon: pinIcon(r.avail.status)
    });
    marker.addListener("click", function () { onSelect(r); });
    mapMarkers.push(marker);
    pins[r.key + "-" + r.item.id] = marker;
    bounds.extend(marker.getPosition());
  });

  if (youMarker) youMarker.setMap(null);
  youMarker = new google.maps.Marker({
    position: { lat: userLoc.lat, lng: userLoc.lng },
    map: map,
    title: "You are here (" + userLoc.label + ")",
    icon: {
      path: google.maps.SymbolPath.CIRCLE, scale: 8,
      fillColor: "#0d6efd", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2
    },
    zIndex: 999
  });
  bounds.extend(youMarker.getPosition());

  if (results.length > 0) {
    map.fitBounds(bounds, 60);
   
    google.maps.event.addListenerOnce(map, "bounds_changed", function () {
      if (map.getZoom() > 15) map.setZoom(15);
    });
  } else {
    map.setCenter({ lat: userLoc.lat, lng: userLoc.lng });
    map.setZoom(13);
  }
  return pins;
}

function focusPin(map, pins, result) {
  if (!map) return;
  map.panTo({ lat: result.item.latitude, lng: result.item.longitude });
  map.setZoom(15);
  const pin = pins[result.key + "-" + result.item.id];
  if (pin) {
    pin.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () { pin.setAnimation(null); }, 1400);
  }
  document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
}
