/* ==========================
   BookMyTrack – Admin Panel
   Frontend Script (admin.js)
============================= */

const API_BASE = "http://localhost:5000/api/admin";

/* --------------------------
     TOKEN CHECK (IMPORTANT)
--------------------------- */
const token = localStorage.getItem("admin_token");

// If token missing → redirect to login
if (!token) {
    window.location.href = "admin-login.html";
}

/* Reusable fetch with auth header */
async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        // Invalid/expired token → logout
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("admin_token");
            window.location.href = "admin-login.html";
        }
        throw new Error("Failed: " + res.status);
    }

    return res.json();
}

/* --------------------------
       Load Dashboard Stats
--------------------------- */
async function loadStats() {
    try {
        const stats = await fetchJSON(`${API_BASE}/stats`);

        document.getElementById("stat-total").textContent = stats.total ?? 0;
        document.getElementById("stat-active").textContent = stats.active ?? 0;
        document.getElementById("stat-cancelled").textContent = stats.cancelled ?? 0;
        document.getElementById("stat-today").textContent = stats.today ?? 0;

    } catch (err) {
        console.error("Stats load error:", err);
        document.getElementById("stat-total").textContent = "ERR";
    }
}

/* --------------------------
       Load Reservations
--------------------------- */
async function loadReservations() {
    const pnr = document.getElementById("filter-pnr").value.trim();
    const userId = document.getElementById("filter-user").value.trim();
    const journeyDate = document.getElementById("filter-date").value;
    const status = document.getElementById("filter-status").value;

    const params = new URLSearchParams();
    if (pnr) params.append("pnr", pnr);
    if (userId) params.append("userId", userId);
    if (journeyDate) params.append("journeyDate", journeyDate);
    if (status && status !== "any") params.append("status", status);

    const tbody = document.getElementById("reservations-body");
    tbody.innerHTML = `<tr><td colspan="13" class="empty">Loading...</td></tr>`;

    try {
        const items = await fetchJSON(`${API_BASE}/reservations?${params.toString()}`);
        renderReservations(items);
    } catch (err) {
        console.error("Reservations error:", err);
        tbody.innerHTML = `<tr><td colspan="13" class="empty">Error loading data.</td></tr>`;
    }
}

/* --------------------------
       Render Table Rows
--------------------------- */
function renderReservations(list) {
    const tbody = document.getElementById("reservations-body");
    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="13" class="empty">No records found.</td></tr>`;
        return;
    }

    list.forEach(item => {
        item.passengers.forEach(p => {
            const row = `
                <tr>
                    <td>${item.pnr}</td>
                    <td>${item.status}</td>
                    <td>${item.userId}</td>
                    <td>${item.from}</td>
                    <td>${item.to}</td>
                    <td>${new Date(item.journeyDate).toLocaleDateString()}</td>
                    <td>${p.name}</td>
                    <td>${p.age}</td>
                    <td>${p.gender}</td>
                    <td>${p.priorityScore ?? "-"}</td>
                    <td>${p.berthAllocated || "-"}</td>
                    <td>${p.coach || "-"}</td>
                    <td>${p.seatLabel || "-"}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    });
}

/* --------------------------
        Clear Filters
--------------------------- */
function clearFilters() {
    document.getElementById("filter-pnr").value = "";
    document.getElementById("filter-user").value = "";
    document.getElementById("filter-date").value = "";
    document.getElementById("filter-status").value = "any";
    loadReservations();
}

/* --------------------------
        Logout Handler
--------------------------- */
function adminLogout() {
    localStorage.removeItem("admin_token");
    window.location.href = "admin-login.html";
}

/* --------------------------
        Initial Load
--------------------------- */
window.onload = function () {
    loadStats();
    loadReservations();

    document.getElementById("btn-search").onclick = loadReservations;
    document.getElementById("btn-clear").onclick = clearFilters;

    // Add logout button support if exists
    const logoutBtn = document.getElementById("admin-logout");
    if (logoutBtn) logoutBtn.onclick = adminLogout;
};
