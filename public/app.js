const API = "/api"

// ─────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────
let appState = {
  activeCatId: null,
  activeCatName: '',
  currentPage: 1,
  totalPages: 1,
  searchQuery: '',
  searchTimer: null,
  sellModalData: null,   // { prod, sellFrom }
  stockModalData: null,  // { prod, addFrom }
};

// ── Pull to Refresh Page (with indicator) ────────────────────────────
const indicator = document.createElement('div');
indicator.className = 'pull-indicator';
indicator.textContent = '↓ Release to refresh';
document.body.appendChild(indicator);

let touchStartY = 0;
let isPulling = false;
const THRESHOLD = 80;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  if (scrollTop > 0) return;

  const pullDistance = e.touches[0].clientY - touchStartY;

  if (pullDistance > 40) {
    indicator.classList.add('visible');
    indicator.textContent = pullDistance >= THRESHOLD ? '↑ Release to refresh' : '↓ Pull to refresh';
    isPulling = pullDistance >= THRESHOLD;
  }
}, { passive: true });

document.addEventListener('touchend', () => {
  indicator.classList.remove('visible');

  if (isPulling) {
    isPulling = false;
    indicator.textContent = 'Refreshing…';
    indicator.classList.add('visible');
    setTimeout(() => window.location.reload(), 300);
  }

  touchStartY = 0;
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindGlobalListeners();
  loadCategories();
});

function bindGlobalListeners() {
  // New category button
  document.getElementById('btnNewCat').addEventListener('click', () => { 
    openModal('modalNewCat') 

    const mainToggleBtnDiv = document.querySelector('.main-toggle-btn-div');
    const mainToggleBtn = document.getElementById('mainToggleBtn');
    const overlay = document.getElementById('overlay');
    const leftNav = document.getElementById('leftNavBar');

    mainToggleBtn.style.display = 'block'
    mainToggleBtnDiv.style.display = 'block'
    overlay.classList.remove('active');
    leftNav.classList.remove('open');
  });

  // Create category confirm
  document.getElementById('btnCreateCat').addEventListener('click', createCategory);
  document.getElementById('newCatName').addEventListener('keydown', e => {
    if (e.key === 'Enter') createCategory();
  });

  // Close modals via data-close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modal on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Add product
  document.getElementById('btnAddProduct').addEventListener('click', () => {
    openModal('modalChooseType');
  });

  // Type choice
  document.getElementById('chooseTypeSingle').addEventListener('click', () => {
    closeModal('modalChooseType');
    openAddSingleModal();
  });
  document.getElementById('chooseTypeMulti').addEventListener('click', () => {
    closeModal('modalChooseType');
    openAddMultiModal();
  });

  // Save product buttons
  document.getElementById('btnSaveSingle').addEventListener('click', saveSingleProduct);
  document.getElementById('btnSaveMulti').addEventListener('click', saveMultiProduct);

  // Sell confirm
  document.getElementById('btnConfirmSell').addEventListener('click', confirmSell);

  // Add stock confirm
  document.getElementById('btnConfirmStock').addEventListener('click', confirmAddStock);

  // Pagination
  document.getElementById('btnPrev').addEventListener('click', () => {
    if (appState.currentPage > 1) { appState.currentPage--; loadProducts(); }
  });
  document.getElementById('btnNext').addEventListener('click', () => {
    if (appState.currentPage < appState.totalPages) { appState.currentPage++; loadProducts(); }
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(appState.searchTimer);
    appState.searchTimer = setTimeout(() => {
      appState.searchQuery = e.target.value.trim();
      appState.currentPage = 1;
      loadProducts();
    }, 300);
  });

  // Category heading edit
  const heading = document.getElementById('catHeading');
  heading.addEventListener('blur', () => {
    const val = heading.textContent.trim();
    if (val && appState.activeCatId) updateCategoryHeading(appState.activeCatId, val);
  });
  heading.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); heading.blur(); }
  });

  // Auto-calc bindings for single
  document.getElementById('singleAutoCalc').addEventListener('change', updateSingleAutoCalc);
  ['sQty', 'sEachCost', 'sEachSell'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (document.getElementById('singleAutoCalc').checked) calcSingleTotals();
    });
  });
  // Auto-calc bindings for multi
  document.getElementById('multiAutoCalc').addEventListener('change', updateMultiAutoCalc);
  ['mUnitQty', 'mUnitEachCost', 'mUnitEachSell', 'mBaseConv'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (document.getElementById('multiAutoCalc').checked) calcMultiTotals();
    });
  });

   // Add first product shortcut
  document.getElementById('btnAddFirst')?.addEventListener('click', () => {
    openModal('modalChooseType');
  });
}

// ──@───────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Server error');
  return data;
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
async function loadCategories() {
  try {
    const { data } = await apiFetch('/categories');
    renderCategoryList(data);
  } catch (e) {
    showToast('Failed to load categories: ' + e.message, 'error');
  }
}

function renderCategoryList(cats) {
  const list = document.getElementById('catList');

  list.innerHTML = ''

  if (!cats.length) {
    list.innerHTML = `<div style="padding:16px;color:rgba(255,255,255,0.2);font-size:12px;text-align:center;font-family:'Geist Mono',monospace;">No inventories yet</div>`;
    return;
  }

  cats.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'cat-item';
    item.dataset.catId = cat.id;
    item.innerHTML = `
      <div class="cat-icon">${cat.name[0].toUpperCase()}</div>
      <div class="cat-item-info">
        <div class="cat-item-name">${escHtml(cat.heading || cat.name)}</div>
        <div class="cat-item-count">${cat.productCount} product${cat.productCount !== 1 ? 's' : ''}</div>
      </div>
      <button class="cat-item-del" data-del-cat="${cat.id}" title="Delete">×</button>
    `;

    const leftNav = document.getElementById('leftNavBar');

    item.addEventListener('click', e => {
      if (e.target.dataset.delCat) return;
      selectCategory(cat.id, cat.heading || cat.name);

      const clickedItem = e.target.closest('.cat-item');

      if (clickedItem) {
        leftNav.classList.remove('open');
      }

      const overlay = document.getElementById('overlay');
      overlay.classList.remove('active');

      // Remove active from all
      const sidebar = document.querySelectorAll('.cat-item')
        .forEach(item => item.classList.remove('active'));

      // Add active to new item
      item.classList.add('active');
    });

    item.querySelector('.cat-item-del').addEventListener('click', e => {
      e.stopPropagation();

        const mainToggleBtnDiv = document.querySelector('.main-toggle-btn-div');
        const mainToggleBtn = document.getElementById('mainToggleBtn');
        const overlay = document.getElementById('overlay');
        const leftNav = document.getElementById('leftNavBar');

        mainToggleBtn.style.display = 'block'
        mainToggleBtnDiv.style.display = 'block'
        overlay.classList.remove('active');
        leftNav.classList.remove('open');

      confirmDelete(cat.id, cat.name);
    });

    // Remove active from all items
    const sidebar = document.querySelectorAll('.cat-item')
      .forEach(item => item.classList.remove('active'));

    // Add active to new item
    item.classList.add('active');

    const welcomeBtn = document.getElementById('welcomeBtn');
    welcomeBtn.textContent = ' Create New Inventory'

    list.prepend(item);
  });
}

async function createCategory() {
  const nameInput = document.getElementById('newCatName');
  const name = nameInput.value.trim();
  if (!name) { showToast('Please enter a category name', 'warn'); nameInput.focus(); return; }
  try {
    const { data } = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    nameInput.value = '';
    closeModal('modalNewCat');
    showToast(`"${data.name}" created!`, 'success');
    await loadCategories();
    selectCategory(data.id, data.heading || data.name);
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteCategory(catId) {
  closeDeleteModal()
  try {
    await apiFetch(`/categories/${catId}`, { method: 'DELETE' });
    showToast('Inventory deleted', 'success');
    if (appState.activeCatId === catId) {
      appState.activeCatId = null;
      document.getElementById('catView').classList.add('hidden');
      document.getElementById('welcomeState').classList.remove('hidden');
    }
    await loadCategories();
  } catch (e) { showToast(e.message, 'error'); }
}

function confirmDelete(catId, name) {
  openModal('deleteModal');

  const delMessage = document.getElementById("deleteMessage")
  delMessage.textContent = `Deleting ${name} inventory and all its products cannot be undone.`

  const btn = document.getElementById("confirmDeleteBtn");

  btn.onclick = () => deleteCategory(catId);
}

function closeDeleteModal() {
  closeModal('deleteModal');
};

async function updateCategoryHeading(catId, heading) {
  try {
    await apiFetch(`/categories/${catId}`, {
      method: 'PATCH',
      body: JSON.stringify({ heading })
    });
    appState.activeCatName = heading;
    console.log(heading)
    await loadCategories();
  } catch (e) { showToast(e.message, 'error'); }
}

function selectCategory(catId, name) {
  appState.activeCatId = catId;
  appState.activeCatName = name;
  appState.currentPage = 1;
  appState.searchQuery = '';

  document.getElementById('welcomeState').classList.add('hidden');
  document.getElementById('catView').classList.remove('hidden');
  document.getElementById('catHeading').textContent = name;
  document.getElementById('searchInput').value = '';

  loadProducts();
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
async function loadProducts() {
  if (!appState.activeCatId) return;
  try {
    const qs = `?page=${appState.currentPage}&limit=5&search=${encodeURIComponent(appState.searchQuery)}`;
    const { data, pagination } = await apiFetch(`/categories/${appState.activeCatId}/products${qs}`);

    appState.totalPages = pagination.totalPages;
    appState.currentPage = pagination.page;

    openModal('skeleton')

    setTimeout(() => {
      closeModal('skeleton');
    }, 2000);

    renderProductTable(data, pagination);
    renderStatusTable(data);
    updateCatMeta(pagination);
    updatePagination(pagination);
    // await loadCategories(); // refresh counts
  } catch (e) { showToast('Failed to load products: ' + e.message, 'error'); }
}

function updateCatMeta(pagination) {
  const meta = document.getElementById('catMeta');
  meta.textContent = `${pagination.total} product${pagination.total !== 1 ? 's' : '' } · Page ${pagination.page} of ${pagination.totalPages}`;
  const badge = document.getElementById('productCount');
  badge.textContent = `${pagination.total} total`;
}

function updatePagination(pagination) {
  const bar = document.getElementById('paginationBar');
  bar.classList.toggle('hidden', pagination.totalPages <= 1);
  document.getElementById('pageInfo').textContent = `Page ${pagination.page} / ${pagination.totalPages}`;
  document.getElementById('btnPrev').disabled = pagination.page <= 1;
  document.getElementById('btnNext').disabled = pagination.page >= pagination.totalPages;
}

function renderProductTable(products, pagination) {
  const tbody = document.getElementById('productTbody');
  const empty = document.getElementById('emptyProducts');
  const table = document.getElementById('productTable');

  if (!products.length) {
    table.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  table.classList.remove('hidden');
  empty.classList.add('hidden');
  tbody.innerHTML = '';

  products.forEach((prod, i) => {
    const globalIdx = (pagination.page - 1) * pagination.limit + i + 1;

    if (prod.type === 'single') {
      tbody.appendChild(buildSingleRow(prod, globalIdx));
    } else {
      tbody.appendChild(buildMultiUnitRow(prod, globalIdx));
      tbody.appendChild(buildMultiBaseRow(prod));
    }
  });
}

function buildSingleRow(p, idx) {
  const tr = document.createElement('tr');
  const status = p.stockStatus;
  const sdCls = status === 'in_stock' ? 'sd-ok' : status === 'low_stock' ? 'sd-low' : 'sd-out';
  const gain = p.totalProfit || 0;
  const gainCls = gain > 0 ? 'profit-pos' : gain < 0 ? 'profit-neg' : 'profit-zero';

  tr.innerHTML = `
    <td><span class="id-pill">${idx}</span></td>
    <td><span class="type-badge type-single">Single</span></td>
    <td class="prod-name">${escHtml(p.productName)}</td>
    <td class="text-muted text-sm">—</td>
    <td>
      <div class="qty-display">
        <span class="status-dot ${sdCls}"></span>
        <span class="mono">${p.quantity}</span>
      </div>
    </td>
    <td class="num">${fmt(p.eachCostPrice)}</td>
    <td class="num">${fmt(p.eachSellingPrice)}</td>
    <td class="num">${fmt(p.totalCostPrice)}</td>
    <td class="num">${fmt(p.totalSellingPrice)}</td>
    <td class="num">${p.totalSold || 0}</td>
    <td class="num ${gainCls}">${gain >= 0 ? '+' : ''}${fmt(gain)}</td>
    <td class="date-text">${fmtDate(p.createdAt)}</td>
    <td>
      <div class="action-cell">
        <button class="btn-action btn-sell" data-action="sell" data-id="${p.id}" data-type="single">Sell</button>
        <button class="btn-action btn-edit" data-action="edit" data-id="${p.id}" data-type="single">Edit</button>
        <button class="btn-action btn-stock" data-action="stock" data-id="${p.id}" data-type="single">+ Stock</button>
        <button class="btn-action btn-hist" data-action="history" data-id="${p.id}" data-type="single">History</button>
        <button class="btn-action btn-del" data-action="delete" data-id="${p.id}">Delete</button>
      </div>
    </td>
  `;
  bindRowActions(tr, p);
  return tr;
}

function buildMultiUnitRow(p, idx) {
  const tr = document.createElement('tr');
  const status = p.stockStatus;
  const sdCls = status === 'in_stock' ? 'sd-ok' : status === 'low_stock' ? 'sd-low' : 'sd-out';
  const gain = p.totalProfit || 0;
  const gainCls = gain > 0 ? 'profit-pos' : gain < 0 ? 'profit-neg' : 'profit-zero';

  tr.innerHTML = `
    <td><span class="id-pill">${idx}</span></td>
    <td><span class="type-badge type-multi-unit">${escHtml(p.unit.name)}</span></td>
    <td class="prod-name">${escHtml(p.productName)}</td>
    <td class="text-sm text-muted">per ${escHtml(p.unit.name)}</td>
    <td>
      <div class="qty-display">
        <span class="status-dot ${sdCls}"></span>
        <span class="mono">${p.unit.quantity} ${escHtml(p.unit.name)}</span>
      </div>
    </td>
    <td class="num">${fmt(p.unit.eachCostPrice)}</td>
    <td class="num">${fmt(p.unit.eachSellingPrice)}</td>
    <td class="num">${fmt(p.unit.totalCostPrice)}</td>
    <td class="num">${fmt(p.unit.totalSellingPrice)}</td>
    <td class="num">${p.unit.totalSold || 0}</td>
    <td class="num ${gainCls}">${gain >= 0 ? '+' : ''}${fmt(gain)}</td>
    <td class="date-text">${fmtDate(p.createdAt)}</td>
    <td>
      <div class="action-cell">
        <button class="btn-action btn-sell" data-action="sell-unit" data-id="${p.id}" data-type="multi">Sell</button>
        <button class="btn-action btn-edit" data-action="edit" data-id="${p.id}" data-type="multi">Edit</button>
        <button class="btn-action btn-stock" data-action="stock-unit" data-id="${p.id}" data-type="multi">+ Stock</button>
        <button class="btn-action btn-hist" data-action="history" data-id="${p.id}" data-type="multi">History</button>
        <button class="btn-action btn-del" data-action="delete" data-id="${p.id}">Delete</button>
      </div>
    </td>
  `;
  bindRowActions(tr, p);
  return tr;
}

function buildMultiBaseRow(p) {
  const tr = document.createElement('tr');
  tr.className = 'base-row';
  tr.innerHTML = `
    <td></td>
    <td><span class="type-badge type-multi-base">${escHtml(p.baseUnit.name)}</span></td>
    <td>
      <div class="sub-name">
        <span class="sub-arrow">↳</span>
        <span>${escHtml(p.baseUnit.name)} (1 ${escHtml(p.unit.name)} = ${p.baseUnit.conversionRate} ${escHtml(p.baseUnit.name)})</span>
      </div>
    </td>
    <td class="text-sm text-muted">per ${escHtml(p.baseUnit.name)}</td>
    <td class="mono">${p.baseUnit.totalQuantity} ${escHtml(p.baseUnit.name)}</td>
    <td class="num">${fmt(p.baseUnit.costPrice)}</td>
    <td class="num">${fmt(p.baseUnit.sellingPrice)}</td>
    <td class="num">—</td>
    <td class="num">—</td>
    <td class="num">${p.baseUnit.totalSold || 0}</td>
    <td class="num text-muted">—</td>
    <td class="date-text">—</td>
    <td>
      <div class="action-cell">
        <button class="btn-action btn-sell" data-action="sell-base" data-id="${p.id}" data-type="multi">Sell</button>
        <button class="btn-action btn-stock" data-action="stock-base" data-id="${p.id}" data-type="multi">+ Stock</button>
      </div>
    </td>
  `;
  bindRowActions(tr, p);
  return tr;
}

function bindRowActions(tr, prod) {
  tr.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'sell') openSellModal(prod, 'single');
      else if (action === 'sell-unit') openSellModal(prod, 'unit');
      else if (action === 'sell-base') openSellModal(prod, 'base');
      else if (action === 'edit') openEditModal(prod);
      else if (action === 'stock') openStockModal(prod, 'single');
      else if (action === 'stock-unit') openStockModal(prod, 'unit');
      else if (action === 'stock-base') openStockModal(prod, 'base');
      else if (action === 'history') openHistoryModal(prod);
      else if (action === 'delete') openDeleteModal(prod);
    });
  });
}

// ─────────────────────────────────────────────
// STATUS TABLE
// ─────────────────────────────────────────────
function renderStatusTable(products) {
  const tbody = document.getElementById('statusTbody');
  tbody.innerHTML = '';
  const section = document.getElementById('statusSection');

  if (!products.length) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');

  products.forEach(p => {
    const tr = document.createElement('tr');
    const status = p.stockStatus;
    const sBadge = status === 'in_stock'
      ? `<span class="status-badge status-ok">● In Stock</span>`
      : status === 'low_stock'
      ? `<span class="status-badge status-low">⚠ Low Stock</span>`
      : `<span class="status-badge status-out">✕ Out of Stock</span>`;

    const stockRemain = p.type === 'single'
      ? `${p.quantity} units`
      : `${p.unit.quantity} ${escHtml(p.unit.name)} / ${p.baseUnit.totalQuantity} ${escHtml(p.baseUnit.name)}`;

    const totalSold = p.type === 'single'
      ? `${p.totalSold || 0}`
      : `${p.unit.totalSold || 0} ${escHtml(p.unit.name)} + ${p.baseUnit.totalSold || 0} ${escHtml(p.baseUnit.name)}`;

    const revenue = p.type === 'single'
      ? fmt(p.totalRevenue || 0)
      : fmt((p.unit.totalRevenue || 0) + (p.baseUnit.totalRevenue || 0));

    const gain = p.totalProfit || 0;
    const gainCls = gain > 0 ? 'profit-pos' : gain < 0 ? 'profit-neg' : 'profit-zero';

    tr.innerHTML = `
      <td class="prod-name">${escHtml(p.productName)}</td>
      <td><span class="type-badge ${p.type === 'single' ? 'type-single' : 'type-multi-unit'}">${p.type}</span></td>
      <td>${sBadge}</td>
      <td class="mono">${stockRemain}</td>
      <td class="mono">${totalSold}</td>
      <td class="mono">${revenue}</td>
      <td class="mono ${gainCls}">${gain >= 0 ? '+' : ''}${fmt(gain)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────────────────────
// ADD/EDIT SINGLE PRODUCT MODAL
// ─────────────────────────────────────────────
function openAddSingleModal() {
  clearForm('formSingle');
  document.getElementById('sProdId').value = '';
  document.getElementById('modalSingleTitle').textContent = 'Add Single Product';
  document.getElementById('singleAutoCalc').checked = true;
  updateSingleAutoCalc();
  openModal('modalSingle');
}

// Open Edit Modal
function openEditModal(prod) {
  if (prod.type === 'single') {
    clearForm('formSingle');
    document.getElementById('sProdId').value = prod.id;
    document.getElementById('modalSingleTitle').textContent = 'Edit Product — ' + prod.productName;
    document.getElementById('sName').value = prod.productName;
    document.getElementById('sPrice').value = prod.price;
    document.getElementById('sQty').value = prod.quantity;
    document.getElementById('sEachCost').value = prod.eachCostPrice;
    document.getElementById('sTotalCost').value = prod.totalCostPrice;
    document.getElementById('sEachSell').value = prod.eachSellingPrice;
    document.getElementById('sTotalSell').value = prod.totalSellingPrice;
    document.getElementById('sLowStock').value = prod.lowStockThreshold;
    document.getElementById('singleAutoCalc').checked = false;
    updateSingleAutoCalc();
    openModal('modalSingle');
  } else {
    document.getElementById('mProdId').value = prod.id;
    document.getElementById('modalMultiTitle').textContent = 'Edit Product — ' + prod.productName;
    document.getElementById('mName').value = prod.productName;
    document.getElementById('mUnitName').value = prod.unit.name;
    document.getElementById('mUnitQty').value = prod.unit.quantity;
    document.getElementById('mUnitEachCost').value = prod.unit.eachCostPrice;
    document.getElementById('mUnitEachSell').value = prod.unit.eachSellingPrice;
    document.getElementById('mUnitTotalCost').value = prod.unit.totalCostPrice;
    document.getElementById('mUnitTotalSell').value = prod.unit.totalSellingPrice;
    document.getElementById('mBaseName').value = prod.baseUnit.name;
    document.getElementById('mBaseConv').value = prod.baseUnit.conversionRate;
    document.getElementById('mBaseTotalQty').value = prod.baseUnit.totalQuantity;
    document.getElementById('mBaseCostPrice').value = prod.baseUnit.costPrice;
    document.getElementById('mBaseSellPrice').value = prod.baseUnit.sellingPrice;
    document.getElementById('mLowStock').value = prod.lowStockThreshold;
    document.getElementById('multiAutoCalc').checked = false;
    updateMultiAutoCalc();
    openModal('modalMulti');
  }
}

function updateSingleAutoCalc() {
  const isAuto = document.getElementById('singleAutoCalc').checked;
  ['sTotalCost', 'sTotalSell'].forEach(id => {
    const inp = document.getElementById(id);
    inp.readOnly = isAuto;
    inp.classList.toggle('auto', isAuto);
    inp.placeholder = isAuto ? 'auto' : '0.00';
  });
  if (isAuto) calcSingleTotals();
}

function calcSingleTotals() {
  const qty = parseFloat(document.getElementById('sQty').value) || 0;
  const eachCost = parseFloat(document.getElementById('sEachCost').value) || 0;
  const eachSell = parseFloat(document.getElementById('sEachSell').value) || 0;
  document.getElementById('sTotalCost').value = (qty * eachCost).toFixed(2);
  document.getElementById('sTotalSell').value = (qty * eachSell).toFixed(2);
  updateSingleSummary(qty, eachCost, eachSell);
}

function updateSingleSummary(qty, eachCost, eachSell) {
  const margin = qty > 0 ? ((eachSell - eachCost) * qty) : 0;
  const summaryEl = document.getElementById('sSummary');
  if (qty > 0 || eachCost > 0 || eachSell > 0) {
    summaryEl.innerHTML = `
      <div class="calc-item"><span class="calc-label">Total Cost</span><span class="calc-val">${fmt(eachCost * qty)}</span></div>
      <div class="calc-item"><span class="calc-label">Total Sell</span><span class="calc-val">${fmt(eachSell * qty)}</span></div>
      <div class="calc-item"><span class="calc-label">Margin/unit</span><span class="calc-val ${(eachSell - eachCost) >= 0 ? 'pos' : 'neg'}">${fmt(eachSell - eachCost)}</span></div>
      <div class="calc-item"><span class="calc-label">Total Margin</span><span class="calc-val ${margin >= 0 ? 'pos' : 'neg'}">${fmt(margin)}</span></div>
    `;
  } else {
    summaryEl.innerHTML = '';
  }
}

async function saveSingleProduct() {
  const prodId = document.getElementById('sProdId').value;
  const isEdit = !!prodId;
  const isAuto = document.getElementById('singleAutoCalc').checked;

  const name = document.getElementById('sName').value.trim();
  if (!name) { showToast('Product name is required', 'warn'); return; }

  const qty = parseFloat(document.getElementById('sQty').value) || 0;
  const eachCost = parseFloat(document.getElementById('sEachCost').value) || 0;
  const eachSell = parseFloat(document.getElementById('sEachSell').value) || 0;

  const payload = {
    productName: name,
    price: parseFloat(document.getElementById('sPrice').value) || 0,
    quantity: qty,
    eachCostPrice: eachCost,
    eachSellingPrice: eachSell,
    totalCostPrice: isAuto ? eachCost * qty : (parseFloat(document.getElementById('sTotalCost').value) || 0),
    totalSellingPrice: isAuto ? eachSell * qty : (parseFloat(document.getElementById('sTotalSell').value) || 0),
    lowStockThreshold: parseInt(document.getElementById('sLowStock').value) || 5,
  };

  try {
    if (isEdit) {
      await apiFetch(`/categories/${appState.activeCatId}/products/${prodId}/single`, {
        method: 'PATCH', body: JSON.stringify(payload)
      });
      showToast('Product updated!', 'success');
    } else {
      await apiFetch(`/categories/${appState.activeCatId}/products/single`, {
        method: 'POST', body: JSON.stringify(payload)
      });

      showToast(`"${name}" added!`, 'success');
    }
    closeModal('modalSingle');
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─────────────────────────────────────────────
// ADD/EDIT MULTI PRODUCT MODAL
// ─────────────────────────────────────────────
function openAddMultiModal() {
  clearForm('formMulti');
  document.getElementById('mProdId').value = '';
  document.getElementById('modalMultiTitle').textContent = 'Add Multi Product';
  document.getElementById('multiAutoCalc').checked = true;
  updateMultiAutoCalc();
  openModal('modalMulti');
}

function updateMultiAutoCalc() {
  const isAuto = document.getElementById('multiAutoCalc').checked;
  ['mUnitTotalCost', 'mUnitTotalSell', 'mBaseTotalQty', 'mBaseCostPrice', 'mBaseSellPrice'].forEach(id => {
    const inp = document.getElementById(id);
    inp.readOnly = isAuto;
    inp.classList.toggle('auto', isAuto);
    inp.placeholder = isAuto ? 'auto' : '0.00';
  });
  if (isAuto) calcMultiTotals();
}

function calcMultiTotals() {
  const uqty = parseFloat(document.getElementById('mUnitQty').value) || 0;
  const ecp = parseFloat(document.getElementById('mUnitEachCost').value) || 0;
  const esp = parseFloat(document.getElementById('mUnitEachSell').value) || 0;
  const conv = parseFloat(document.getElementById('mBaseConv').value) || 1;

  document.getElementById('mUnitTotalCost').value = (uqty * ecp).toFixed(2);
  document.getElementById('mUnitTotalSell').value = (uqty * esp).toFixed(2);
  document.getElementById('mBaseTotalQty').value = (uqty * conv).toFixed(0);
  document.getElementById('mBaseCostPrice').value = conv > 0 ? (ecp / conv).toFixed(4) : '0';
  document.getElementById('mBaseSellPrice').value = conv > 0 ? (esp / conv).toFixed(4) : '0';

  // preview
  const margin = (esp - ecp) * uqty;
  const summaryEl = document.getElementById('mSummary');
  if (uqty > 0 || ecp > 0 || esp > 0) {
    summaryEl.innerHTML = `
      <div class="calc-item"><span class="calc-label">Unit Total Cost</span><span class="calc-val">${fmt(ecp * uqty)}</span></div>
      <div class="calc-item"><span class="calc-label">Unit Total Sell</span><span class="calc-val">${fmt(esp * uqty)}</span></div>
      <div class="calc-item"><span class="calc-label">Total Base Units</span><span class="calc-val">${uqty * conv}</span></div>
      <div class="calc-item"><span class="calc-label">Base Cost Each</span><span class="calc-val">${conv > 0 ? fmt(ecp / conv) : '—'}</span></div>
      <div class="calc-item"><span class="calc-label">Base Sell Each</span><span class="calc-val">${conv > 0 ? fmt(esp / conv) : '—'}</span></div>
      <div class="calc-item"><span class="calc-label">Unit Margin</span><span class="calc-val ${margin >= 0 ? 'pos' : 'neg'}">${fmt(margin)}</span></div>
    `;
  } else { summaryEl.innerHTML = ''; }
}

// ─────────────────────────────────────────────
// ADD/EDIT MULTI PRODUCT MODAL
// ─────────────────────────────────────────────
function openAddMultiModal() {
  clearForm('formMulti');
  document.getElementById('mProdId').value = '';
  document.getElementById('modalMultiTitle').textContent = 'Add Multi Product';
  document.getElementById('multiAutoCalc').checked = true;
  updateMultiAutoCalc();
  openModal('modalMulti');
}

function updateMultiAutoCalc() {
  const isAuto = document.getElementById('multiAutoCalc').checked;
  ['mUnitTotalCost', 'mUnitTotalSell', 'mBaseTotalQty', 'mBaseCostPrice', 'mBaseSellPrice'].forEach(id => {
    const inp = document.getElementById(id);
    inp.readOnly = isAuto;
    inp.classList.toggle('auto', isAuto);
    inp.placeholder = isAuto ? 'auto' : '0.00';
  });
  if (isAuto) calcMultiTotals();
}

function calcMultiTotals() {
  const uqty = parseFloat(document.getElementById('mUnitQty').value) || 0;
  const ecp = parseFloat(document.getElementById('mUnitEachCost').value) || 0;
  const esp = parseFloat(document.getElementById('mUnitEachSell').value) || 0;
  const conv = parseFloat(document.getElementById('mBaseConv').value) || 1;

  document.getElementById('mUnitTotalCost').value = (uqty * ecp).toFixed(2);
  document.getElementById('mUnitTotalSell').value = (uqty * esp).toFixed(2);
  document.getElementById('mBaseTotalQty').value = (uqty * conv).toFixed(0);
  document.getElementById('mBaseCostPrice').value = conv > 0 ? (ecp / conv).toFixed(4) : '0';
  document.getElementById('mBaseSellPrice').value = conv > 0 ? (esp / conv).toFixed(4) : '0';

  // preview
  const margin = (esp - ecp) * uqty;
  const summaryEl = document.getElementById('mSummary');
  if (uqty > 0 || ecp > 0 || esp > 0) {
    summaryEl.innerHTML = `
      <div class="calc-item"><span class="calc-label">Unit Total Cost</span><span class="calc-val">${fmt(ecp * uqty)}</span></div>
      <div class="calc-item"><span class="calc-label">Unit Total Sell</span><span class="calc-val">${fmt(esp * uqty)}</span></div>
      <div class="calc-item"><span class="calc-label">Total Base Units</span><span class="calc-val">${uqty * conv}</span></div>
      <div class="calc-item"><span class="calc-label">Base Cost Each</span><span class="calc-val">${conv > 0 ? fmt(ecp / conv) : '—'}</span></div>
      <div class="calc-item"><span class="calc-label">Base Sell Each</span><span class="calc-val">${conv > 0 ? fmt(esp / conv) : '—'}</span></div>
      <div class="calc-item"><span class="calc-label">Unit Margin</span><span class="calc-val ${margin >= 0 ? 'pos' : 'neg'}">${fmt(margin)}</span></div>
    `;
  } else { summaryEl.innerHTML = ''; }
}

// Save Multi Products
async function saveMultiProduct() {
  const prodId = document.getElementById('mProdId').value;
  const isEdit = !!prodId;
  const isAuto = document.getElementById('multiAutoCalc').checked;

  const name = document.getElementById('mName').value.trim();
  if (!name) { showToast('Product name is required', 'warn'); return; }
  const unitQty = parseFloat(document.getElementById('mUnitQty').value) || 0;
  if (!unitQty) { showToast('Unit quantity is required', 'warn'); return; }

  const ecp = parseFloat(document.getElementById('mUnitEachCost').value) || 0;
  const esp = parseFloat(document.getElementById('mUnitEachSell').value) || 0;
  const conv = parseFloat(document.getElementById('mBaseConv').value) || 1;

  const payload = {
    productName: name,
    lowStockThreshold: parseInt(document.getElementById('mLowStock').value) || 3,
    unit: {
      name: document.getElementById('mUnitName').value.trim() || 'Unit',
      quantity: unitQty,
      eachCostPrice: ecp,
      eachSellingPrice: esp,
      totalCostPrice: isAuto ? ecp * unitQty : (parseFloat(document.getElementById('mUnitTotalCost').value) || 0),
      totalSellingPrice: isAuto ? esp * unitQty : (parseFloat(document.getElementById('mUnitTotalSell').value) || 0),
    },
    baseUnit: {
      name: document.getElementById('mBaseName').value.trim() || 'Base',
      conversionRate: conv,
      totalQuantity: isAuto ? conv * unitQty : (parseFloat(document.getElementById('mBaseTotalQty').value) || 0),
      costPrice: isAuto ? (conv > 0 ? ecp / conv : 0) : (parseFloat(document.getElementById('mBaseCostPrice').value) || 0),
      sellingPrice: isAuto ? (conv > 0 ? esp / conv : 0) : (parseFloat(document.getElementById('mBaseSellPrice').value) || 0),
    }
  };

  try {
    if (isEdit) {
      await apiFetch(`/categories/${appState.activeCatId}/products/${prodId}/multi`, {
        method: 'PATCH', body: JSON.stringify(payload)
      });
      showToast('Product updated!', 'success');
    } else {
      await apiFetch(`/categories/${appState.activeCatId}/products/multi`, {
        method: 'POST', body: JSON.stringify(payload)
      });
      showToast(`"${name}" added!`, 'success');
    }
    closeModal('modalMulti');
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─────────────────────────────────────────────
// SELL MODAL
// ─────────────────────────────────────────────
function openSellModal(prod, sellFrom) {
  appState.sellModalData = { prod, sellFrom };
  document.getElementById('sellModalTitle').textContent = `Sell — ${prod.productName}`;
  renderSellModalBody(prod, sellFrom);
  openModal('modalSell');
}

function renderSellModalBody(prod, sellFrom) {
  const body = document.getElementById('sellModalBody');

  if (prod.type === 'single') {
    const stockInHand = prod.quantity;
    body.innerHTML = `
      <div class="sell-info-card">
        <div class="sic-item"><span class="sic-label">In Stock</span><span class="sic-value">${stockInHand}</span></div>
        <div class="sic-item"><span class="sic-label">Cost Each</span><span class="sic-value">${fmt(prod.eachCostPrice)}</span></div>
        <div class="sic-item"><span class="sic-label">Sell Each</span><span class="sic-value">${fmt(prod.eachSellingPrice)}</span></div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Quantity to Sell</label>
          <input type="number" id="sellQty" value="1" min="1" max="${stockInHand}" />
        </div>
        <div class="form-group">
          <label>Selling Price Each</label>
          <input type="number" id="sellPrice" value="${prod.eachSellingPrice}" min="0" step="0.01" />
        </div>
      </div>
      <div class="gain-preview" id="gainPreview"></div>
    `;
    // bind live preview
    ['sellQty', 'sellPrice'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateSellPreview);
    });
    updateSellPreview();

  } else {
    // Multi product — with tab for unit vs base
    const unitStock = prod.unit.quantity;
    const baseStock = prod.baseUnit.totalQuantity;
    const activeUnitTab = sellFrom === 'base' ? '' : 'active';
    const activeBaseTab = sellFrom === 'base' ? 'active' : '';

    body.innerHTML = `
      <div class="sell-tab-bar">
        <button class="sell-tab ${activeUnitTab}" id="tabUnit" data-from="unit">Sell ${escHtml(prod.unit.name)}</button>
        <button class="sell-tab ${activeBaseTab}" id="tabBase" data-from="base">Sell ${escHtml(prod.baseUnit.name)}</button>
      </div>
      <div id="sellFormContent"></div>
    `;

    document.getElementById('tabUnit').addEventListener('click', () => {
      document.getElementById('tabUnit').classList.add('active');
      document.getElementById('tabBase').classList.remove('active');
      appState.sellModalData.sellFrom = 'unit';
      renderSellFormContent(prod, 'unit');
    });
    document.getElementById('tabBase').addEventListener('click', () => {
      document.getElementById('tabBase').classList.add('active');
      document.getElementById('tabUnit').classList.remove('active');
      appState.sellModalData.sellFrom = 'base';
      renderSellFormContent(prod, 'base');
    });

    renderSellFormContent(prod, sellFrom);
  }
}

function renderSellFormContent(prod, from) {
  const container = document.getElementById('sellFormContent');
  const isUnit = from === 'unit';
  const stockQty = isUnit ? prod.unit.quantity : prod.baseUnit.totalQuantity;
  const unitName = isUnit ? prod.unit.name : prod.baseUnit.name;
  const costPer = isUnit ? prod.unit.eachCostPrice : prod.baseUnit.costPrice;
  const sellPer = isUnit ? prod.unit.eachSellingPrice : prod.baseUnit.sellingPrice;

  container.innerHTML = `
    <div class="sell-info-card">
      <div class="sic-item"><span class="sic-label">In Stock</span><span class="sic-value">${stockQty} ${escHtml(unitName)}</span></div>
      <div class="sic-item"><span class="sic-label">Cost Each</span><span class="sic-value">${fmt(costPer)}</span></div>
      <div class="sic-item"><span class="sic-label">Sell Each</span><span class="sic-value">${fmt(sellPer)}</span></div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Qty to Sell (${escHtml(unitName)})</label>
        <input type="number" id="sellQty" value="1" min="1" max="${stockQty}" />
      </div>
      <div class="form-group">
        <label>Selling Price (per ${escHtml(unitName)})</label>
        <input type="number" id="sellPrice" value="${sellPer}" min="0" step="0.01" />
      </div>
    </div>
    <div class="gain-preview" id="gainPreview"></div>
  `;

  ['sellQty', 'sellPrice'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSellPreview);
  });
  updateSellPreview();
}

function renderSellFormContent(prod, from) {
  const container = document.getElementById('sellFormContent');
  const isUnit = from === 'unit';
  const stockQty = isUnit ? prod.unit.quantity : prod.baseUnit.totalQuantity;
  const unitName = isUnit ? prod.unit.name : prod.baseUnit.name;
  const costPer = isUnit ? prod.unit.eachCostPrice : prod.baseUnit.costPrice;
  const sellPer = isUnit ? prod.unit.eachSellingPrice : prod.baseUnit.sellingPrice;

  container.innerHTML = `
    <div class="sell-info-card">
      <div class="sic-item"><span class="sic-label">In Stock</span><span class="sic-value">${stockQty} ${escHtml(unitName)}</span></div>
      <div class="sic-item"><span class="sic-label">Cost Each</span><span class="sic-value">${fmt(costPer)}</span></div>
      <div class="sic-item"><span class="sic-label">Sell Each</span><span class="sic-value">${fmt(sellPer)}</span></div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Qty to Sell (${escHtml(unitName)})</label>
        <input type="number" id="sellQty" value="1" min="1" max="${stockQty}" />
      </div>
      <div class="form-group">
        <label>Selling Price (per ${escHtml(unitName)})</label>
        <input type="number" id="sellPrice" value="${sellPer}" min="0" step="0.01" />
      </div>
    </div>
    <div class="gain-preview" id="gainPreview"></div>
  `;

  ['sellQty', 'sellPrice'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSellPreview);
  });
  updateSellPreview();
}

function updateSellPreview() {
  const qty = parseFloat(document.getElementById('sellQty')?.value) || 0;
  const price = parseFloat(document.getElementById('sellPrice')?.value) || 0;
  const preview = document.getElementById('gainPreview');
  if (!preview) return;

  const { prod, sellFrom } = appState.sellModalData;
  let costPer;
  if (prod.type === 'single') costPer = prod.eachCostPrice;
  else if (sellFrom === 'unit') costPer = prod.unit.eachCostPrice;
  else costPer = prod.baseUnit.costPrice;

  const revenue = qty * price;
  const cost = qty * costPer;
  const profit = revenue - cost;

  preview.innerHTML = `
    <div class="gp-item"><span class="gp-label">Revenue</span><span class="gp-val gp-neutral">${fmt(revenue)}</span></div>
    <div class="gp-item"><span class="gp-label">Cost</span><span class="gp-val gp-neutral">${fmt(cost)}</span></div>
    <div class="gp-item"><span class="gp-label">${profit >= 0 ? 'Profit' : 'Loss'}</span><span class="gp-val ${profit >= 0 ? 'gp-pos' : 'gp-neg'}">${profit >= 0 ? '+' : ''}${fmt(profit)}</span></div>
  `;
}

async function confirmSell() {
  const { prod, sellFrom } = appState.sellModalData;
  const qty = parseInt(document.getElementById('sellQty')?.value);
  const price = parseFloat(document.getElementById('sellPrice')?.value);

  if (!qty || qty < 1) { showToast('Enter a valid quantity', 'warn'); return; }

  try {
    if (prod.type === 'single') {
      await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}/sell/single`, {
        method: 'POST', body: JSON.stringify({ quantity: qty, sellingPrice: price })
      });
    } else {
      await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}/sell/multi`, {
        method: 'POST', body: JSON.stringify({ sellFrom, quantity: qty, sellingPrice: price })
      });
    }
    showToast(`Sale recorded — ${qty} ${sellFrom === 'base' ? prod.baseUnit?.name : (prod.type === 'multi' ? prod.unit?.name : 'unit')}(s) sold`, 'success');
    closeModal('modalSell');
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─────────────────────────────────────────────
// ADD STOCK MODAL
// ─────────────────────────────────────────────
function openStockModal(prod, addFrom) {
  appState.stockModalData = { prod, addFrom };
  document.getElementById('stockModalTitle').textContent = `Add Stock — ${prod.productName}`;
  renderStockModalBody(prod, addFrom);
  openModal('modalAddStock');
}

function renderStockModalBody(prod, addFrom) {
  const body = document.getElementById('stockModalBody');

  if (prod.type === 'single') {
    body.innerHTML = `
      <div class="sell-info-card" style="grid-template-columns:1fr 1fr">
        <div class="sic-item"><span class="sic-label">Current Stock</span><span class="sic-value">${prod.quantity}</span></div>
        <div class="sic-item"><span class="sic-label">Low Stock Alert</span><span class="sic-value">${prod.lowStockThreshold}</span></div>
      </div>
      <div class="form-grid-2">
        <div class="form-group fg-full">
          <label>Quantity to Add</label>
          <input type="number" id="stockQty" placeholder="e.g. 50" min="1" />
        </div>
        <div class="form-group">
          <label>Update Cost Price Each (optional)</label>
          <input type="number" id="stockEachCost" value="${prod.eachCostPrice}" min="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>Update Sell Price Each (optional)</label>
          <input type="number" id="stockEachSell" value="${prod.eachSellingPrice}" min="0" step="0.01" />
        </div>
      </div>
    `;
  } else {
    const isUnit = addFrom === 'unit';
    const unitName = prod.unit.name;
    const baseName = prod.baseUnit.name;
    const conv = prod.baseUnit.conversionRate;

    body.innerHTML = `
      <div class="sell-tab-bar">
        <button class="sell-tab ${isUnit ? 'active' : ''}" id="stockTabUnit">Add ${escHtml(unitName)}</button>
        <button class="sell-tab ${!isUnit ? 'active' : ''}" id="stockTabBase">Add ${escHtml(baseName)}</button>
      </div>
      <div class="sell-info-card" style="grid-template-columns:1fr 1fr">
        <div class="sic-item"><span class="sic-label">Current ${escHtml(unitName)}</span><span class="sic-value">${prod.unit.quantity}</span></div>
        <div class="sic-item"><span class="sic-label">Current ${escHtml(baseName)}</span><span class="sic-value">${prod.baseUnit.totalQuantity}</span></div>
      </div>
      <div id="stockFormContent"></div>
    `;

    document.getElementById('stockTabUnit').addEventListener('click', () => {
      document.getElementById('stockTabUnit').classList.add('active');
      document.getElementById('stockTabBase').classList.remove('active');
      appState.stockModalData.addFrom = 'unit';
      renderStockFormContent(prod, 'unit');
    });
    document.getElementById('stockTabBase').addEventListener('click', () => {
      document.getElementById('stockTabBase').classList.add('active');
      document.getElementById('stockTabUnit').classList.remove('active');
      appState.stockModalData.addFrom = 'base';
      renderStockFormContent(prod, 'base');
    });
    renderStockFormContent(prod, addFrom);
  }
}

function renderStockFormContent(prod, from) {
  const container = document.getElementById('stockFormContent');
  const isUnit = from === 'unit';
  const unitName = isUnit ? prod.unit.name : prod.baseUnit.name;
  const ecp = isUnit ? prod.unit.eachCostPrice : prod.baseUnit.costPrice;
  const esp = isUnit ? prod.unit.eachSellingPrice : prod.baseUnit.sellingPrice;

  container.innerHTML = `
    <div class="form-grid-2" style="margin-top:14px">
      <div class="form-group fg-full">
        <label>Quantity to Add (${escHtml(unitName)})</label>
        <input type="number" id="stockQty" placeholder="e.g. 10" min="1" />
      </div>
      <div class="form-group">
        <label>Update Cost Price (optional)</label>
        <input type="number" id="stockEachCost" value="${isUnit ? ecp : ecp}" min="0" step="0.0001" placeholder="${fmt(ecp)}" />
      </div>
      <div class="form-group">
        <label>Update Sell Price (optional)</label>
        <input type="number" id="stockEachSell" value="${isUnit ? esp : esp}" min="0" step="0.0001" placeholder="${fmt(esp)}" />
      </div>
    </div>
  `;
}

async function confirmAddStock() {
  const { prod, addFrom } = appState.stockModalData;
  const qty = parseInt(document.getElementById('stockQty')?.value);
  if (!qty || qty < 1) { showToast('Enter a valid quantity', 'warn'); return; }

  const eachCost = parseFloat(document.getElementById('stockEachCost')?.value) || undefined;
  const eachSell = parseFloat(document.getElementById('stockEachSell')?.value) || undefined;

  try {
    if (prod.type === 'single') {
      await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}/addstock/single`, {
        method: 'POST', body: JSON.stringify({ quantity: qty, eachCostPrice: eachCost, eachSellingPrice: eachSell })
      });
    } else {
      const payload = { addFrom, quantity: qty };
      if (addFrom === 'unit') { payload.eachCostPrice = eachCost; payload.eachSellingPrice = eachSell; }
      else { payload.costPrice = eachCost; payload.sellingPrice = eachSell; }
      await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}/addstock/multi`, {
        method: 'POST', body: JSON.stringify(payload)
      });
    }
    showToast(`Stock added: +${qty}`, 'success');
    closeModal('modalAddStock');
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────
function openDeleteModal(prod) {
  openModal('deleteProductModal')

  document.getElementById('deleteProductMessage').textContent = `Delete "${prod.productName}"? All sales history will be lost.`;

  const btn = document.getElementById('confirmDeleteProduct');
  btn.onclick = () => deleteProduct(prod)
}

function closeDeleteProductModal() {
  closeModal('deleteProductModal')
}

async function deleteProduct(prod) {
  closeModal('deleteProductModal')
  try {
    await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}`, { method: 'DELETE' });
    showToast('Product deleted', 'success');
    if (appState.currentPage > 1) appState.currentPage--;
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─────────────────────────────────────────────
// HISTORY MODAL
// ─────────────────────────────────────────────
async function openHistoryModal(prod) {
  document.getElementById('historyModalTitle').textContent = `Sales History — ${prod.productName}`;
  document.getElementById('historyModalBody').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text3)">Loading…</div>`;
  openModal('modalHistory');

  try {
    const { data } = await apiFetch(`/categories/${appState.activeCatId}/products/${prod.id}/history`);
    renderHistoryModal(data, prod);
  } catch (e) {
    document.getElementById('historyModalBody').innerHTML = `<div class="hist-empty">Failed to load history</div>`;
  }
}

function renderHistoryModal(history, prod) {
  const body = document.getElementById('historyModalBody');

  const sales = history.filter(h => h.type === 'sale');
  const totalRevenue = sales.reduce((s, h) => s + (h.revenue || 0), 0);
  const totalProfit = sales.reduce((s, h) => s + (h.profit || 0), 0);
  const totalSold = sales.reduce((s, h) => s + (h.quantity || 0), 0);

  const statsHTML = `
    <div class="history-stats">
      <div class="hs-card">
        <div class="hs-label">Total Sales</div>
        <div class="hs-value">${sales.length}</div>
      </div>
      <div class="hs-card">
        <div class="hs-label">Total Sold</div>
        <div class="hs-value">${totalSold}</div>
      </div>
      <div class="hs-card">
        <div class="hs-label">Revenue</div>
        <div class="hs-value">${fmt(totalRevenue)}</div>
      </div>
      <div class="hs-card">
        <div class="hs-label">Net ${totalProfit >= 0 ? 'Profit' : 'Loss'}</div>
        <div class="hs-value ${totalProfit >= 0 ? 'hs-pos' : 'hs-neg'}">${totalProfit >= 0 ? '+' : ''}${fmt(totalProfit)}</div>
      </div>
    </div>
  `;

  if (!history.length) {
    body.innerHTML = statsHTML + `<div class="hist-empty">No activity recorded yet for this product.</div>`;
    return;
  }

  const histItemsHTML = history.map(h => {
    let typeLabel = '', typeClass = '', detailsHTML = '';

    if (h.type === 'sale') {
      typeClass = 'ht-sale';
      typeLabel = '● Sale';
      const profitSign = (h.profit || 0) >= 0 ? '+' : '';
      detailsHTML = `
        <div class="hb-item"><span class="hb-label">Qty Sold</span><span class="hb-val">${h.quantity} ${h.unitName || ''}</span></div>
        <div class="hb-item"><span class="hb-label">Price Each</span><span class="hb-val">${fmt(h.priceEach)}</span></div>
        <div class="hb-item"><span class="hb-label">Revenue</span><span class="hb-val">${fmt(h.revenue)}</span></div>
        <div class="hb-item"><span class="hb-label">Cost</span><span class="hb-val">${fmt(h.cost)}</span></div>
        <div class="hb-item"><span class="hb-label">${(h.profit || 0) >= 0 ? 'Profit' : 'Loss'}</span><span class="hb-val ${(h.profit || 0) >= 0 ? 'hb-pos' : 'hb-neg'}">${profitSign}${fmt(h.profit)}</span></div>
        ${h.unitQtyAfter !== undefined ? `<div class="hb-item"><span class="hb-label">Stock After</span><span class="hb-val">${h.unitQtyAfter}</span></div>` : ''}
        ${h.baseQtyAfter !== undefined ? `<div class="hb-item"><span class="hb-label">Base After</span><span class="hb-val">${h.baseQtyAfter}</span></div>` : ''}
        ${h.qtyAfter !== undefined ? `<div class="hb-item"><span class="hb-label">Stock After</span><span class="hb-val">${h.qtyAfter}</span></div>` : ''}
      `;
    } else if (h.type === 'restock') {
      typeClass = 'ht-restock';
      typeLabel = '↑ Restock';
      detailsHTML = `<div class="hb-item"><span class="hb-label">Added</span><span class="hb-val">${h.quantity} ${h.addFrom === 'base' ? '' : ''}</span></div>
        <div class="hb-item"><span class="hb-label">Note</span><span class="hb-val">${escHtml(h.note || '')}</span></div>`;
    } else if (h.type === 'edit') {
      typeClass = 'ht-edit';
      typeLabel = '✎ Edit';
      detailsHTML = `<div class="hb-item"><span class="hb-label">Note</span><span class="hb-val">${escHtml(h.note || 'Details updated')}</span></div>`;
    }

    return `
      <div class="hist-item">
        <div class="hist-header">
          <span class="hist-type ${typeClass}">${typeLabel}</span>
          <span class="hist-date">${fmtDate(h.date)}</span>
        </div>
        <div class="hist-body">${detailsHTML}</div>
      </div>
    `;
  }).join('');

  body.innerHTML = statsHTML + `<div class="history-list">${histItemsHTML}</div>`;
}


// MODAL HELPERs
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastTimer;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function fmt(n) {
  const num = parseFloat(n) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('input:not([type=hidden]):not([type=checkbox])').forEach(inp => {
    inp.value = '';
    inp.readOnly = false;
    inp.classList.remove('auto');
  });
  form.querySelectorAll('textarea').forEach(t => t.value = '');
  const summaryIds = ['sSummary', 'mSummary'];
  summaryIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
}