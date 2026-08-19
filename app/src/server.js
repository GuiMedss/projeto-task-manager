const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "192.168.57.12",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "task_user",
  password: process.env.DB_PASSWORD || "task_password",
  database: process.env.DB_NAME || "task_manager",
  waitForConnections: true,
  connectionLimit: 5
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tasks", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
  );
  res.json(rows);
});

app.post("/api/tasks", async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Titulo da tarefa e obrigatorio." });
  }

  const [result] = await pool.query(
    "INSERT INTO tasks (title, completed) VALUES (?, false)",
    [title.trim()]
  );

  res.status(201).json({ id: result.insertId, title: title.trim(), completed: false });
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  await pool.query(
    "UPDATE tasks SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?",
    [title || null, typeof completed === "boolean" ? completed : null, id]
  );

  res.json({ id: Number(id), title, completed });
});

app.delete("/api/tasks/:id", async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
  res.status(204).send();
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Task Manager rodando na porta ${port}`);
});

