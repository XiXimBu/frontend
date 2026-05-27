// Logic cho trang index.html: hiển thị sản phẩm, tìm kiếm, lọc, so sánh, review

let allProducts = [];
let allCategories = [];
let compareList = [];

$(function () {
  loadCategories();
  loadProducts();
  loadReviews();
  bindEvents();
});

function bindEvents() {
  $("#searchInput").on("input", renderProducts);
  $("#categoryFilter").on("change", renderProducts);
  $("#sortFilter").on("change", renderProducts);
}

async function loadProducts() {
  try {
    allProducts = await getProducts();
    renderProducts();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function loadCategories() {
  getCategories()
    .done(function (data) {
      allCategories = data || [];
      const $select = $("#categoryFilter");
      allCategories.forEach((c) => {
        $select.append(
          '<option value="' + escapeHtml(c.name) + '">' +
            escapeHtml(c.name) +
            "</option>"
        );
      });
    })
    .fail(function () {
      showToast("Không tải được danh mục", "error");
    });
}

function loadReviews() {
  getReviews({ approved: true })
    .done(function (data) {
      renderReviews(data || []);
    })
    .fail(function () {
      $("#reviewList").html('<p class="text-muted">Chưa có đánh giá nào.</p>');
    });
}

function renderProducts() {
  const keyword = ($("#searchInput").val() || "").toLowerCase().trim();
  const categoryName = $("#categoryFilter").val();
  const sort = $("#sortFilter").val();

  let list = allProducts.slice();

  if (keyword) {
    list = list.filter((p) => (p.name || "").toLowerCase().includes(keyword));
  }
  if (categoryName) {
    list = list.filter(
      (p) => String(p.category || "") === String(categoryName)
    );
  }

  if (sort === "priceAsc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === "priceDesc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === "nameAsc")
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  $("#productCount").text("Hiển thị " + list.length + " sản phẩm");

  const $wrap = $("#productList").empty();
  if (list.length === 0) {
    $wrap.html('<p class="text-muted">Không có sản phẩm phù hợp.</p>');
    return;
  }

  list.forEach((p) => {
    const html =
      '<div class="col-md-4 col-lg-3">' +
      '  <div class="card product-card h-100" data-id="' + p.id + '">' +
      '    <img src="' + (p.image || "img/no-image.png") + '" class="card-img-top" alt="">' +
      '    <div class="card-body d-flex flex-column">' +
      '      <h6 class="card-title">' + escapeHtml(p.name) + '</h6>' +
      '      <p class="product-price mb-2">' + formatMoney(p.price) + '</p>' +
      '      <div class="mt-auto d-flex gap-2">' +
      '        <button class="btn btn-sm btn-outline-primary flex-grow-1 btn-detail">Chi tiết</button>' +
      '        <button class="btn btn-sm btn-outline-success btn-compare" title="So sánh"><i class="bi bi-bar-chart"></i></button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    $wrap.append(html);
  });

  $(".btn-detail").on("click", function () {
    const id = $(this).closest(".product-card").data("id");
    openProductDetail(id);
  });
  $(".btn-compare").on("click", function (e) {
    e.stopPropagation();
    const id = $(this).closest(".product-card").data("id");
    addToCompare(id);
  });
}

async function openProductDetail(id) {
  try {
    const product = await getProductById(id);
    const specRow = (label, value) =>
      value
        ? '<tr><th class="w-25">' +
          label +
          "</th><td>" +
          escapeHtml(value) +
          "</td></tr>"
        : "";
    const body =
      '<div class="row">' +
      '  <div class="col-md-5"><img src="' +
      (product.image || "img/no-image.png") +
      '" class="img-fluid rounded"></div>' +
      '  <div class="col-md-7">' +
      "    <h4>" + escapeHtml(product.name) + "</h4>" +
      '    <p class="product-price h5">' + formatMoney(product.price) + "</p>" +
      "    <p>" + escapeHtml(product.description || "") + "</p>" +
      '    <table class="table table-sm">' +
      specRow("Danh mục", product.category) +
      specRow("Màn hình", product.screen) +
      specRow("CPU", product.cpu) +
      specRow("RAM", product.ram) +
      "    </table>" +
      "  </div>" +
      "</div>";
    $("#productModalTitle").text(product.name);
    $("#productModalBody").html(body);
    new bootstrap.Modal(document.getElementById("productModal")).show();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function addToCompare(id) {
  if (compareList.includes(id)) {
    showToast("Sản phẩm đã có trong so sánh", "warning");
    return;
  }
  if (compareList.length >= 3) {
    showToast("Chỉ so sánh tối đa 3 sản phẩm", "warning");
    return;
  }
  compareList.push(id);
  renderCompare();
}

function renderCompare() {
  const $box = $("#compareBox");
  if (compareList.length === 0) {
    $box.html('<p class="text-muted">Chọn sản phẩm để so sánh.</p>');
    return;
  }
  const items = compareList
    .map((id) => allProducts.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  const cell = (val) => "<td>" + escapeHtml(val || "—") + "</td>";

  let html =
    '<table class="table table-bordered compare-table"><thead><tr><th>Thuộc tính</th>';
  items.forEach((p) => {
    html += "<th>" + escapeHtml(p.name) + "</th>";
  });
  html += "</tr></thead><tbody>";
  html +=
    "<tr><td>Giá</td>" +
    items.map((p) => "<td>" + formatMoney(p.price) + "</td>").join("") +
    "</tr>";
  html +=
    "<tr><td>Danh mục</td>" + items.map((p) => cell(p.category)).join("") + "</tr>";
  html +=
    "<tr><td>Màn hình</td>" + items.map((p) => cell(p.screen)).join("") + "</tr>";
  html += "<tr><td>CPU</td>" + items.map((p) => cell(p.cpu)).join("") + "</tr>";
  html += "<tr><td>RAM</td>" + items.map((p) => cell(p.ram)).join("") + "</tr>";
  html +=
    "<tr><td>Mô tả</td>" +
    items.map((p) => cell(p.description)).join("") +
    "</tr>";
  html += "</tbody></table>";
  html +=
    '<button class="btn btn-sm btn-outline-danger" id="btnClearCompare">Xóa so sánh</button>';
  $box.html(html);
  $("#btnClearCompare").on("click", function () {
    compareList = [];
    renderCompare();
  });
}

function renderReviews(list) {
  const $wrap = $("#reviewList").empty();
  if (!list.length) {
    $wrap.html('<p class="text-muted">Chưa có đánh giá nào.</p>');
    return;
  }
  list.forEach((r) => {
    const productName =
      (allProducts.find((p) => String(p.id) === String(r.productId)) || {})
        .name || "";
    const rating = Number(r.rating) || 0;
    const stars =
      '<span class="text-warning">' +
      "★".repeat(rating) +
      '<span class="text-muted">' + "☆".repeat(Math.max(0, 5 - rating)) + "</span>" +
      "</span>";
    const html =
      '<div class="col-md-6">' +
      '  <div class="card review-card p-3">' +
      '    <div class="d-flex justify-content-between align-items-center">' +
      '      <strong>' + escapeHtml(r.reviewerName || "Ẩn danh") + "</strong>" +
      "      " + stars +
      "    </div>" +
      (productName
        ? '    <small class="text-muted">' +
          escapeHtml(productName) +
          "</small>"
        : "") +
      '    <p class="mb-0 mt-2">' + escapeHtml(r.comment || "") + "</p>" +
      "  </div>" +
      "</div>";
    $wrap.append(html);
  });
}
