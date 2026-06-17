// Logic đăng nhập: xác thực qua MockAPI users, phân quyền admin / user

$(function () {
  const existing = getCurrentUser();
  if (existing) {
    window.location.href =
      existing.role === "admin" ? "admin.html" : "index.html";
    return;
  }

  $("#loginForm").on("submit", handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  if (!checkForm(form)) return;

  const inputUser = $("#username").val().trim();
  const inputPass = $("#password").val();
  const $btn = $("#btnLogin");
  $btn.prop("disabled", true).text("Đang đăng nhập...");

  try {
    const foundUser = await loginWithCredentials(inputUser, inputPass);

    if (foundUser) {
      showToast("Đăng nhập thành công!", "success");
      setTimeout(function () {
        if (foundUser.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "index.html";
        }
      }, 400);
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
