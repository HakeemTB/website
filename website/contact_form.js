/**
 * contact_form.js
 * Handles the portfolio contact form:
 *  - Opens the visitor's mail client with a prefilled message
 *  - Stores every submission as JSON in localStorage under "portfolio_contacts"
 */

const CONTACT_RECIPIENT_EMAIL = "hakeemtony02@gmail.com"; // replace with your email address
const STORAGE_KEY = "portfolio_contacts";

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Load existing contacts array from localStorage (or empty array). */
function loadContacts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Persist contacts array back to localStorage as formatted JSON. */
function saveContacts(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts, null, 2));
}

/** Append a new submission and save. Returns the updated array. */
function storeContact(name, email, message) {
  const contacts = loadContacts();
  contacts.push({
    id:        contacts.length + 1,
    name,
    email,
    message,
    submitted: new Date().toISOString(),
  });
  saveContacts(contacts);
  return contacts;
}

/** Show a temporary status banner below the form. */
function showStatus(form, text, isError = false) {
  let banner = form.querySelector(".form-status");
  if (!banner) {
    banner = document.createElement("p");
    banner.className = "form-status";
    form.appendChild(banner);
  }
  banner.textContent  = text;
  banner.style.color  = isError ? "#e05252" : "#52c07a";
  banner.style.margin = "0.75rem 0 0";
  banner.style.fontWeight = "500";

  // auto-hide after 5 s
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => { banner.textContent = ""; }, 5000);
}

/* ── main init ────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("contact-form");
  // Re-usable form handler that works for the modal form
  function attachFormHandler(formEl) {
    if (!formEl) return;
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const name    = formEl.name.value.trim();
      const email   = formEl.email.value.trim();
      const message = formEl.message.value.trim();

      if (!name || !email || !message) {
        showStatus(formEl, "Please fill in all fields.", true);
        return;
      }

      const submitBtn = formEl.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.textContent : "Send";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

      /* 1 — store locally regardless of email result */
      const contacts = storeContact(name, email, message);
      console.info(
        `Contact saved locally (${contacts.length} total). ` +
        `JSON snapshot:\n${JSON.stringify(contacts, null, 2)}`
      );

      /* 2 — open mail client using mailto */
      const mailto = `mailto:${encodeURIComponent(CONTACT_RECIPIENT_EMAIL)}?subject=${encodeURIComponent("Portfolio contact from " + name)}&body=${encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\nMessage:\n" + message)}`;
      showStatus(formEl, "Opening your mail app so you can send the message.");
      window.location.href = mailto;
      formEl.reset();
      if (formEl.id === 'contact-modal-form') closeModal();

      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    });
  }

  // Attach handler to modal form
  const modalForm  = document.getElementById("contact-modal-form");
  attachFormHandler(modalForm);

  // Modal open/close logic
  const modal = document.getElementById('contact-modal');
  function openModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    const first = modal.querySelector('input, textarea');
    if (first) first.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  // Icon that triggers email modal
  document.querySelectorAll('.contact-icon[data-action="email"]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  });

  // Elements that close modal (backdrop, cancel, close button)
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
});

/* ── dev utility ─────────────────────────────────────────────────────── */

/**
 * Open your browser console and call this to see all stored contacts
 * as a formatted JSON string, or to download them as a .json file.
 *
 *   getContacts()          → logs to console
 *   getContacts(true)      → downloads contacts.json
 */
window.getContacts = function (download = false) {
  const contacts = loadContacts();
  const json     = JSON.stringify(contacts, null, 2);
  console.log("Stored contacts:\n", json);
  if (download) {
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "contacts.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return contacts;
};
