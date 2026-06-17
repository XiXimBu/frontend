// Tập trung các hàm gọi API (Fetch + jQuery AJAX)

const BASE_URL = "https://6a1641f81b90031f81b0d673.mockapi.io";
const USERS_URL = "https://6a3163527bc5e1c61265aaba.mockapi.io";

// ---------- Tài khoản (dùng Fetch) ----------

async function getUsers() {
  const res = await fetch(USERS_URL + "/user");
  if (!res.ok) throw new Error("Không tải được danh sách tài khoản");
  return res.json();
}

async function updateUserCart(userId, cart) {
  const res = await fetch(USERS_URL + "/user/" + userId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: cart }),
  });
  if (!res.ok) throw new Error("Không cập nhật được giỏ hàng");
  return res.json();
}

// ---------- Sản phẩm (dùng Fetch) ----------

async function getProducts(params) {
  let url = BASE_URL + "/products";
  if (params && typeof params === "object") {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += "?" + qs;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không tải được danh sách sản phẩm");
  return res.json();
}

async function getProductById(id) {
  const res = await fetch(BASE_URL + "/products/" + id);
  if (!res.ok) throw new Error("Không tìm thấy sản phẩm");
  return res.json();
}

async function addProduct(data) {
  const res = await fetch(BASE_URL + "/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Thêm sản phẩm thất bại");
  return res.json();
}

async function updateProduct(id, data) {
  const res = await fetch(BASE_URL + "/products/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại");
  return res.json();
}

async function deleteProduct(id) {
  const res = await fetch(BASE_URL + "/products/" + id, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa sản phẩm thất bại");
  return true;
}

// ---------- Danh mục (dùng jQuery AJAX) ----------

function getCategories() {
  return $.ajax({
    url: BASE_URL + "/categories",
    method: "GET",
    dataType: "json",
  });
}

function addCategory(data) {
  return $.ajax({
    url: BASE_URL + "/categories",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
  });
}

function updateCategory(id, data) {
  return $.ajax({
    url: BASE_URL + "/categories/" + id,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(data),
  });
}

function deleteCategory(id) {
  return $.ajax({
    url: BASE_URL + "/categories/" + id,
    method: "DELETE",
  });
}

// ---------- Đánh giá (Review) - lưu lồng trong từng product ----------
// Schema review trên MockAPI: { reviewerName, rating, comment, approved }
// Review lồng không có id riêng, nên dùng id ảo dạng "<productId>_<index>"
// để định danh khi update / delete. Tất cả hàm trả về thenable (Deferred)
// để các nơi gọi vẫn dùng .done() / .fail() như cũ.

function makeReviewId(productId, index) {
  return productId + "_" + index;
}

function parseReviewId(virtualId) {
  const str = String(virtualId);
  const at = str.lastIndexOf("_");
  if (at < 0) return null;
  const productId = str.substring(0, at);
  const index = parseInt(str.substring(at + 1), 10);
  if (isNaN(index)) return null;
  return { productId: productId, index: index };
}

function flattenReviews(products) {
  const list = [];
  (products || []).forEach((p) => {
    (p.reviews || []).forEach((r, idx) => {
      list.push(
        Object.assign({}, r, {
          id: makeReviewId(p.id, idx),
          productId: p.id,
        })
      );
    });
  });
  return list;
}

function putProductReviews(productId, reviews) {
  return $.ajax({
    url: BASE_URL + "/products/" + productId,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({ reviews: reviews }),
  });
}

function getReviews(params) {
  const dfd = $.Deferred();
  $.ajax({ url: BASE_URL + "/products", method: "GET", dataType: "json" })
    .done(function (products) {
      let list = flattenReviews(products);
      if (params && typeof params.approved === "boolean") {
        list = list.filter((r) => Boolean(r.approved) === params.approved);
      }
      if (params && params.productId) {
        list = list.filter(
          (r) => String(r.productId) === String(params.productId)
        );
      }
      dfd.resolve(list);
    })
    .fail((xhr, status, err) => dfd.reject(xhr, status, err));
  return dfd.promise();
}

function addReview(data) {
  const dfd = $.Deferred();
  if (!data || !data.productId) {
    return dfd.reject(null, "error", "Thiếu productId").promise();
  }
  const productId = data.productId;
  $.ajax({
    url: BASE_URL + "/products/" + productId,
    method: "GET",
    dataType: "json",
  })
    .done(function (product) {
      const reviews = (product.reviews || []).slice();
      const newReview = {
        reviewerName: data.reviewerName || "Ẩn danh",
        rating: Number(data.rating) || 0,
        comment: data.comment || "",
        approved: Boolean(data.approved),
      };
      reviews.push(newReview);
      putProductReviews(productId, reviews)
        .done(() =>
          dfd.resolve(
            Object.assign({}, newReview, {
              id: makeReviewId(productId, reviews.length - 1),
              productId: productId,
            })
          )
        )
        .fail((xhr, s, e) => dfd.reject(xhr, s, e));
    })
    .fail((xhr, s, e) => dfd.reject(xhr, s, e));
  return dfd.promise();
}

function updateReview(id, data) {
  const dfd = $.Deferred();
  const parsed = parseReviewId(id);
  if (!parsed) {
    return dfd.reject(null, "error", "ID review không hợp lệ").promise();
  }
  $.ajax({
    url: BASE_URL + "/products/" + parsed.productId,
    method: "GET",
    dataType: "json",
  })
    .done(function (product) {
      const reviews = (product.reviews || []).slice();
      if (!reviews[parsed.index]) {
        return dfd.reject(null, "notfound", "Không tìm thấy review");
      }
      reviews[parsed.index] = Object.assign({}, reviews[parsed.index], data);
      putProductReviews(parsed.productId, reviews)
        .done(() =>
          dfd.resolve(
            Object.assign({}, reviews[parsed.index], {
              id: id,
              productId: parsed.productId,
            })
          )
        )
        .fail((xhr, s, e) => dfd.reject(xhr, s, e));
    })
    .fail((xhr, s, e) => dfd.reject(xhr, s, e));
  return dfd.promise();
}

function deleteReview(id) {
  const dfd = $.Deferred();
  const parsed = parseReviewId(id);
  if (!parsed) {
    return dfd.reject(null, "error", "ID review không hợp lệ").promise();
  }
  $.ajax({
    url: BASE_URL + "/products/" + parsed.productId,
    method: "GET",
    dataType: "json",
  })
    .done(function (product) {
      const reviews = (product.reviews || []).slice();
      if (!reviews[parsed.index]) {
        return dfd.reject(null, "notfound", "Không tìm thấy review");
      }
      reviews.splice(parsed.index, 1);
      putProductReviews(parsed.productId, reviews)
        .done(() => dfd.resolve(true))
        .fail((xhr, s, e) => dfd.reject(xhr, s, e));
    })
    .fail((xhr, s, e) => dfd.reject(xhr, s, e));
  return dfd.promise();
}
