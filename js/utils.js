// Các hàm dùng chung: format tiền, kiểm tra form, hiển thị thông báo...

function formatMoney(value) {
  if (value === null || value === undefined || isNaN(value)) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isValidNumber(value) {
  return !isNaN(value) && Number(value) >= 0;
}

function isValidUrl(value) {
  if (isEmpty(value)) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function checkForm(formEl) {
  if (!formEl) return false;
  formEl.classList.add("was-validated");
  return formEl.checkValidity();
}

function showToast(message, type) {
  type = type || "info";
  const colors = {
    success: "bg-success",
    error: "bg-danger",
    info: "bg-primary",
    warning: "bg-warning text-dark",
  };
  const id = "toast-" + Date.now();
  const html =
    '<div id="' +
    id +
    '" class="toast align-items-center text-white ' +
    (colors[type] || colors.info) +
    ' border-0" role="alert">' +
    '<div class="d-flex">' +
    '<div class="toast-body">' +
    message +
    "</div>" +
    '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
    "</div></div>";

  let wrap = document.getElementById("toastWrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toastWrap";
    wrap.className = "toast-container position-fixed top-0 end-0 p-3";
    wrap.style.zIndex = 1080;
    document.body.appendChild(wrap);
  }
  wrap.insertAdjacentHTML("beforeend", html);
  const el = document.getElementById(id);
  const toast = new bootstrap.Toast(el, { delay: 3000 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
