const API = "/api/requests";

const form = document.getElementById("request-form");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const errorEl = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const fields = ["name", "email", "category", "priority", "description"];
const $ = (id) => document.getElementById(id);

let requests = [];

// ---------- API calls (fetch) ----------
async function api(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const getRequests = () => api(API);
const createRequest = (body) => api(API, { method: "POST", body: JSON.stringify(body) });
const updateRequest = (id, body) => api(`${API}/${id}`, { method: "PUT", body: JSON.stringify(body) });
const deleteRequest = (id) => api(`${API}/${id}`, { method: "DELETE" });

// ---------- rendering ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent avoids HTML injection
  return node;
}

function render() {
  countEl.textContent = requests.length ? `(${requests.length})` : "";
  listEl.innerHTML = "";

  if (!requests.length) {
    listEl.append(el("div", "empty", "No requests yet. Submit the first one using the form above."));
    return;
  }
  [...requests].reverse().forEach((r) => listEl.append(card(r)));
}

function card(r) {
  const c = el("article", `card ${r.priority} ${r.status}`);

  const top = el("div", "card-top");
  top.append(el("h3", "", `${r.category}: ${r.name}`), el("span", `tag ${r.priority}`, `${r.priority} priority`));

  const meta = el("div", "meta", `${r.email}, ${new Date(r.createdAt).toLocaleString()}`);
  const desc = el("p", "desc", r.description);

  const actions = el("div", "card-actions");
  const status = el("select");
  status.setAttribute("aria-label", "Status");
  ["Open", "In Progress", "Resolved"].forEach((s) => {
    const o = el("option", "", s);
    o.selected = s === r.status;
    status.append(o);
  });
  status.addEventListener("change", () => run(() => updateRequest(r.id, { status: status.value })));

  const edit = el("button", "ghost small", "Edit");
  edit.addEventListener("click", () => startEdit(r));

  const del = el("button", "danger small", "Delete");
  del.addEventListener("click", () => {
    if (confirm("Delete this request?")) run(() => deleteRequest(r.id));
  });

  actions.append(status, el("span", "spacer"), edit, del);
  c.append(top, meta, desc, actions);
  return c;
}

// ---------- behaviour ----------
async function load() {
  try {
    requests = await getRequests();
    render();
  } catch (err) {
    listEl.textContent = `Could not load requests: ${err.message}`;
  }
}

async function run(action) {
  try {
    await action();
    await load();
  } catch (err) {
    alert(err.message);
  }
}

function startEdit(r) {
  $("request-id").value = r.id;
  fields.forEach((f) => ($(f).value = r[f]));
  formTitle.textContent = "Edit request";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  form.reset();
  $("request-id").value = "";
  $("priority").value = "Medium";
  formTitle.textContent = "New request";
  submitBtn.textContent = "Submit request";
  cancelBtn.hidden = true;
  errorEl.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const body = {};
  fields.forEach((f) => (body[f] = $(f).value));
  const id = $("request-id").value;

  try {
    if (id) await updateRequest(id, body);
    else await createRequest(body);
    resetForm();
    await load();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
});

load();
