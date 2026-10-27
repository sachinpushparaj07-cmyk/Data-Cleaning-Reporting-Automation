/**
 * Data Cleaning & Reporting Automation Suite Logic
 * Interactive cohort slicers, visual reporting charts, audit trail cards, and Excel/CSV exporter
 */

let reportData = null;
let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
const pageSize = 10;
let sortCol = 'Amount';
let sortAsc = false;

// Chart Instances
let categoryChartInstance = null;
let cityChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupListeners();
  await loadPipelineReport();
});

async function loadPipelineReport() {
  try {
    const res = await fetch('cleaning_report.json');
    reportData = await res.json();
    allRecords = reportData.cleanedRecords;

    populateAuditTrail(reportData.summary.auditTrail);
    populateSlicers(allRecords);
    updateExecutiveKPIs(reportData.summary);
    applySlicers();
    renderCharts();
    showToast(`Cleaned & loaded ${allRecords.length} production-grade records`);
  } catch (err) {
    console.error('Failed to load cleaning report:', err);
    showToast('Failed to load report data', true);
  }
}

function updateExecutiveKPIs(summary) {
  document.getElementById('kpi-clean-count').textContent = summary.finalRows.toLocaleString();
  document.getElementById('kpi-dups-removed').textContent = `${summary.duplicatesRemoved} Duplicates Purged`;
  document.getElementById('kpi-missing-count').textContent = summary.missingValuesHandled.toLocaleString();
  document.getElementById('kpi-total-revenue').textContent = '$' + (summary.totalCleanedRevenue / 1000).toFixed(1) + 'k';
  document.getElementById('kpi-health-score').textContent = `${summary.rawHealthScore}% → 100%`;
  document.getElementById('health-score-val').textContent = '100.0%';
}

function populateAuditTrail(trail) {
  const container = document.getElementById('audit-trail-container');
  container.innerHTML = '';

  trail.forEach(step => {
    const card = document.createElement('div');
    card.className = 'audit-card';
    card.innerHTML = `
      <div class="audit-title">
        <span>${step.step}</span>
        <span class="severity-pill sev-${step.severity}">${step.severity}</span>
      </div>
      <p class="audit-desc">${step.action}</p>
      <div class="audit-rows"><i class="fa-solid fa-arrows-spin"></i> ${step.affectedRows.toLocaleString()} rows affected</div>
    `;
    container.appendChild(card);
  });
}

function populateSlicers(records) {
  const categories = [...new Set(records.map(r => r.Category))].sort();
  const cities = [...new Set(records.map(r => r.City))].sort();
  const payments = [...new Set(records.map(r => r.PaymentMethod))].sort();

  const catSelect = document.getElementById('category-slicer');
  const citySelect = document.getElementById('city-slicer');
  const paySelect = document.getElementById('payment-slicer');

  categories.forEach(c => catSelect.add(new Option(c, c)));
  cities.forEach(ci => citySelect.add(new Option(ci, ci)));
  payments.forEach(p => paySelect.add(new Option(p, p)));
}

function applySlicers() {
  const category = document.getElementById('category-slicer').value;
  const city = document.getElementById('city-slicer').value;
  const payment = document.getElementById('payment-slicer').value;
  const search = document.getElementById('global-search').value.toLowerCase().trim();

  filteredRecords = allRecords.filter(r => {
    if (category !== 'all' && r.Category !== category) return false;
    if (city !== 'all' && r.City !== city) return false;
    if (payment !== 'all' && r.PaymentMethod !== payment) return false;

    if (search) {
      const match = r.TransactionID.toLowerCase().includes(search) ||
                    r.CustomerName.toLowerCase().includes(search) ||
                    r.Email.toLowerCase().includes(search) ||
                    r.City.toLowerCase().includes(search) ||
                    r.Category.toLowerCase().includes(search);
      if (!match) return false;
    }
    return true;
  });

  sortRecords();
  currentPage = 1;
  renderTable();
  updateDynamicCharts();

  document.getElementById('sidebar-record-count').textContent = 
    `${filteredRecords.length.toLocaleString()} Filtered Records`;
}

function sortRecords() {
  filteredRecords.sort((a, b) => {
    let vA = a[sortCol];
    let vB = b[sortCol];
    if (typeof vA === 'string') {
      vA = vA.toLowerCase();
      vB = vB.toLowerCase();
    }
    if (vA < vB) return sortAsc ? -1 : 1;
    if (vA > vB) return sortAsc ? 1 : -1;
    return 0;
  });
}

function renderCharts() {
  renderCategoryVisual();
  renderCityVisual();
}

function updateDynamicCharts() {
  renderCategoryVisual();
  renderCityVisual();
}

function renderCategoryVisual() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const catRev = {};
  filteredRecords.forEach(r => {
    catRev[r.Category] = (catRev[r.Category] || 0) + r.Amount;
  });

  const labels = Object.keys(catRev);
  const values = Object.values(catRev);

  if (categoryChartInstance) categoryChartInstance.destroy();

  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Harmonized Revenue',
        data: values,
        backgroundColor: ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` Revenue: $${Number(ctx.raw).toLocaleString()}` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, callback: v => '$' + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  });
}

function renderCityVisual() {
  const ctx = document.getElementById('cityChart').getContext('2d');
  const cityCounts = {};
  filteredRecords.forEach(r => {
    cityCounts[r.City] = (cityCounts[r.City] || 0) + 1;
  });

  const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(s => s[0]);
  const values = sorted.map(s => s[1]);

  if (cityChartInstance) cityChartInstance.destroy();

  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  cityChartInstance = new Chart(ctx, {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: labels,
      datasets: [{
        label: 'Orders',
        data: values,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });
}

function renderTable() {
  const tbody = document.getElementById('cleaned-table-body');
  tbody.innerHTML = '';

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filteredRecords.slice(startIdx, startIdx + pageSize);

  pageItems.forEach(r => {
    const tr = document.createElement('tr');
    let catClass = 'cat-elec';
    if (r.Category.includes('Fashion')) catClass = 'cat-fash';
    else if (r.Category.includes('Home')) catClass = 'cat-home';
    else if (r.Category.includes('Beauty')) catClass = 'cat-beau';

    tr.innerHTML = `
      <td><strong>${r.TransactionID}</strong></td>
      <td>${r.Date}</td>
      <td>${r.CustomerName}</td>
      <td class="text-dim">${r.Email}</td>
      <td class="text-dim">${r.Phone}</td>
      <td>${r.City}</td>
      <td><span class="cat-pill ${catClass}">${r.Category}</span></td>
      <td>${r.PaymentMethod}</td>
      <td class="align-right">${r.Quantity}</td>
      <td class="align-right font-medium text-emerald">$${Number(r.Amount).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('table-record-info').textContent = 
    `Showing ${filteredRecords.length > 0 ? startIdx + 1 : 0} - ${Math.min(startIdx + pageSize, filteredRecords.length)} of ${filteredRecords.length} production rows`;
  document.getElementById('page-display').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prev-page-btn').disabled = currentPage === 1;
  document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
}

function setupListeners() {
  document.getElementById('category-slicer').addEventListener('change', applySlicers);
  document.getElementById('city-slicer').addEventListener('change', applySlicers);
  document.getElementById('payment-slicer').addEventListener('change', applySlicers);
  document.getElementById('global-search').addEventListener('input', applySlicers);

  document.getElementById('reset-filters-btn').addEventListener('click', () => {
    document.getElementById('category-slicer').value = 'all';
    document.getElementById('city-slicer').value = 'all';
    document.getElementById('payment-slicer').value = 'all';
    document.getElementById('global-search').value = '';
    applySlicers();
    showToast('Filters reset to default');
  });

  document.getElementById('prev-page-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById('next-page-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // Table Sorting
  document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = false;
      }
      sortRecords();
      renderTable();
    });
  });

  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.querySelector('#theme-toggle i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    renderCharts();
  });

  // Export Cleaned Dataset to Excel
  document.getElementById('export-cleaned-btn').addEventListener('click', () => {
    if (!filteredRecords.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cleaned_Production_Data');
    XLSX.writeFile(wb, 'Cleaned_Data_Report.xlsx');
    showToast('Cleaned dataset exported to Excel');
  });

  // Export Audit Trail to CSV
  document.getElementById('export-audit-btn').addEventListener('click', () => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData.summary.auditTrail);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pipeline_Audit_Trail');
    XLSX.writeFile(wb, 'Pipeline_Cleaning_Audit_Log.xlsx');
    showToast('Pipeline audit trail exported');
  });
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toast-text');
  txt.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
