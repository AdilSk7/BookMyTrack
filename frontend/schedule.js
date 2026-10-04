let allTrains = [];
let filteredTrains = [];
let currentPage = 1;
const itemsPerPage = 8;

async function loadTrains() {
  try {
    const res = await fetch(window.API_BASE + '/api/trains');
    if (!res.ok) throw new Error('Failed to fetch trains');
    
    allTrains = await res.json();
    filteredTrains = [...allTrains];
    populateFilters();
    renderTrains();
  } catch (err) {
    console.error(err);
    const tbody = document.getElementById('scheduleTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Error loading schedules. Please try again later.</td></tr>';
    }
  }
}

function renderTrains() {
  const tbody = document.getElementById('scheduleTableBody');
  if (!tbody) return;

  tbody.innerHTML = ''; 

  if (filteredTrains.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">No trains found.</td></tr>';
    renderPagination();
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTrains.length);
  const pageItems = filteredTrains.slice(startIndex, endIndex);

  pageItems.forEach(train => {
    let statusClass = train.status.toLowerCase().includes('delayed') ? 'delayed' : 'on-time';
    let statusHtml = `<div class="status-pill ${statusClass}"><span class="dot"></span> ${train.status}</div>`;
    
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${train.trainNo}</td>
      <td>${train.trainName}</td>
      <td>${train.from}</td>
      <td>${train.to}</td>
      <td style="font-weight:bold;">${train.departure}</td>
      <td style="font-weight:bold;">${train.arrival}</td>
      <td>${statusHtml}</td>
      <td><a href="reservation.html?from=${encodeURIComponent(train.from)}&to=${encodeURIComponent(train.to)}" class="book-btn">Book</a></td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination();
}

function renderPagination() {
  const container = document.getElementById('paginationControls');
  if (!container) return;
  container.innerHTML = '';
  
  const totalPages = Math.ceil(filteredTrains.length / itemsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = 'Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderTrains(); };
  container.appendChild(prevBtn);

  const info = document.createElement('span');
  info.innerText = `Page ${currentPage} of ${totalPages}`;
  container.appendChild(info);

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderTrains(); };
  container.appendChild(nextBtn);
}

function filterSchedule() {
  const searchInput = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : "").toUpperCase();
  const fromFilter = (document.getElementById('fromFilter') ? document.getElementById('fromFilter').value : "").toUpperCase();
  const toFilter = (document.getElementById('toFilter') ? document.getElementById('toFilter').value : "").toUpperCase();

  filteredTrains = allTrains.filter(train => {
    const txtTrainNo = (train.trainNo || "").toString().toUpperCase();
    const txtTrainName = (train.trainName || "").toUpperCase();
    const txtFrom = (train.from || "").toUpperCase();
    const txtTo = (train.to || "").toUpperCase();

    const matchSearch = txtTrainNo.includes(searchInput) || txtTrainName.includes(searchInput);
    const matchFrom = fromFilter === "" || txtFrom === fromFilter;
    const matchTo = toFilter === "" || txtTo === toFilter;

    return matchSearch && matchFrom && matchTo;
  });

  currentPage = 1;
  renderTrains();
}

function populateFilters() {
  const fromSet = new Set();
  const toSet = new Set();
  
  allTrains.forEach(t => {
    if(t.from) fromSet.add(t.from);
    if(t.to) toSet.add(t.to);
  });
  
  const fromSelect = document.getElementById('fromFilter');
  const toSelect = document.getElementById('toFilter');
  
  if (fromSelect && toSelect) {
    fromSelect.innerHTML = '<option value="">From Station</option>';
    toSelect.innerHTML = '<option value="">To Station</option>';
    
    Array.from(fromSet).sort().forEach(st => {
      fromSelect.innerHTML += `<option value="${st.toUpperCase()}">${st}</option>`;
    });
    
    Array.from(toSet).sort().forEach(st => {
      toSelect.innerHTML += `<option value="${st.toUpperCase()}">${st}</option>`;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTrains();
    
    // Dynamically inject layout date to match mockup
    const dateEl = document.getElementById('schDateDisplay');
    if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
        dateEl.innerHTML = `<span>${new Date().toLocaleDateString('en-GB', options)}</span> <i class="far fa-calendar-alt"></i>`;
    }
});
