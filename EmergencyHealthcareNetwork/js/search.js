
const SEARCH_FIELDS = {
  bed: [
    { name: "bedType", label: "Bed type", type: "select", options: OPTIONS.bedType, required: true },
    { name: "quantity", label: "Beds needed", type: "number", min: 1, max: 10, value: 1, required: true }
  ],
  ambulance: [
    { name: "ambulanceType", label: "Ambulance type", type: "select", options: OPTIONS.ambulanceType, required: true }
  ],
  blood: [
    { name: "bloodGroup", label: "Blood group", type: "select", options: BLOOD_GROUPS.map(function (g) { return [g, g]; }), placeholder: "Choose blood group", required: true },
    { name: "quantity", label: "Units (bags) needed", type: "number", min: 1, max: 10, value: 1, required: true }
  ],
  hospital: [
    { name: "department", label: "Emergency department", type: "select", options: OPTIONS.department, required: true }
  ],
  diagnostic: [
    { name: "testType", label: "Test needed", type: "select", options: OPTIONS.testType, required: true }
  ],
  doctor: [
    { name: "specialty", label: "Specialty", type: "select", options: OPTIONS.specialty, placeholder: "Choose specialty", required: true }
  ]
};

let currentService = "hospital";


function buildFieldHtml(field, prefill) {
  const id = "f-" + field.name;
  const value = prefill[field.name] !== undefined ? prefill[field.name] : (field.value !== undefined ? field.value : "");
  let control = "";

  if (field.type === "select") {
    let opts = field.placeholder ? '<option value="">' + field.placeholder + "</option>" : "";
    opts += field.options.map(function (o) {
      return '<option value="' + escapeHtml(o[0]) + '"' + (o[0] === value ? " selected" : "") + ">" + escapeHtml(o[1]) + "</option>";
    }).join("");
    control = '<select class="form-select form-select-lg" id="' + id + '" name="' + field.name + '" aria-describedby="err-' + field.name + '">' + opts + "</select>";
  } else if (field.type === "number") {
    control = '<input type="number" class="form-control form-control-lg" id="' + id + '" name="' + field.name + '" min="' + field.min + '" max="' + field.max + '" value="' + escapeHtml(value) + '" aria-describedby="err-' + field.name + '">';
  } else {
    const listAttr = field.list ? ' list="' + id + '-list"' : "";
    const datalist = field.list ? '<datalist id="' + id + '-list">' + field.list.map(function (m) { return '<option value="' + escapeHtml(m) + '"></option>'; }).join("") + "</datalist>" : "";
    control = '<input type="text" class="form-control form-control-lg" id="' + id + '" name="' + field.name + '" placeholder="' + (field.placeholder || "") + '" value="' + escapeHtml(value) + '"' + listAttr + ' autocomplete="off" aria-describedby="err-' + field.name + '">' + datalist;
  }

  return '<div class="mb-3">' +
           '<label class="form-label fw-semibold" for="' + id + '">' + field.label + (field.required ? ' <span class="text-danger" aria-hidden="true">*</span>' : "") + "</label>" +
           control +
           '<div class="invalid-feedback" id="err-' + field.name + '"></div>' +
         "</div>";
}


function renderForm(serviceKey, prefill) {
  currentService = serviceKey;
  const service = SERVICES[serviceKey];

  document.getElementById("formTitle").innerHTML = '<i class="bi ' + service.icon + ' text-danger" aria-hidden="true"></i> ' + service.label;
  document.getElementById("formHint").textContent = service.hint;
  document.getElementById("dynamicFields").innerHTML = SEARCH_FIELDS[serviceKey].map(function (f) {
    return buildFieldHtml(f, prefill || {});
  }).join("");

  document.querySelectorAll("#servicePills button").forEach(function (btn) {
    const isActive = btn.dataset.service === serviceKey;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function validateSearchForm(serviceKey) {
  const errors = {};

  SEARCH_FIELDS[serviceKey].forEach(function (field) {
    const input = document.getElementById("f-" + field.name);
    const value = input.value.trim();

    if (field.required && value === "") {
      errors[field.name] = "Please fill in " + field.label.toLowerCase() + ".";
    } else if (field.type === "number") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < field.min || n > field.max) {
        errors[field.name] = "Enter a whole number from " + field.min + " to " + field.max + ".";
      }
    } else if (field.type === "text" && field.minLength && value.length < field.minLength) {
      errors[field.name] = "Enter at least " + field.minLength + " characters.";
    }
  });


  if (!getActiveLocation()) {
    errors.location = "Please set your location first.";
  }
  return errors;
}


function showErrors(serviceKey, errors) {
  SEARCH_FIELDS[serviceKey].forEach(function (field) {
    const input = document.getElementById("f-" + field.name);
    const msg = document.getElementById("err-" + field.name);
    if (errors[field.name]) {
      input.classList.add("is-invalid");
      msg.textContent = errors[field.name];
    } else {
      input.classList.remove("is-invalid");
      msg.textContent = "";
    }
  });
  if (errors.location) showLocationMessage(errors.location, "error");
}

document.addEventListener("DOMContentLoaded", function () {
  const params = getQueryParams();


  const pill = function (key) {
    return '<button type="button" class="btn btn-outline-dark pill-btn" data-service="' + key + '" aria-pressed="false">' +
           '<i class="bi ' + SERVICES[key].icon + '" aria-hidden="true"></i> ' + SERVICES[key].label + "</button>";
  };
  const hospitalKeys = Object.keys(SERVICES).filter(function (k) { return SERVICES[k].group === "hospital"; });
  const otherKeys = Object.keys(SERVICES).filter(function (k) { return !SERVICES[k].group; });
  document.getElementById("servicePills").innerHTML =
    '<div class="pill-group"><span class="pill-group-label">Hospital</span>' + hospitalKeys.map(pill).join("") + "</div>" +
    otherKeys.map(pill).join("");

  document.getElementById("servicePills").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-service]");
    if (!btn) return;
    renderForm(btn.dataset.service, {});
    history.replaceState(null, "", "search.html?service=" + btn.dataset.service);
  });


  const start = SERVICES[params.service] ? params.service : "hospital";
  renderForm(start, params.service === start ? params : {}); 

  renderLocationWidget("locationBox", null, { stacked: true });

  document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const errors = validateSearchForm(currentService);
    showErrors(currentService, errors);

    if (Object.keys(errors).length > 0) {
      const firstBad = document.querySelector(".is-invalid");
      if (firstBad) firstBad.focus();
      return;
    }

  
    const loc = getActiveLocation();
    const query = new URLSearchParams({ service: currentService, lat: loc.lat, lng: loc.lng, loc: loc.label });
    SEARCH_FIELDS[currentService].forEach(function (f) {
      query.set(f.name, document.getElementById("f-" + f.name).value.trim());
    });
    window.location.href = "results.html?" + query.toString();
  });
});
