// Logic cho trang admin.html: CRUD sản phẩm, danh mục, duyệt review
// Frontend middleware: chỉ admin mới vào được trang này

if (requireAdmin()) {
  $(function () {
    const user = getCurrentUser();
    if (user) {
      $("#adminUserName").text(user.fullName || user.username);
    }
    $("#btnLogout").on("click", logout);
    loadAll();
    bindAdminEvents();
  });
}

let adminProducts = [];
let adminCategories = [];
let adminReviews = [];

function bindAdminEvents() {
  $("#btnAddProduct").on("click", () => openProductForm());
  $("#btnAddCategory").on("click", () => openCategoryForm());
  $("#productForm").on("submit", saveProduct);
  $("#categoryForm").on("submit", saveCategory);
}

async function loadAll() {
  try {
    adminProducts = await getProducts();
    renderProductTable();
  } catch (err) {
    showToast(err.message, "error");
  }

  getCategories()
    .done(function (data) {
      adminCategories = data || [];
      renderCategoryTable();
      fillCategorySelect();
    })
    .fail(() => showToast("Không tải được danh mục", "error"));

  getReviews()
    .done(function (data) {
      adminReviews = data || [];
      renderReviewTable();
    })
    .fail(() => showToast("Không tải được đánh giá", "error"));
}

// ---------- Sản phẩm ----------

function renderProductTable() {
  const $tb = $("#productTableBody").empty();
  if (!adminProducts.length) {
    $tb.append('<tr><td colspan="6" class="text-center text-muted">Chưa có sản phẩm.</td></tr>');
    return;
  }
  adminProducts.forEach((p) => {
    const row =
      "<tr>" +
      "<td>" + p.id + "</td>" +
      '<td><img src="' + (p.image || "img/no-image.png") + '" style="width:50px;height:50px;object-fit:cover;"></td>' +
      "<td>" + escapeHtml(p.name) + "</td>" +
      "<td>" + formatMoney(p.price) + "</td>" +
      "<td>" + escapeHtml(p.category || "—") + "</td>" +
      '<td>' +
      '  <button class="btn btn-sm btn-warning btn-edit-product" data-id="' + p.id + '"><i class="bi bi-pencil"></i></button> ' +
      '  <button class="btn btn-sm btn-danger btn-delete-product" data-id="' + p.id + '"><i class="bi bi-trash"></i></button>' +
      '</td>' +
      "</tr>";
    $tb.append(row);
  });

  $(".btn-edit-product").on("click", function () {
    const id = $(this).data("id");
    const p = adminProducts.find((x) => String(x.id) === String(id));
    if (p) openProductForm(p);
  });
  $(".btn-delete-product").on("click", function () {
    const id = $(this).data("id");
    removeProduct(id);
  });
}

function openProductForm(product) {
  const form = document.getElementById("productForm");
  form.classList.remove("was-validated");
  form.reset();

  fillCategorySelect();

  if (product) {
    $("#productFormTitle").text("Sửa sản phẩm");
    $("#productId").val(product.id);
    $("#productName").val(product.name);
    $("#productPrice").val(product.price);
    $("#productCategory").val(product.category || "");
    $("#productImage").val(product.image);
    $("#productDesc").val(product.description);
    $("#productScreen").val(product.screen || "");
    $("#productCpu").val(product.cpu || "");
    $("#productRam").val(product.ram || "");
  } else {
    $("#productFormTitle").text("Thêm sản phẩm");
    $("#productId").val("");
  }
  new bootstrap.Modal(document.getElementById("productFormModal")).show();
}

async function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  if (!checkForm(form)) return;

  const id = $("#productId").val();
  const data = {
    name: $("#productName").val().trim(),
    price: Number($("#productPrice").val()),
    category: $("#productCategory").val(),
    image: $("#productImage").val().trim(),
    description: $("#productDesc").val().trim(),
    screen: ($("#productScreen").val() || "").trim(),
    cpu: ($("#productCpu").val() || "").trim(),
    ram: ($("#productRam").val() || "").trim(),
  };

  try {
    if (id) {
      await updateProduct(id, data);
      showToast("Cập nhật thành công", "success");
    } else {
      await addProduct(data);
      showToast("Thêm sản phẩm thành công", "success");
    }
    bootstrap.Modal.getInstance(document.getElementById("productFormModal")).hide();
    adminProducts = await getProducts();
    renderProductTable();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function removeProduct(id) {
  if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
  try {
    await deleteProduct(id);
    showToast("Xóa thành công", "success");
    adminProducts = await getProducts();
    renderProductTable();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------- Danh mục ----------

function renderCategoryTable() {
  const $tb = $("#categoryTableBody").empty();
  if (!adminCategories.length) {
    $tb.append('<tr><td colspan="3" class="text-center text-muted">Chưa có danh mục.</td></tr>');
    return;
  }
  adminCategories.forEach((c) => {
    const row =
      "<tr>" +
      "<td>" + c.id + "</td>" +
      "<td>" + escapeHtml(c.name) + "</td>" +
      '<td>' +
      '  <button class="btn btn-sm btn-warning btn-edit-cat" data-id="' + c.id + '"><i class="bi bi-pencil"></i></button> ' +
      '  <button class="btn btn-sm btn-danger btn-delete-cat" data-id="' + c.id + '"><i class="bi bi-trash"></i></button>' +
      '</td>' +
      "</tr>";
    $tb.append(row);
  });

  $(".btn-edit-cat").on("click", function () {
    const id = $(this).data("id");
    const c = adminCategories.find((x) => String(x.id) === String(id));
    if (c) openCategoryForm(c);
  });
  $(".btn-delete-cat").on("click", function () {
    removeCategory($(this).data("id"));
  });
}

function openCategoryForm(category) {
  const form = document.getElementById("categoryForm");
  form.classList.remove("was-validated");
  form.reset();
  if (category) {
    $("#categoryFormTitle").text("Sửa danh mục");
    $("#categoryId").val(category.id);
    $("#categoryName").val(category.name);
  } else {
    $("#categoryFormTitle").text("Thêm danh mục");
    $("#categoryId").val("");
  }
  new bootstrap.Modal(document.getElementById("categoryFormModal")).show();
}

function saveCategory(e) {
  e.preventDefault();
  const form = e.target;
  if (!checkForm(form)) return;

  const id = $("#categoryId").val();
  const data = { name: $("#categoryName").val().trim() };

  const req = id ? updateCategory(id, data) : addCategory(data);
  req
    .done(function () {
      showToast("Lưu danh mục thành công", "success");
      bootstrap.Modal.getInstance(document.getElementById("categoryFormModal")).hide();
      getCategories().done(function (data) {
        adminCategories = data || [];
        renderCategoryTable();
        fillCategorySelect();
      });
    })
    .fail(() => showToast("Lưu danh mục thất bại", "error"));
}

function removeCategory(id) {
  if (!confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
  deleteCategory(id)
    .done(function () {
      showToast("Xóa danh mục thành công", "success");
      getCategories().done(function (data) {
        adminCategories = data || [];
        renderCategoryTable();
        fillCategorySelect();
      });
    })
    .fail(() => showToast("Xóa thất bại", "error"));
}

// ---------- Review ----------

function renderReviewTable() {
  const $tb = $("#reviewTableBody").empty();
  if (!adminReviews.length) {
    $tb.append('<tr><td colspan="7" class="text-center text-muted">Chưa có đánh giá.</td></tr>');
    return;
  }
  adminReviews.forEach((r) => {
    const productName =
      (adminProducts.find((p) => String(p.id) === String(r.productId)) || {})
        .name || "—";
    const approved = Boolean(r.approved);
    const badge = approved
      ? '<span class="badge bg-success">Đã duyệt</span>'
      : '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
    const rating = Number(r.rating) || 0;

    const row =
      "<tr>" +
      '<td><small class="text-muted">' + escapeHtml(String(r.id)) + "</small></td>" +
      "<td>" + escapeHtml(productName) + "</td>" +
      "<td>" + escapeHtml(r.reviewerName || "Ẩn danh") + "</td>" +
      '<td><span class="text-warning">' + "★".repeat(rating) + "</span>" + "☆".repeat(Math.max(0, 5 - rating)) + "</td>" +
      "<td>" + escapeHtml(r.comment || "") + "</td>" +
      "<td>" + badge + "</td>" +
      '<td>' +
      (approved
        ? '  <button class="btn btn-sm btn-secondary btn-unapprove" data-id="' + r.id + '" title="Hủy duyệt"><i class="bi bi-x"></i></button> '
        : '  <button class="btn btn-sm btn-success btn-approve" data-id="' + r.id + '" title="Duyệt"><i class="bi bi-check"></i></button> ') +
      '  <button class="btn btn-sm btn-danger btn-delete-review" data-id="' + r.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
      "</td>" +
      "</tr>";
    $tb.append(row);
  });

  $(".btn-approve").on("click", function () {
    setReviewApproved($(this).data("id"), true);
  });
  $(".btn-unapprove").on("click", function () {
    setReviewApproved($(this).data("id"), false);
  });
  $(".btn-delete-review").on("click", function () {
    removeReview($(this).data("id"));
  });
}

function setReviewApproved(id, approved) {
  updateReview(id, { approved: approved })
    .done(function () {
      showToast("Cập nhật trạng thái thành công", "success");
      getReviews().done(function (data) {
        adminReviews = data || [];
        renderReviewTable();
      });
    })
    .fail(() => showToast("Cập nhật thất bại", "error"));
}

function removeReview(id) {
  if (!confirm("Xóa đánh giá này?")) return;
  deleteReview(id)
    .done(function () {
      showToast("Xóa đánh giá thành công", "success");
      getReviews().done(function (data) {
        adminReviews = data || [];
        renderReviewTable();
      });
    })
    .fail(() => showToast("Xóa thất bại", "error"));
}

// ---------- Helpers ----------

function fillCategorySelect() {
  const $sel = $("#productCategory").empty();
  $sel.append('<option value="">-- Chọn danh mục --</option>');
  adminCategories.forEach((c) => {
    $sel.append(
      '<option value="' +
        escapeHtml(c.name) +
        '">' +
        escapeHtml(c.name) +
        "</option>"
    );
  });
}
