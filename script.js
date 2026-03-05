const alertBox = document.getElementById("alert");
const form = document.getElementById("product-form");
const refreshBtn = document.getElementById("refresh-btn");
const tableBody = document.getElementById("products-body");
const loading = document.getElementById("loading");
const countEl = document.getElementById("count");
const createBtn = document.getElementById("create-btn");
const titleInput = document.getElementById("title");
const priceInput = document.getElementById("price");
const categorySelect = document.getElementById("category");
const imageInput = document.getElementById("image");
const descriptionInput = document.getElementById("description");

const API = "https://fakestoreapi.com/products";

let products = [];

function showAlert(message, type = "danger") {
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

function clearAlert() {
  alertBox.className = "d-none";
  alertBox.textContent = "";
}

function setLoading(show) {
  loading.classList.toggle("d-none", !show);
}

function disableForm(disabled) {
  Array.from(form.elements).forEach((el) => (el.disabled = disabled));
}

function render() {
  tableBody.innerHTML = "";
  products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.dataset.id = String(p.id);

    const tdImg = document.createElement("td");
    const img = document.createElement("img");
    img.src = p.image || "";
    img.alt = "";
    img.className = "product-thumb";
    tdImg.appendChild(img);

    const tdTitle = document.createElement("td");
    if (p.editing) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = p.title || "";
      input.className = "form-control";
      input.dataset.role = "edit-title";
      tdTitle.appendChild(input);
    } else {
      tdTitle.textContent = p.title;
    }

    const tdPrice = document.createElement("td");
    if (p.editing) {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.01";
      input.min = "0";
      input.value = Number(p.price || 0);
      input.className = "form-control";
      input.dataset.role = "edit-price";
      tdPrice.appendChild(input);
    } else {
      tdPrice.textContent = `$${Number(p.price).toFixed(2)}`;
    }

    const tdCategory = document.createElement("td");
    if (p.editing) {
      const select = document.createElement("select");
      select.className = "form-select";
      ["electronics", "jewelery", "men's clothing", "women's clothing"].forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (p.category === c) opt.selected = true;
        select.appendChild(opt);
      });
      select.dataset.role = "edit-category";
      tdCategory.appendChild(select);
    } else {
      tdCategory.textContent = p.category;
    }

    const tdActions = document.createElement("td");
    const group = document.createElement("div");
    group.className = "btn-group btn-group-sm";
    if (p.editing) {
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn btn-success";
      saveBtn.textContent = "Save";
      saveBtn.dataset.action = "save";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-outline-secondary";
      cancelBtn.textContent = "Cancel";
      cancelBtn.dataset.action = "cancel";
      group.appendChild(saveBtn);
      group.appendChild(cancelBtn);
    } else {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-outline-primary";
      editBtn.textContent = "Edit";
      editBtn.dataset.action = "edit";
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-outline-danger";
      delBtn.textContent = "Delete";
      delBtn.dataset.action = "delete";
      group.appendChild(editBtn);
      group.appendChild(delBtn);
    }
    tdActions.appendChild(group);

    tr.appendChild(tdImg);
    tr.appendChild(tdTitle);
    tr.appendChild(tdPrice);
    tr.appendChild(tdCategory);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
  countEl.textContent = String(products.length);
}

async function fetchProducts() {
  setLoading(true);
  clearAlert();
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    products = Array.isArray(data) ? data.map((d) => ({ ...d, editing: false })) : [];
    render();
  } catch (err) {
    showAlert(String(err.message || err));
  } finally {
    setLoading(false);
  }
}

async function createProduct(payload) {
  disableForm(true);
  clearAlert();
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create product");
    const created = await res.json();
    products.unshift({ ...created, editing: false });
    render();
    form.reset();
  } catch (err) {
    showAlert(String(err.message || err));
  } finally {
    disableForm(false);
  }
}

async function updateProduct(id, payload) {
  clearAlert();
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update product");
    const updated = await res.json();
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      products[idx] = { ...updated, editing: false };
      render();
    }
  } catch (err) {
    showAlert(String(err.message || err));
  }
}

async function deleteProduct(id) {
  clearAlert();
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete product");
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      products.splice(idx, 1);
      render();
    }
  } catch (err) {
    showAlert(String(err.message || err));
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const price = Number(priceInput.value);
  const category = categorySelect.value;
  const image = imageInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title || !category || Number.isNaN(price) || price < 0) {
    showAlert("Enter a valid title, category, and price", "warning");
    return;
  }
  const payload = { title, price, category, description, image };
  createProduct(payload);
});

refreshBtn.addEventListener("click", () => {
  fetchProducts();
});

tableBody.addEventListener("click", (e) => {
  const target = e.target;
  const tr = target.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return;
  const action = target.dataset.action;
  if (action === "edit") {
    products[idx].editing = true;
    render();
  } else if (action === "cancel") {
    products[idx].editing = false;
    render();
  } else if (action === "save") {
    const titleEl = tr.querySelector('[data-role="edit-title"]');
    const priceEl = tr.querySelector('[data-role="edit-price"]');
    const categoryEl = tr.querySelector('[data-role="edit-category"]');
    const title = titleEl ? titleEl.value.trim() : "";
    const price = priceEl ? Number(priceEl.value) : NaN;
    const category = categoryEl ? categoryEl.value : "";
    if (!title || Number.isNaN(price) || price < 0 || !category) {
      showAlert("Enter a valid title, price, and category", "warning");
      return;
    }
    updateProduct(id, { ...products[idx], title, price, category });
  } else if (action === "delete") {
    deleteProduct(id);
  }
});

fetchProducts();
