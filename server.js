const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(bodyParser.json());

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------------------
// Swagger Setup
// ---------------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Information Barrier & Deals API",
      version: "1.0.0",
      description: "PoC REST API with natural keys, barriers, deals, employees"
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL
      }
    ]
  },
  apis: ["./server.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ---------------------------
// Employees
// ---------------------------

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 */
app.get("/employees", async (req, res) => {
  res.json(await query("SELECT * FROM employee"));
});

// ---------------------------
// Deals
// ---------------------------

/**
 * @openapi
 * /deal/{code}:
 *   get:
 *     summary: Get a deal by code
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deal object
 *       404:
 *         description: Deal not found
 */
app.get("/deal/:code", async (req, res) => {
  const deal = await pool.query("SELECT * FROM deal WHERE code=$1", [req.params.code]);
  if (deal.rowCount === 0) return res.status(404).json({ error: "Not found" });
  const members = await pool.query("SELECT * FROM deal_members WHERE deal_code=$1", [req.params.code]);
  res.json({ deal: deal.rows[0], members: members.rows });
});

/**
 * @openapi
 * /deal:
 *   post:
 *     summary: Create a deal
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               approver_code: { type: string }
 *     responses:
 *       201:
 *         description: Deal created
 */
app.post("/deal", async (req, res) => {
  const { code, name, approver_code } = req.body;
  await pool.query(
    "INSERT INTO deal(code,name,approver_code) VALUES($1,$2,$3)",
    [code, name, approver_code]
  );
  res.status(201).json({ ok: true });
});

/**
 * @openapi
 * /deal/{code}:
 *   delete:
 *     summary: Delete a deal
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deal deleted
 */
app.delete("/deal/:code", async (req, res) => {
  const { code } = req.params;
  await pool.query("DELETE FROM deal_members WHERE deal_code=$1", [code]);
  await pool.query("DELETE FROM deal WHERE code=$1", [code]);
  res.json({ ok: true });
});

/**
 * @openapi
 * /deal/{code}/member:
 *   post:
 *     summary: Add member to a deal
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               member_code: { type: string }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: Member added
 */
app.post("/deal/:code/member", async (req, res) => {
  const { code } = req.params;
  const { member_code, role } = req.body;
  await pool.query(
    "INSERT INTO deal_members(deal_code, member_code, role) VALUES($1,$2,$3)",
    [code, member_code, role]
  );
  res.status(201).json({ ok: true });
});

// ---------------------------
// Barriers
// ---------------------------

/**
 * @openapi
 * /barrier/{code}:
 *   get:
 *     summary: Get a barrier by code
 *     tags: [Barriers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Barrier object
 *       404:
 *         description: Barrier not found
 */
app.get("/barrier/:code", async (req, res) => {
  const barrier = await pool.query("SELECT * FROM barrier WHERE code=$1", [req.params.code]);
  if (barrier.rowCount === 0) return res.status(404).json({ error: "Not found" });
  const members = await pool.query("SELECT * FROM barrier_members WHERE barrier_code=$1", [req.params.code]);
  res.json({ barrier: barrier.rows[0], members: members.rows });
});

/**
 * @openapi
 * /barrier:
 *   post:
 *     summary: Create a barrier
 *     tags: [Barriers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               approver_code: { type: string }
 *     responses:
 *       201:
 *         description: Barrier created
 */
app.post("/barrier", async (req, res) => {
  const { code, name, approver_code } = req.body;
  await pool.query(
    "INSERT INTO barrier(code,name,approver_code) VALUES($1,$2,$3)",
    [code, name, approver_code]
  );
  res.status(201).json({ ok: true });
});

/**
 * @openapi
 * /barrier/{code}:
 *   delete:
 *     summary: Delete a barrier
 *     tags: [Barriers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Barrier deleted
 */
app.delete("/barrier/:code", async (req, res) => {
  const { code } = req.params;
  await pool.query("DELETE FROM barrier_members WHERE barrier_code=$1", [code]);
  await pool.query("DELETE FROM barrier WHERE code=$1", [code]);
  res.json({ ok: true });
});

/**
 * @openapi
 * /barrier/{code}/member:
 *   post:
 *     summary: Add member to a barrier
 *     tags: [Barriers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               member_code: { type: string }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: Member added
 */
app.post("/barrier/:code/member", async (req, res) => {
  const { code } = req.params;
  const { member_code, role } = req.body;
  await pool.query(
    "INSERT INTO barrier_members(barrier_code, member_code, role) VALUES($1,$2,$3)",
    [code, member_code, role]
  );
  res.status(201).json({ ok: true });
});

// ---------------------------
// Start Server
// ---------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
