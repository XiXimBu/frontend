// Logic cho trang index.html: hiển thị sản phẩm, tìm kiếm, lọc, so sánh, review

let allProducts = [];
let allCategories = [];
let compareList = [];

function getAllProducts() {
  return allProducts;
}

$(function () {
  loadCategories();
  loadProducts();
  loadReviews();
  bindEvents();
});

function bindEvents() {
  $("#searchInput").on("input", renderProducts);
  $("#categoryFilter").on("change", function () {
    syncCategoryUi($(this).val());
    renderProducts();
  });
  $("#sortFilter").on("change", renderProducts);

  $(document).on("click", ".category-chip", function () {
    const cat = $(this).data("category") || "";
    $("#categoryFilter").val(cat);
    syncCategoryUi(cat);
    renderProducts();
  });

  $(document).on("click", ".category-menu-item", function (e) {
    e.preventDefault();
    const cat = $(this).data("category") || "";
    $("#categoryFilter").val(cat);
    syncCategoryUi(cat);
    renderProducts();
  });
}

function syncCategoryUi(categoryName) {
  const name = categoryName || "";
  $(".category-chip").removeClass("active");
  $('.category-chip[data-category="' + name + '"]').addClass("active");
  $(".category-menu-item").removeClass("active");
  $('.category-menu-item[data-category="' + name + '"]').addClass("active");
  $("#sectionTitle").text(name ? name : "Sản phẩm nổi bật");
  $("#breadcrumbCategory").text(name || "Sản phẩm công nghệ");
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
      const $menu = $("#navCategoryMenu");
      const $chips = $("#categoryChips");

      $select.find("option:not(:first)").remove();
      $menu.find("li:not(:first)").remove();
      $chips.empty();
      $chips.append(
        '<button type="button" class="category-chip active" data-category="">Tất cả</button>'
      );

      allCategories.forEach((c) => {
        $select.append(
          '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + "</option>"
        );
        $menu.append(
          '<li><a class="dropdown-item category-menu-item" href="#" data-category="' +
            escapeHtml(c.name) +
            '">' +
            escapeHtml(c.name) +
            "</a></li>"
        );
        $chips.append(
          '<button type="button" class="category-chip" data-category="' +
            escapeHtml(c.name) +
            '">' +
            escapeHtml(c.name) +
            "</button>"
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
      '<div class="col-6 col-md-4 col-lg-2 product-col">' +
      '  <div class="product-card-pa product-card" data-id="' + p.id + '">' +
      '    <div class="product-img-wrap btn-detail" role="button" tabindex="0">' +
      '      <img src="' + escapeHtml(p.image || "img/no-image.png") + '" alt="">' +
      "    </div>" +
      '    <h3 class="product-name btn-detail" role="button" tabindex="0">' +
      escapeHtml(p.name) +
      "</h3>" +
      '    <div class="product-price-pa">' + formatMoney(p.price) + "</div>" +
      '    <div class="product-meta-pa">' +
      '      <span class="stock-ok"><i class="bi bi-check-lg"></i> Có hàng</span>' +
      '      <button type="button" class="btn-link-pa btn-add-cart" data-id="' +
      p.id +
      '"><i class="bi bi-cart3"></i> Giỏ hàng</button>' +
      '      <button type="button" class="btn-link-pa btn-compare"><i class="bi bi-plus-lg"></i> So sánh</button>' +
      "    </div>" +
      "  </div>" +
      "</div>";
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
      '    <table class="table table-sm product-spec-table">' +
      specRow("Danh mục", product.category) +
      specRow("Màn hình", product.screen) +
      specRow("CPU", product.cpu) +
      specRow("RAM", product.ram) +
      "    </table>" +
      '    <button type="button" class="btn btn-pa-red mt-3 btn-add-cart" data-id="' +
      product.id +
      '"><i class="bi bi-cart-plus"></i> Thêm vào giỏ</button>' +
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
    '<button type="button" class="btn btn-sm btn-outline-danger mt-3" id="btnClearCompare">Xóa so sánh</button>';
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
      '<div class="col-md-6 col-lg-4">' +
      '  <div class="review-card p-3 h-100">' +
      '    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">' +
      '      <strong>' + escapeHtml(r.reviewerName || "Ẩn danh") + "</strong>" +
      '      <span class="star-rating small">' + stars + "</span>" +
      "    </div>" +
      (productName
        ? '<div class="small text-muted mb-2"><i class="bi bi-box-seam me-1"></i>' +
          escapeHtml(productName) +
          "</div>"
        : "") +
      '    <p class="mb-0">' + escapeHtml(r.comment || "") + "</p>" +
      "  </div>" +
      "</div>";
    $wrap.append(html);
  });
}
