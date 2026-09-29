const express = require("express");
const path = require("path");
const requestsRouter = require("./routes/requests");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/requests", requestsRouter);

// Unknown API route
app.use("/api", (req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => console.log(`Campus Help Desk running at http://localhost:${PORT}`));
