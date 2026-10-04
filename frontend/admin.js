/* ==========================
   BookMyTrack – Admin Panel
   Frontend Script (admin.js)
============================= */

const API_BASE = "https://bookmytrack-backend.onrender.com/api/admin";
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "'Inter', sans-serif";

/* --------------------------
     TOKEN CHECK (GUARD)
--------------------------- */
const token = localStorage.getItem("admin_token");
if (!token) {
    window.location.replace("admin-login.html");
} else {
    document.body.style.display = "block";
}

// Anti-Bfcache: If browser loads from history (back button), immediately eject if no token.
window.addEventListener('pageshow', (e) => {
    if (e.persisted || !localStorage.getItem("admin_token")) {
        document.body.style.display = "none";
        window.location.replace("admin-login.html");
    }
});

/* --------------------------
      TAB SWITCHING
--------------------------- */
const navItems = document.querySelectorAll('.nav-menu li[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        item.classList.add('active');
        document.getElementById(item.dataset.tab).classList.add('active');
    });
});

/* --------------------------
     DATE & TIME
--------------------------- */
function updateDateTime() {
    const now = new Date();
    document.getElementById("current-date").textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById("current-time").textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

/* Reusable fetch */
async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("admin_token");
            window.location.replace("admin-login.html");
        }
        throw new Error("Failed: " + res.status);
    }
    return res.json();
}

/* --------------------------
       DASHBOARD DATAS
--------------------------- */
let statusChartObj, ageChartObj;
let globalReservations = [];

async function loadDashboard() {
    try {
        const stats = await fetchJSON(`${API_BASE}/stats`);
        document.getElementById("stat-total").textContent = stats.total ?? 0;
        document.getElementById("stat-active").textContent = stats.active ?? 0;
        document.getElementById("stat-cancelled").textContent = stats.cancelled ?? 0;
        document.getElementById("stat-users").textContent = stats.totalUsers ?? 0;

        globalReservations = await fetchJSON(`${API_BASE}/reservations`);
        renderReservationsTab(globalReservations);
        buildChartsFromReservations(globalReservations);
        buildExtendedAnalytics(globalReservations);

    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// Chart.js Aggregations
function buildChartsFromReservations(reservations) {
    let active = 0, cancelled = 0;

    // Top Routes tracker: "From -> To": count
    const routesMap = {};

    // Ages
    const ageGroups = { '0-18': 0, '19-30': 0, '31-50': 0, '50+': 0 };

    reservations.forEach(r => {
        if (r.status === 'Cancelled') cancelled++; else active++;

        const routeKey = `${r.from} -> ${r.to}`;
        routesMap[routeKey] = (routesMap[routeKey] || 0) + 1;

        r.passengers.forEach(p => {
            const a = p.age;
            if (a <= 18) ageGroups['0-18']++;
            else if (a <= 30) ageGroups['19-30']++;
            else if (a <= 50) ageGroups['31-50']++;
            else ageGroups['50+']++;
        });
    });

    // 1. Status Donut
    if (statusChartObj) statusChartObj.destroy();
    const totalStatus = active + cancelled;
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChartObj = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Cancelled'],
            datasets: [{ data: [active, cancelled], backgroundColor: ['#2f81f7', '#f85149'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: { cutout: '75%', plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
    // Custom Legend
    document.getElementById('status-legend').innerHTML = `
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:#2f81f7"></span>Active</div><div class="legend-val">${active} <span>(${(active / totalStatus * 100 || 0).toFixed(1)}%)</span></div></div>
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:#f85149"></span>Cancelled</div><div class="legend-val">${cancelled} <span>(${(cancelled / totalStatus * 100 || 0).toFixed(1)}%)</span></div></div>
    `;

    // 2. Age Donut
    if (ageChartObj) ageChartObj.destroy();
    const agesArr = [ageGroups['0-18'], ageGroups['19-30'], ageGroups['31-50'], ageGroups['50+']];
    const totalAge = agesArr.reduce((a, b) => a + b, 0);
    const ageColors = ['#00ffae', '#2f81f7', '#f1c40f', '#a371f7'];
    const ctxAge = document.getElementById('ageChart').getContext('2d');
    ageChartObj = new Chart(ctxAge, {
        type: 'doughnut',
        data: {
            labels: ['0 - 18', '19 - 30', '31 - 50', '50+'],
            datasets: [{ data: agesArr, backgroundColor: ageColors, borderWidth: 0, hoverOffset: 4 }]
        },
        options: { cutout: '75%', plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
    // Age Custom Legend
    document.getElementById('age-legend').innerHTML = `
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:${ageColors[0]}"></span>0 - 18</div><div class="legend-val">${agesArr[0]} <span>(${(agesArr[0] / totalAge * 100 || 0).toFixed(1)}%)</span></div></div>
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:${ageColors[1]}"></span>19 - 30</div><div class="legend-val">${agesArr[1]} <span>(${(agesArr[1] / totalAge * 100 || 0).toFixed(1)}%)</span></div></div>
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:${ageColors[2]}"></span>31 - 50</div><div class="legend-val">${agesArr[2]} <span>(${(agesArr[2] / totalAge * 100 || 0).toFixed(1)}%)</span></div></div>
        <div class="legend-item"><div class="legend-label"><span class="dot" style="background:${ageColors[3]}"></span>50+</div><div class="legend-val">${agesArr[3]} <span>(${(agesArr[3] / totalAge * 100 || 0).toFixed(1)}%)</span></div></div>
    `;

    // 3. Top Routes List
    const sortedRoutes = Object.entries(routesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let maxRoute = sortedRoutes.length ? sortedRoutes[0][1] : 1;
    let routesHtml = '';
    sortedRoutes.forEach(([r, count]) => {
        const perc = (count / maxRoute) * 100;
        routesHtml += `
            <div class="route-row">
              <div class="route-name" title="${r}">${r}</div>
              <div class="route-bar-wrapper"><div class="route-bar-fill" style="width: ${perc}%"></div></div>
              <div class="route-count">${count}</div>
            </div>
        `;
    });
    document.getElementById('route-bars-container').innerHTML = routesHtml;
}


/* --------------------------
    RESERVATIONS TABLE
--------------------------- */
let currentFilteredRows = [];
let resCurrentPage = 1;
const resRowsPerPage = 15;

function renderReservationsTab(list) {
    currentFilteredRows = [];

    // Flatten rows since one reservation can have multiple passengers
    list.forEach(item => {
        item.passengers.forEach((p, pIndex) => {
            currentFilteredRows.push({ item, p, pIndex });
        });
    });

    resCurrentPage = 1;
    drawReservationsPage();
}

function drawReservationsPage() {
    const tbody = document.getElementById("reservations-body");
    tbody.innerHTML = "";

    const totalRows = currentFilteredRows.length;
    if (!totalRows) {
        document.getElementById("entries-info").textContent = `Showing 0 entries`;
        tbody.innerHTML = `<tr><td colspan="12" class="empty">No records found.</td></tr>`;
        document.getElementById("res-pagination").innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalRows / resRowsPerPage);
    if (resCurrentPage > totalPages) resCurrentPage = totalPages;
    if (resCurrentPage < 1) resCurrentPage = 1;

    const start = (resCurrentPage - 1) * resRowsPerPage;
    const end = Math.min(start + resRowsPerPage, totalRows);

    document.getElementById("entries-info").textContent = `Showing ${start + 1} to ${end} of ${totalRows} entries`;

    const pageRows = currentFilteredRows.slice(start, end);

    pageRows.forEach(rowObj => {
        const item = rowObj.item;
        const p = rowObj.p;
        let statusPill = `<span class="status-pill pending">Pending</span>`;
        if (item.status === 'Paid') statusPill = `<span class="status-pill paid">Paid</span>`;
        else if (item.status === 'Cancelled') statusPill = `<span class="status-pill cancelled">Cancelled</span>`;

        const row = `
            <tr>
                <td>${item.pnr}</td>
                <td>${statusPill}</td>
                <td><span style="font-weight:600; color:var(--text-primary); white-space:nowrap;">${item.trainName || item.trainNo || 'Unknown Train'}</span></td>
                <td>${item.from.split(' ')[0]}</td>
                <td>${item.to.split(' ')[0]}</td>
                <td>${new Date(item.journeyDate).toLocaleDateString('en-GB')}</td>
                <td><span style="font-size:12px; font-weight:600; color:var(--accent-purple);">${item.userId && item.userId.name ? item.userId.name : (typeof item.userId === 'string' ? item.userId : 'Unknown')}</span></td>
                <td>${p.name}</td>
                <td>${p.age}</td>
                <td>${p.gender}</td>
                <td>${p.berthAllocated || "-"}</td>
                <td>${p.coach ? p.coach + '/' + p.seatLabel : "-"}</td>
                <td>
                  <div class="action-btns">
                    <button class="action-btn" onclick="openResViewModal('${item._id}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-btn" onclick="openResEditModal('${item._id}', ${rowObj.pIndex})"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteReservation('${item._id}', '${item.pnr}')"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    let pagHtml = `<button onclick="changeResPage(${resCurrentPage - 1})" ${resCurrentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

    for (let i = 1; i <= totalPages; i++) {
        // Show first, last, and +/- 2 from current page
        if (i === 1 || i === totalPages || (i >= resCurrentPage - 2 && i <= resCurrentPage + 2)) {
            pagHtml += `<button class="${i === resCurrentPage ? 'active' : ''}" onclick="changeResPage(${i})">${i}</button>`;
        } else if (i === resCurrentPage - 3 || i === resCurrentPage + 3) {
            pagHtml += `<button disabled>...</button>`;
        }
    }

    pagHtml += `<button onclick="changeResPage(${resCurrentPage + 1})" ${resCurrentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;
    document.getElementById("res-pagination").innerHTML = pagHtml;
}

window.changeResPage = (page) => {
    resCurrentPage = page;
    drawReservationsPage();
}

window.deleteReservation = async (id, pnr) => {
    if (!confirm(`WARNING: Are you extremely sure you want to permanently delete PNR ${pnr}?\nThis instantly wipes it from the system and disappears from the user's booking history.`)) return;
    try {
        const res = await fetch(`${API_BASE}/reservations/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
            loadDashboard(); // Reload reservations and charts
        } else {
            alert('Failed to delete reservation');
        }
    } catch (err) { console.error('Delete res err', err); }
}

/* --------------------------
       FEEDBACK HUB
--------------------------- */
async function loadFeedbacks() {
    try {
        const data = await fetchJSON(`${API_BASE}/feedback`);
        const tbody = document.getElementById("feedback-body");
        tbody.innerHTML = "";
        if (!data.length) return tbody.innerHTML = `<tr><td colspan="4" class="empty">No feedback yet.</td></tr>`;

        data.forEach(fb => {
            tbody.innerHTML += `
               <tr>
                 <td style="white-space:nowrap">${new Date(fb.createdAt).toLocaleDateString()}</td>
                 <td style="font-weight:600">${fb.name}</td>
                 <td>${fb.email}</td>
                 <td>${fb.message}</td>
                 <td>
                   <button class="action-btn" onclick="deleteFeedback('${fb._id}')" title="Delete Feedback">
                     <i class="fa-solid fa-trash"></i>
                   </button>
                 </td>
               </tr>
            `;
        });
    } catch (err) { console.error('Feedback err', err); }
}

window.deleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
        const res = await fetch(`${API_BASE}/feedback/${id}`, { method: 'DELETE', headers: { "Authorization": "Bearer " + token } });
        if (res.ok) {
            loadFeedbacks();
        } else {
            alert('Failed to delete feedback');
        }
    } catch (err) { console.error('Delete feedback err', err); }
}

/* --------------------------
       CONTACT HUB
--------------------------- */
async function loadContacts() {
    try {
        const data = await fetchJSON(`${API_BASE}/contact`);
        const tbody = document.getElementById("contact-body");
        tbody.innerHTML = "";
        if (!data.length) return tbody.innerHTML = `<tr><td colspan="5" class="empty">No contact queries yet.</td></tr>`;

        data.forEach(c => {
            tbody.innerHTML += `
               <tr>
                 <td style="white-space:nowrap">${new Date(c.createdAt).toLocaleDateString()}</td>
                 <td style="font-weight:600">${c.name}</td>
                 <td>${c.email}</td>
                 <td>${c.query}</td>
                 <td>
                   ${c.reply
                    ? `<span class="status-pill paid" style="font-size:11px"><i class="fa-solid fa-check"></i> Answered</span>`
                    : `<button class="action-btn" onclick="openReplyModal('${c._id}', \`${c.query.replace(/[`$\\]/g, '\\$&')}\`)" title="Reply Inbox"><i class="fa-solid fa-reply"></i></button>`
                }
                 </td>
               </tr>
            `;
        });
    } catch (err) { console.error('Contact err', err); }
}

let answeringContactId = null;
window.openReplyModal = (id, query) => {
    answeringContactId = id;
    document.getElementById('r-queryText').innerText = query;
    document.getElementById('r-replyText').value = '';
    document.getElementById('reply-modal').style.display = 'flex';
}
window.submitContactReply = async () => {
    const text = document.getElementById('r-replyText').value.trim();
    if (!text) return alert("Please type a response first.");
    try {
        const res = await fetch(`${API_BASE}/contact/${answeringContactId}/reply`, {
            method: 'PUT',
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ reply: text })
        });
        if (res.ok) {
            document.getElementById('reply-modal').style.display = 'none';
            loadContacts();
        } else {
            alert("Failed to submit reply");
        }
    } catch (err) { console.error(err); }
}

/* --------------------------
       USERS HUB
--------------------------- */
async function loadUsers() {
    try {
        const data = await fetchJSON(`${API_BASE}/users`);
        const tbody = document.getElementById("users-body");
        tbody.innerHTML = "";
        if (!data.length) return tbody.innerHTML = `<tr><td colspan="6" class="empty">No users found.</td></tr>`;

        data.forEach(u => {
            tbody.innerHTML += `
               <tr>
                 <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                 <td style="font-weight:600">${u.name}</td>
                 <td>${u.email}</td>
                 <td>${u.age || '-'}</td>
                 <td>${u.gender || '-'}</td>
                 <td>
                    <button class="action-btn" onclick="alert('User ID: ${u._id}')"><i class="fa-solid fa-eye"></i></button>
                    ${u.role !== 'admin' ? `<button class="action-btn delete" onclick="deleteUser('${u._id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                 </td>
               </tr>
            `;
        });
    } catch (err) { console.error('Users err', err); }
}

async function deleteUser(id) {
    if (!confirm("Are you sure you want to permanently delete this user? Their login access will be revoked immediately.")) return;
    try {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (data.success) {
            loadUsers(); // Refresh table
            loadDashboard(); // Refresh stats widget cache
        } else {
            alert(data.error || "Failed to delete user");
        }
    } catch (err) {
        console.error("Delete user error", err);
        alert("An error occurred");
    }
}

/* --------------------------
       TRAINS HUB
--------------------------- */
async function loadTrains() {
    try {
        const data = await fetchJSON(`${API_BASE}/trains`);
        const tbody = document.getElementById("trains-body");
        tbody.innerHTML = "";
        if (!data.length) return tbody.innerHTML = `<tr><td colspan="6" class="empty">No trains found.</td></tr>`;

        data.forEach(t => {
            let statusBadge = `<span class="status-pill pending">${t.status}</span>`;
            if (t.status === 'On Time') statusBadge = `<span class="status-pill paid">On Time</span>`;
            else if (t.status === 'Cancelled') statusBadge = `<span class="status-pill cancelled">Cancelled</span>`;

            tbody.innerHTML += `
               <tr>
                 <td style="font-family:monospace">${t.trainNo}</td>
                 <td style="font-weight:600">
                    ${t.trainName}<br>
                    <span style="font-size:11px; font-weight:normal; color:var(--text-secondary);">
                        ${(t.classes || []).length > 0 ? t.classes.map(c => `${c} (₹${t.classFares?.[c] || t.baseFare})`).join(', ') : 'No classes assigned'}
                    </span>
                 </td>
                 <td>${t.from} <i class="fa-solid fa-arrow-right" style="font-size:10px;color:gray;margin:0 4px"></i> ${t.to}</td>
                 <td style="white-space:nowrap">${t.departure || '-'} - ${t.arrival || '-'}</td>
                 <td>₹${t.baseFare}</td>
                 <td>${statusBadge}</td>
                 <td>
                    <button class="action-btn" onclick='openEditTrain(${JSON.stringify(t)})'><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteTrain('${t._id}')"><i class="fa-solid fa-trash"></i></button>
                 </td>
               </tr>
            `;
        });
    } catch (err) { console.error('Trains err', err); }
}

async function deleteTrain(id) {
    if (!confirm('Are you sure you want to delete this train?')) return;
    try {
        const res = await fetch(`${API_BASE}/trains/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) loadTrains();
    } catch (err) { console.error('Delete train err', err); }
}

let editingTrainId = null;

window.openAddTrain = () => {
    editingTrainId = null;
    document.getElementById('train-modal-title').innerText = 'Add New Train';
    document.getElementById('m-trainNo').value = '';
    document.getElementById('m-trainName').value = '';
    document.getElementById('m-from').value = '';
    document.getElementById('m-to').value = '';
    document.getElementById('m-departure').value = '';
    document.getElementById('m-arrival').value = '';
    document.getElementById('m-baseFare').value = '';
    document.querySelectorAll('#m-classes input').forEach(cb => cb.checked = false);
    document.getElementById('m-class-fares-container').innerHTML = '';
    document.getElementById('train-modal').style.display = 'flex';
};

function renderClassFareInputs(faresData = {}) {
    const container = document.getElementById('m-class-fares-container');
    container.innerHTML = '';
    const baseFare = document.getElementById('m-baseFare').value || 0;

    document.querySelectorAll('#m-classes input:checked').forEach(cb => {
        const cl = cb.value;
        const existingFare = faresData[cl] !== undefined ? faresData[cl] : baseFare;

        container.innerHTML += `
         <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:5px 10px; border-radius:5px;">
            <span style="font-size:13px; font-weight:600;">${cl} Fare</span>
            <div class="input-with-icon" style="width:120px;">
                <i class="fa-solid fa-indian-rupee-sign" style="font-size:10px;"></i>
                <input type="number" data-class="${cl}" class="class-fare-input" value="${existingFare}" style="width:100%; padding:6px 6px 6px 28px; font-size:12px; height:auto;" />
            </div>
         </div>
       `;
    });
}

// Add global listener to checkboxes to trigger render
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#m-classes input').forEach(cb => {
        cb.addEventListener('change', () => {
            // Retrieve current fares to not overwrite them when toggling another checkbox
            const currentFares = {};
            document.querySelectorAll('.class-fare-input').forEach(inp => {
                currentFares[inp.getAttribute('data-class')] = inp.value;
            });
            renderClassFareInputs(currentFares);
        });
    });
});

window.openEditTrain = (t) => {
    editingTrainId = t._id;
    document.getElementById('train-modal-title').innerText = `Edit Train ${t.trainNo}`;
    document.getElementById('m-trainNo').value = t.trainNo;
    document.getElementById('m-trainName').value = t.trainName;
    document.getElementById('m-from').value = t.from;
    document.getElementById('m-to').value = t.to;
    document.getElementById('m-departure').value = t.departure || '';
    document.getElementById('m-arrival').value = t.arrival || '';
    document.getElementById('m-baseFare').value = t.baseFare;

    document.querySelectorAll('#m-classes input').forEach(cb => {
        cb.checked = (t.classes || []).includes(cb.value);
    });

    renderClassFareInputs(t.classFares || {});

    document.getElementById('train-modal').style.display = 'flex';
};

async function submitNewTrain() {
    const trainNo = document.getElementById('m-trainNo').value;
    const trainName = document.getElementById('m-trainName').value;
    const from = document.getElementById('m-from').value;
    const to = document.getElementById('m-to').value;
    const departure = document.getElementById('m-departure').value;
    const arrival = document.getElementById('m-arrival').value;
    const baseFare = document.getElementById('m-baseFare').value;

    const classes = [];
    const classFares = {};
    document.querySelectorAll('#m-classes input:checked').forEach(cb => classes.push(cb.value));

    document.querySelectorAll('.class-fare-input').forEach(inp => {
        classFares[inp.getAttribute('data-class')] = Number(inp.value) || 0;
    });

    try {
        const url = editingTrainId ? `${API_BASE}/trains/${editingTrainId}` : `${API_BASE}/trains`;
        const method = editingTrainId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ trainNo, trainName, from, to, departure, arrival, baseFare, classes, classFares })
        });
        if (res.ok) {
            document.getElementById('train-modal').style.display = 'none';
            loadTrains();
        } else {
            alert('Error saving train');
        }
    } catch (err) { console.error('Save train err', err); }
}

/* --------------------------
     EXTENDED ANALYTICS
--------------------------- */
let revChartObj, genChartObj;
function buildExtendedAnalytics(reservations) {
    let m = 0, f = 0, o = 0;
    const revByDate = {}; // 'YYYY-MM-DD' -> total paid

    reservations.forEach(r => {
        r.passengers.forEach(p => {
            if (p.gender === 'male') m++;
            else if (p.gender === 'female') f++;
            else o++;
        });
        if (r.status === 'Paid') {
            const d = new Date(r.createdAt).toLocaleDateString('en-CA');
            revByDate[d] = (revByDate[d] || 0) + (r.fareTotal || 0);
        }
    });

    // Gender Chart
    if (genChartObj) genChartObj.destroy();
    genChartObj = new Chart(document.getElementById('genderChart').getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Male', 'Female', 'Unknown'],
            datasets: [{ data: [m, f, o], backgroundColor: ['#2f81f7', '#a371f7', '#30363d'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
    });

    // Rev Chart
    const sortedDates = Object.keys(revByDate).sort();
    const revData = sortedDates.map(d => revByDate[d]);
    if (revChartObj) revChartObj.destroy();
    revChartObj = new Chart(document.getElementById('revenueChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: sortedDates.length ? sortedDates : ['No Data'],
            datasets: [{ label: 'Revenue (₹)', data: revData.length ? revData : [0], borderColor: '#00ffae', tension: 0.4, fill: true, backgroundColor: 'rgba(0, 255, 174, 0.1)' }]
        },
        options: { maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
}

/* --------------------------
     SEAT ANALYZER
--------------------------- */
document.getElementById('btn-analyze').addEventListener('click', () => {
    const dStr = document.getElementById('analyzer-date').value;
    if (!dStr) return alert("Select a date!");

    // Filter reservations strictly matching this exact journeyDate string in YYYY-MM-DD
    const targetReservations = globalReservations.filter(r => new Date(r.journeyDate).toLocaleDateString('en-CA') === dStr && r.status !== 'Cancelled');

    // Map: trainNo -> coach -> { count, prio }
    const usage = {};
    targetReservations.forEach(r => {
        const tr = r.trainNo;
        if (!usage[tr]) usage[tr] = {};

        r.passengers.forEach(p => {
            const c = p.coach || 'WL';
            if (!usage[tr][c]) usage[tr][c] = { total: 0, prio: 0 };
            usage[tr][c].total++;
            if (p.age > 60) usage[tr][c].prio++;
        });
    });

    const tbody = document.getElementById('seats-body');
    tbody.innerHTML = "";
    if (Object.keys(usage).length === 0) return tbody.innerHTML = `<tr><td colspan="5" class="empty">No active bookings for this date.</td></tr>`;

    let html = "";
    Object.keys(usage).forEach(tNo => {
        Object.keys(usage[tNo]).forEach(coach => {
            const u = usage[tNo][coach];
            const max = coach.startsWith('S') ? 72 : (coach.startsWith('B') ? 72 : 100);
            const pCent = Math.min((u.total / max) * 100, 100);
            html += `<tr>
              <td style="font-weight:600">${tNo}</td>
              <td><span class="status-pill pending" style="background:rgba(255,255,255,0.1);color:#fff">${coach}</span></td>
              <td>${u.total} / ${max}</td>
              <td style="color:${u.prio > 0 ? 'var(--accent-green)' : 'var(--text-secondary)'}">${u.prio} Elderly</td>
              <td><div class="route-bar-wrapper" style="margin:0"><div class="route-bar-fill" style="width:${pCent}%"></div></div></td>
            </tr>`;
        });
    });
    tbody.innerHTML = html;
});

/* --------------------------
      UI WIRING (Search, Export)
--------------------------- */
// Global Search
document.querySelector('.search-box input').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const allRows = document.querySelectorAll('tbody tr');
    allRows.forEach(row => {
        if (row.querySelector('.empty')) return;
        row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
});

// Train Hub Local Search
const trainSearchInput = document.getElementById('train-search');
if (trainSearchInput) {
    trainSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const trainRows = document.querySelectorAll('#trains-body tr');
        trainRows.forEach(row => {
            if (row.querySelector('.empty')) return;
            row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
        });
    });
}

// CSV Export
function downloadCSV() {
    if (!globalReservations.length) return alert("No data to export");
    let csv = "PNR,Status,Train,From,To,Journey Date,Total Fare\n";
    globalReservations.forEach(r => {
        csv += `"${r.pnr}","${r.status}","${r.trainNo}","${r.from}","${r.to}","${new Date(r.journeyDate).toLocaleDateString()}","${r.totalFare}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reservations_${new Date().toLocaleDateString()}.csv`;
    a.click();
}

// Bind Export button
document.querySelector('.fa-download').parentNode.addEventListener('click', downloadCSV);

// Filter Reservations
document.getElementById('btn-search').addEventListener('click', () => {
    const pnr = document.getElementById('filter-pnr').value.toLowerCase();
    const user = document.getElementById('filter-user').value.toLowerCase();
    const date = document.getElementById('filter-date').value;
    const status = document.getElementById('filter-status').value;

    const filtered = globalReservations.filter(r => {
        const matchPnr = !pnr || r.pnr.toLowerCase().includes(pnr);
        const matchUser = !user || (typeof r.userId === 'object' && r.userId !== null ? (r.userId.name && r.userId.name.toLowerCase().includes(user)) || String(r.userId._id).includes(user) : String(r.userId).toLowerCase().includes(user));
        const matchDate = !date || new Date(r.journeyDate).toLocaleDateString('en-CA') === date;
        const matchStatus = status === 'any' || r.status === status;
        return matchPnr && matchUser && matchDate && matchStatus;
    });
    renderReservationsTab(filtered);
});

document.getElementById('btn-clear').addEventListener('click', () => {
    document.getElementById('filter-pnr').value = '';
    document.getElementById('filter-user').value = '';
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-status').value = 'any';
    renderReservationsTab(globalReservations);
});

// Add Reservation Stub
const addResBtn = document.querySelector('.fa-plus').parentNode;
if (addResBtn && addResBtn.innerText.includes('Add Reservation')) {
    addResBtn.addEventListener('click', () => alert('Adding manual reservations via Admin is locked for audit reasons. Use public portal!'));
}

/* --------------------------
       BOOT
--------------------------- */
window.onload = () => {
    loadDashboard();
    loadFeedbacks();
    loadContacts();
    loadUsers();
    loadTrains();
    loadSettings();

    // Secure Logout
    document.getElementById("admin-logout").addEventListener("click", () => {
        localStorage.removeItem("admin_token");
        window.location.replace("login.html");
    });
};

/* --------------------------
     RESERVATION MODALS
--------------------------- */
function openResViewModal(id) {
    const res = globalReservations.find(r => r._id === id);
    if (!res) return;

    let html = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <div><strong style="color:var(--text-secondary);">PNR:</strong> <span style="font-family:monospace; color:var(--accent-blue); font-size:16px;">${res.pnr}</span></div>
            <div><strong style="color:var(--text-secondary);">Status:</strong> ${res.status === 'Paid' ? '<span style="color:var(--accent-green);font-weight:600;">Paid</span>' : res.status}</div>
        </div>
        <div style="margin-bottom:8px;"><strong style="color:var(--text-secondary);">Train:</strong> ${res.trainName} (${res.trainNo})</div>
        <div style="margin-bottom:8px;"><strong style="color:var(--text-secondary);">Route:</strong> ${res.from} &rarr; ${res.to}</div>
        <div style="margin-bottom:8px;"><strong style="color:var(--text-secondary);">Journey Date:</strong> ${new Date(res.journeyDate).toLocaleDateString('en-GB')}</div>
        <div style="margin-bottom:8px;"><strong style="color:var(--text-secondary);">Booked By:</strong> <span style="font-family:monospace; font-size:12px; color:var(--accent-purple);">${res.userId && res.userId.name ? res.userId.name : (typeof res.userId === 'string' ? res.userId : 'Unknown')}</span></div>
        <div style="margin-bottom:15px;"><strong style="color:var(--text-secondary);">Total Fare:</strong> ₹${res.fareTotal}</div>
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:var(--text-secondary);">Passengers</h4>
        <ul style="list-style:none; padding:0; margin:0;">
    `;

    res.passengers.forEach((p, idx) => {
        html += `<li style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between;">
              <strong style="font-size:15px;">${p.name}</strong> 
              <span style="font-size:12px; color:var(--text-secondary);">${p.age} YRS &middot; ${p.gender.toUpperCase()}</span>
            </div>
            <span style="color:var(--text-secondary); font-size:13px; font-weight:600; color:var(--accent-blue);">Coach: ${p.coach || 'N/A'} &nbsp;&middot;&nbsp; Seat: ${p.seatLabel || 'N/A'} &nbsp;&middot;&nbsp; Berth: ${p.berthAllocated || 'N/A'}</span>
        </li>`;
    });

    html += `</ul>`;

    document.getElementById('res-view-body').innerHTML = html;
    document.getElementById('res-view-modal').style.display = 'flex';
}

function openResEditModal(id, pIndex) {
    const res = globalReservations.find(r => r._id === id);
    if (!res) return;

    document.getElementById('edit-res-id').value = id;
    document.getElementById('edit-pax-index').value = pIndex;

    const statusSelect = document.getElementById('edit-res-status');
    if (statusSelect) statusSelect.value = res.status;

    if (res.passengers && res.passengers[pIndex]) {
        const p = res.passengers[pIndex];
        document.getElementById('edit-pax-name').value = p.name || '';
        document.getElementById('edit-pax-age').value = p.age || '';
        document.getElementById('edit-pax-coach').value = p.coach || '';
        document.getElementById('edit-pax-seat').value = p.seatLabel || '';
    }

    document.getElementById('res-edit-modal').style.display = 'flex';
}

document.getElementById('res-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-res-id').value;
    const pIndex = document.getElementById('edit-pax-index').value;

    const status = document.getElementById('edit-res-status').value;
    const paxName = document.getElementById('edit-pax-name').value;
    const paxAge = document.getElementById('edit-pax-age').value;
    const paxCoach = document.getElementById('edit-pax-coach').value;
    const paxSeat = document.getElementById('edit-pax-seat').value;

    try {
        const res = await fetch(`${API_BASE}/reservations/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                status,
                paxIndex: parseInt(pIndex),
                paxName,
                paxAge: paxAge ? parseInt(paxAge) : undefined,
                paxCoach,
                paxSeat
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error');

        document.getElementById('res-edit-modal').style.display = 'none';

        // Soft reload reservations
        loadDashboard();

    } catch (err) {
        alert("Error saving reservation: " + err.message);
    }
});

/* --------------------------
     PLATFORM SETTINGS
--------------------------- */
async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/settings`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('set-support-email').value = data.support_email || '';
            document.getElementById('set-advance-days').value = data.advance_days || '';
            document.getElementById('set-cancel-penalty').value = data.cancel_penalty || '';
            document.getElementById('set-fee').value = data.base_fee || '';
        }
    } catch (err) {
        console.error("Failed to load settings:", err);
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    try {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Saving...`;

        const updates = {
            support_email: document.getElementById('set-support-email').value.trim(),
            advance_days: parseInt(document.getElementById('set-advance-days').value) || 0,
            cancel_penalty: parseFloat(document.getElementById('set-cancel-penalty').value) || 0,
            base_fee: parseFloat(document.getElementById('set-fee').value) || 0
        };

        const res = await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(updates)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save settings");

        btn.innerHTML = `<i class="fa-solid fa-check" style="color:#00ffae; margin-right:8px;"></i> Saved Successfully`;
        setTimeout(() => btn.innerHTML = originalText, 2500);

    } catch (err) {
        alert("Error saving settings: " + err.message);
        btn.innerHTML = originalText;
    }
});
