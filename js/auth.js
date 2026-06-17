// Phân quyền: lưu session trên localStorage (frontend middleware)

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  if (!user.cart) user.cart = [];
  localStorage.setItem("currentUser", JSON.stringify(user));
  if (typeof updateCartBadge === "function") updateCartBadge();
}

async function loginWithCredentials(username, password) {
  const users = await getUsers();
  const foundUser = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!foundUser) return null;
  if (!foundUser.cart) foundUser.cart = [];
  setCurrentUser(foundUser);
  return foundUser;
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function requireAdmin() {
  const user = getCurrentUser();

  if (!user) {
    alert("Bạn phải đăng nhập để vào trang này!");
    window.location.href = "login.html";
    return false;
  }

  if (user.role !== "admin") {
    alert("Bạn không có quyền truy cập trang quản trị!");
    window.location.href = "index.html";
    return false;
  }

  console.log("Welcome Admin: " + user.fullName);
  return true;
}

function updateNavAuth() {
  const $area = $("#navUserArea");
  if (!$area.length) return;

  const user = getCurrentUser();
  if (user) {
    let html =
      '<span class="header-user-name small me-1 d-none d-md-inline">' +
      escapeHtml(user.fullName || user.username) +
      "</span>";
    if (user.role === "admin") {
      html +=
        '<a href="admin.html" class="btn btn-outline-pa btn-sm">' +
        '<i class="bi bi-gear"></i></a>';
    }
    html +=
      '<button type="button" id="btnLogout" class="btn btn-outline-pa btn-sm">' +
      '<i class="bi bi-box-arrow-right"></i></button>';
    $area.html(html);
    $("#btnLogout").on("click", logout);
    return;
  }

  $area.html(
    '<a href="login.html" class="btn btn-outline-pa btn-sm">' +
      '<i class="bi bi-person"></i> Đăng nhập</a>'
  );
}
