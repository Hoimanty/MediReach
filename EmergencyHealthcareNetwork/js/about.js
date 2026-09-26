

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BD_PHONE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;


function validateContactForm(values) {
  const errors = {};
  if (values.name.length < 2) errors.cName = "Please enter your name (at least 2 letters).";
  if (!EMAIL_PATTERN.test(values.email)) errors.cEmail = "Please enter a valid email, like name@example.com.";

  const cleanPhone = values.phone.replace(/[\s-]/g, "");
  if (cleanPhone !== "" && !BD_PHONE_PATTERN.test(cleanPhone)) errors.cPhone = "Enter a valid mobile number, like 01xxxxxxxxx.";
  if (values.message.length < 10) errors.cMessage = "Please write at least 10 characters.";
  return errors;
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const ids = ["cName", "cEmail", "cPhone", "cMessage"];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const values = {
      name: document.getElementById("cName").value.trim(),
      email: document.getElementById("cEmail").value.trim(),
      phone: document.getElementById("cPhone").value.trim(),
      message: document.getElementById("cMessage").value.trim()
    };
    const errors = validateContactForm(values);

    ids.forEach(function (id) {
      const input = document.getElementById(id);
      input.classList.toggle("is-invalid", Boolean(errors[id]));
      input.nextElementSibling.textContent = errors[id] || "";
    });

    const result = document.getElementById("contactResult");
    if (Object.keys(errors).length > 0) {
      result.innerHTML = "";
      document.querySelector("#contactForm .is-invalid").focus();
      return;
    }
    result.innerHTML = '<div class="alert alert-success mb-0">Thank you, ' + escapeHtml(values.name) + '. Your message was checked but not sent anywhere.</div>';
    form.reset();
  });
});
