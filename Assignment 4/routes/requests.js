const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const FILE = path.join(__dirname, "..", "data", "requests.json");

const CATEGORIES = ["Hostel", "Library", "Academics", "IT / Wi-Fi", "Canteen", "Transport", "Other"];
const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Open", "In Progress", "Resolved"];

// ---------- helpers (file storage) ----------
async function readData() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeData(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

// ---------- helpers (validation) ----------
function validate(body, partial = false) {
  const errors = [];
  const need = (field) => !partial || body[field] !== undefined;

  if (need("name") && !String(body.name || "").trim()) errors.push("Name is required");
  if (need("email") && !/^\S+@\S+\.\S+$/.test(String(body.email || "")))
    errors.push("A valid email is required");
  if (need("category") && !CATEGORIES.includes(body.category)) errors.push("Invalid category");
  if (need("description") && String(body.description || "").trim().length < 10)
    errors.push("Description must be at least 10 characters");
  if (need("priority") && !PRIORITIES.includes(body.priority)) errors.push("Invalid priority");
  if (body.status !== undefined && !STATUSES.includes(body.status)) errors.push("Invalid status");
  return errors;
}

// ---------- routes ----------
// GET all
router.get("/", async (req, res, next) => {
  try {
    res.json(await readData());
  } catch (err) {
    next(err);
  }
});

// GET one
router.get("/:id", async (req, res, next) => {
  try {
    const item = (await readData()).find((r) => r.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Request not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST create
router.post("/", async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(". ") });

    const data = await readData();
    const now = new Date().toISOString();
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      category: req.body.category,
      description: req.body.description.trim(),
      priority: req.body.priority,
      status: "Open",
      createdAt: now,
      updatedAt: now,
    };
    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PUT update
router.put("/:id", async (req, res, next) => {
  try {
    const errors = validate(req.body, true);
    if (errors.length) return res.status(400).json({ error: errors.join(". ") });

    const data = await readData();
    const index = data.findIndex((r) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Request not found" });

    const allowed = ["name", "email", "category", "description", "priority", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined)
        data[index][key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
    }
    data[index].updatedAt = new Date().toISOString();

    await writeData(data);
    res.json(data[index]);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const data = await readData();
    const index = data.findIndex((r) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Request not found" });

    const [removed] = data.splice(index, 1);
    await writeData(data);
    res.json({ message: "Request deleted", request: removed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
