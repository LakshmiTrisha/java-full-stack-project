const api = {
    async get(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
    async post(path, body) {
        const response = await fetch(path, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
    async patch(path) {
        const response = await fetch(path, {method: "PATCH"});
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }
};

const state = {
    resourceTypes: [],
    resources: [],
    requests: [],
    volunteers: []
};

const SESSION_USER_KEY = "emergencyPortalUser";
const AUTH_USERNAME = "admin";
const AUTH_PASSWORD = "admin123";

const el = {
    loginView: document.getElementById("loginView"),
    appShell: document.getElementById("appShell"),
    loginForm: document.getElementById("loginForm"),
    loginBtn: document.getElementById("loginBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    metrics: document.getElementById("metrics"),
    resourceTypeSelect: document.getElementById("resourceTypeSelect"),
    resourceFilter: document.getElementById("resourceFilter"),
    requestStatusFilter: document.getElementById("requestStatusFilter"),
    resourceList: document.getElementById("resourceList"),
    requestList: document.getElementById("requestList"),
    volunteerList: document.getElementById("volunteerList"),
    toast: document.getElementById("toast")
};

function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    setTimeout(() => el.toast.classList.remove("show"), 2000);
}

function toOptions(values, includeAll = false, allLabel = "All") {
    const options = includeAll ? [`<option value="">${allLabel}</option>`] : [];
    return options.concat(values.map(v => `<option value="${v}">${v}</option>`)).join("");
}

function renderMetrics(metrics) {
    const labels = {
        resourceCenters: "Resource Centers",
        openRequests: "Open Requests",
        inProgressRequests: "In Progress",
        resolvedRequests: "Resolved",
        volunteers: "Volunteers"
    };

    el.metrics.innerHTML = Object.entries(labels)
        .map(([key, label]) => `
            <article class="metric">
                <p>${label}</p>
                <h3>${metrics[key] ?? 0}</h3>
            </article>
        `)
        .join("");
}

function renderResources() {
    el.resourceList.innerHTML = state.resources.length
        ? state.resources.map(resource => `
            <article class="card">
                <span class="tag">${resource.type}</span>
                <p><strong>${resource.name}</strong></p>
                <p>${resource.location}</p>
                <p>Contact: ${resource.contact || "N/A"}</p>
                <p>Status: ${resource.active ? "Active" : "Inactive"}</p>
            </article>
        `).join("")
        : "<p>No resource centers found.</p>";
}

function statusActions(request) {
    if (request.status === "RESOLVED") return "";
    const markResolved = `<button class="btn-ok" onclick="updateRequestStatus(${request.id}, 'RESOLVED')">Mark Resolved</button>`;
    return request.status === "OPEN"
        ? `<button class="btn-warn" onclick="assignRequestPrompt(${request.id})">Assign Center</button>${markResolved}`
        : markResolved;
}

function renderRequests() {
    el.requestList.innerHTML = state.requests.length
        ? state.requests.map(req => `
            <article class="card">
                <span class="tag">${req.status}</span>
                <p><strong>${req.requesterName}</strong> (${req.phone})</p>
                <p>Area: ${req.area}</p>
                <p>${req.description}</p>
                <p>Assigned: ${req.assignedCenter ? req.assignedCenter.name : "Not assigned"}</p>
                <div class="actions">${statusActions(req)}</div>
            </article>
        `).join("")
        : "<p>No requests found.</p>";
}

function renderVolunteers() {
    el.volunteerList.innerHTML = state.volunteers.length
        ? state.volunteers.map(v => `
            <article class="card">
                <p><strong>${v.name}</strong> (${v.phone})</p>
                <p>Skill: ${v.skill}</p>
                <p>Availability: ${v.availability}</p>
            </article>
        `).join("")
        : "<p>No volunteer records yet.</p>";
}

async function loadMetrics() {
    const metrics = await api.get("/api/dashboard");
    renderMetrics(metrics);
}

async function loadResourceTypes() {
    state.resourceTypes = await api.get("/api/resource-types");
    el.resourceTypeSelect.innerHTML = toOptions(state.resourceTypes);
    el.resourceFilter.innerHTML = toOptions(state.resourceTypes, true, "All Types");
}

async function loadResources() {
    const selectedType = el.resourceFilter.value;
    const query = selectedType ? `?type=${selectedType}&onlyActive=true` : "?onlyActive=true";
    state.resources = await api.get(`/api/resources${query}`);
    renderResources();
}

async function loadRequests() {
    const selected = el.requestStatusFilter.value;
    const query = selected ? `?status=${selected}` : "";
    state.requests = await api.get(`/api/requests${query}`);
    renderRequests();
}

async function loadVolunteers() {
    state.volunteers = await api.get("/api/volunteers");
    renderVolunteers();
}

async function refreshAll() {
    await Promise.all([loadMetrics(), loadResources(), loadRequests(), loadVolunteers()]);
}

function formToJson(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.active !== undefined) {
        data.active = form.elements.active.checked;
    }
    return data;
}

function isLoggedIn() {
    return Boolean(sessionStorage.getItem(SESSION_USER_KEY));
}

function showApp() {
    el.loginView.classList.add("hidden");
    el.loginView.style.display = "none";
    el.appShell.classList.remove("hidden");
    el.appShell.style.display = "block";
}

function showLogin() {
    el.appShell.classList.add("hidden");
    el.appShell.style.display = "none";
    el.loginView.classList.remove("hidden");
    el.loginView.style.display = "grid";
}

function isValidLogin(username, password) {
    return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

async function bootApp() {
    await loadResourceTypes();
    await refreshAll();
}

async function handleLoginAttempt(formElement) {
    const form = new FormData(formElement);
    const username = (form.get("username") || "").toString().trim();
    const password = (form.get("password") || "").toString();

    if (!username || !password) {
        showToast("Enter username and password");
        return;
    }

    if (!isValidLogin(username, password)) {
        showToast("Invalid username or password");
        return;
    }

    sessionStorage.setItem(SESSION_USER_KEY, username);
    formElement.reset();
    showApp();
    try {
        await bootApp();
        showToast(`Welcome, ${username}`);
    } catch (error) {
        showToast("Unable to load data");
    }
}

const resourceForm = document.getElementById("resourceForm");
if (resourceForm) {
    resourceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await api.post("/api/resources", formToJson(event.target));
            event.target.reset();
            event.target.elements.active.checked = true;
            await refreshAll();
            showToast("Resource center added");
        } catch (error) {
            showToast("Failed to add center");
        }
    });
}

const requestForm = document.getElementById("requestForm");
if (requestForm) {
    requestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await api.post("/api/requests", formToJson(event.target));
            event.target.reset();
            await refreshAll();
            showToast("Help request submitted");
        } catch (error) {
            showToast("Failed to submit request");
        }
    });
}

const volunteerForm = document.getElementById("volunteerForm");
if (volunteerForm) {
    volunteerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await api.post("/api/volunteers", formToJson(event.target));
            event.target.reset();
            await refreshAll();
            showToast("Volunteer registered");
        } catch (error) {
            showToast("Failed to register volunteer");
        }
    });
}

if (el.resourceFilter) {
    el.resourceFilter.addEventListener("change", loadResources);
}
if (el.requestStatusFilter) {
    el.requestStatusFilter.addEventListener("change", loadRequests);
}

window.assignRequestPrompt = async (requestId) => {
    const centerId = prompt("Enter resource center ID to assign:");
    if (!centerId) return;
    try {
        await api.patch(`/api/requests/${requestId}/assign?centerId=${centerId}`);
        await refreshAll();
        showToast("Request assigned");
    } catch (error) {
        showToast("Failed to assign request");
    }
};

window.updateRequestStatus = async (requestId, status) => {
    try {
        await api.patch(`/api/requests/${requestId}/status?status=${status}`);
        await refreshAll();
        showToast("Request status updated");
    } catch (error) {
        showToast("Failed to update status");
    }
};

if (el.loginForm) {
    el.loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await handleLoginAttempt(event.target);
    });
}

if (el.loginBtn && el.loginForm) {
    el.loginBtn.addEventListener("click", async () => {
        await handleLoginAttempt(el.loginForm);
    });
}

if (el.logoutBtn) {
    el.logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem(SESSION_USER_KEY);
        showLogin();
        showToast("Logged out");
    });
}

(async function init() {
    // Clean accidental query parameters from non-JS form submissions.
    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Always require login on fresh page load.
    sessionStorage.removeItem(SESSION_USER_KEY);
    showLogin();
})();




