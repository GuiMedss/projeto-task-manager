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

// Envolve os handlers async para que qualquer erro (ex.: banco fora do ar)
// caia no middleware de erro em vez de derrubar o processo.
function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get(
  "/api/tasks",
  wrap(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
    );
    res.json(rows);
  })
);

app.post(
  "/api/tasks",
  wrap(async (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titulo da tarefa e obrigatorio." });
    }

    const [result] = await pool.query(
      "INSERT INTO tasks (title, completed) VALUES (?, false)",
      [title.trim()]
    );

    const [rows] = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  })
);

app.put(
  "/api/tasks/:id",
  wrap(async (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({ error: "Titulo da tarefa nao pode ser vazio." });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({ error: "Campo completed deve ser booleano." });
    }

    if (title === undefined && completed === undefined) {
      return res.status(400).json({ error: "Informe title e/ou completed." });
    }

    await pool.query(
      "UPDATE tasks SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?",
      [title !== undefined ? String(title).trim() : null, completed !== undefined ? completed : null, id]
    );

    // Checa existencia pelo SELECT, e nao por affectedRows: um UPDATE que nao
    // altera valor nenhum retorna affectedRows = 0 mesmo com a tarefa existindo.
    const [rows] = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Tarefa nao encontrada." });
    }

    res.json(rows[0]);
  })
);

app.delete(
  "/api/tasks/:id",
  wrap(async (req, res) => {
    const [result] = await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tarefa nao encontrada." });
    }

    res.status(204).send();
  })
);

// Middleware de erro: responde JSON em vez de vazar stack trace HTML.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno ao acessar o banco de dados." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Task Manager rodando na porta ${port}`);
});
