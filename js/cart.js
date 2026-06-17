// Giỏ hàng: fake middleware qua localStorage + đồng bộ MockAPI users

function getCartCount(user) {
  if (!user || !user.cart || !user.cart.length) return 0;
  return user.cart.reduce(function (sum, item) {
    return sum + (Number(item.quantity) || 0);
  }, 0);
}

function updateCartBadge() {
  const count = getCartCount(getCurrentUser());
  const $badge = $("#cartBadge");
  if (!$badge.length) return;
  if (count > 0) {
    $badge.text(count).removeClass("d-none");
  } else {
    $badge.addClass("d-none");
  }
}

function openLoginModal() {
  const el = document.getElementById("loginModal");
  if (!el) {
    window.location.href = "login.html";
    return;
  }
  new bootstrap.Modal(el).show();
}

async function addToCart(productId) {
  const user = getCurrentUser();
  if (!user) {
    showToast("Vui lòng đăng nhập để mua hàng!", "warning");
    openLoginModal();
    return;
  }

  if (!user.cart) user.cart = [];
  const pid = String(productId);
  const existing = user.cart.find(function (item) {
    return String(item.productId) === pid;
  });

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + 1;
  } else {
    user.cart.push({ productId: pid, quantity: 1 });
  }

  try {
    await updateUserCart(user.id, user.cart);
    setCurrentUser(user);
    showToast("Đã thêm vào giỏ hàng thành công!", "success");
    updateCartBadge();
  } catch (err) {
    showToast(err.message || "Lỗi cập nhật giỏ hàng", "error");
  }
}

async function removeFromCart(productId) {
  const user = getCurrentUser();
  if (!user || !user.cart) return;

  const pid = String(productId);
  user.cart = user.cart.filter(function (item) {
    return String(item.productId) !== pid;
  });

  try {
    await updateUserCart(user.id, user.cart);
    setCurrentUser(user);
    updateCartBadge();
    showToast("Đã xóa sản phẩm khỏi giỏ hàng", "success");
    renderCartModal();
  } catch (err) {
    showToast(err.message || "Lỗi cập nhật giỏ hàng", "error");
  }
}

function renderCartModal() {
  const $body = $("#cartModalBody").empty();
  const user = getCurrentUser();

  if (!user) {
    $body.html(
      '<p class="text-muted mb-3">Vui lòng đăng nhập để xem giỏ hàng.</p>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btnCartLogin">Đăng nhập</button>'
    );
    $("#btnCartLogin").on("click", function () {
      bootstrap.Modal.getInstance(document.getElementById("cartModal")).hide();
      openLoginModal();
    });
    return;
  }

  if (!user.cart || !user.cart.length) {
    $body.html('<p class="text-muted mb-0">Giỏ hàng trống.</p>');
    return;
  }

  const products =
    typeof getAllProducts === "function" ? getAllProducts() : [];
  let total = 0;
  let html =
    '<div class="cart-panel">' +
    '<div class="table-responsive"><table class="table table-sm cart-table mb-3">' +
    "<thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th></th></tr></thead><tbody>";

  user.cart.forEach(function (item) {
    const product = products.find(function (p) {
      return String(p.id) === String(item.productId);
    });
    const name = product ? product.name : "ID " + item.productId;
    const price = product ? Number(product.price) || 0 : 0;
    const qty = Number(item.quantity) || 0;
    const line = price * qty;
    total += line;
    html +=
      "<tr>" +
      "<td>" + escapeHtml(name) + "</td>" +
      "<td>" + qty + "</td>" +
      "<td>" + formatMoney(price) + "</td>" +
      "<td>" + formatMoney(line) + "</td>" +
      '<td class="text-center">' +
      '<button type="button" class="btn btn-sm btn-remove-cart" data-id="' +
      escapeHtml(String(item.productId)) +
      '" title="Xóa khỏi giỏ">' +
      '<i class="bi bi-x-lg"></i></button>' +
      "</td>" +
      "</tr>";
  });

  html +=
    "</tbody></table></div>" +
    '<div class="d-flex justify-content-between align-items-center cart-total">' +
    "<strong>Tổng cộng</strong>" +
    '<span class="h5 mb-0">' + formatMoney(total) + "</span>" +
    "</div></div>";

  $body.html(html);
}

function openCartModal() {
  renderCartModal();
  new bootstrap.Modal(document.getElementById("cartModal")).show();
}

async function handleModalLogin(e) {
  e.preventDefault();
  const form = e.target;
  if (!checkForm(form)) return;

  const inputUser = $("#modalUsername").val().trim();
  const inputPass = $("#modalPassword").val();
  const $btn = $("#btnModalLogin");
  $btn.prop("disabled", true).text("Đang đăng nhập...");

  try {
    const foundUser = await loginWithCredentials(inputUser, inputPass);
    if (foundUser) {
      showToast("Đăng nhập thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
      form.reset();
      form.classList.remove("was-validated");
      updateNavAuth();
      updateCartBadge();
      if (foundUser.role === "admin") {
        setTimeout(function () {
          window.location.href = "admin.html";
        }, 400);
      }
      return;
    }
    showToast("Sai tài khoản hoặc mật khẩu!", "error");
  } catch (err) {
    showToast(err.message || "Không kết nối được máy chủ đăng nhập", "error");
  } finally {
    $btn.prop("disabled", false).html(
      '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập'
    );
  }
}

$(function () {
  updateCartBadge();

  $("#btnNavCart").on("click", openCartModal);

  $(document).on("click", ".btn-add-cart", function (e) {
    e.stopPropagation();
    addToCart($(this).data("id"));
  });

  $(document).on("click", ".btn-remove-cart", function (e) {
    e.stopPropagation();
    removeFromCart($(this).data("id"));
  });

  $("#modalLoginForm").on("submit", handleModalLogin);
});
