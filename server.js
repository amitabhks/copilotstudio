// server.js (CommonJS) - fully annotated for swagger-jsdoc
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("yaml");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Information Barrier & Deals API",
      version: "1.0.0",
      description: "PoC REST API with natural keys, barriers, deals, employees"
    },
    servers: [
      { url: process.env.SWAGGER_SERVER_URL || "http://localhost:3000" }
    ]
  },
  apis: ["./server.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// expose raw spec for download
app.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/openapi.yaml", (req, res) => {
  const yamlDoc = yaml.stringify(swaggerSpec);
  res.setHeader("Content-Type", "text/plain");
  res.send(yamlDoc);
});

// helper
async function runQuery(text, params = []) {
  const r = await pool.query(text, params);
  return r;
}

/**
 * @openapi
 * tags:
 *   - name: Employees
 *   - name: Deals
 *   - name: Barriers
 */

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
app.get("/employees", async (req, res) => {
  const result = await runQuery("SELECT * FROM employee");
  res.json(result.rows);
});

/**
 * @openapi
 * /deal:
 *   get:
 *     summary: Get all deals
 *     tags: [Deals]
 *     responses:
 *       200:
 *         description: List of deals
 */
app.get("/deal", async (req, res) => {
  const result = await runQuery("SELECT * FROM deal");
  res.json(result.rows);
});

/**
 * @openapi
 * /deal:
 *   post:
 *     summary: Create a new deal
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               approver_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deal created
 */
app.post("/deal", async (req, res) => {
  const { code, name, approver_code } = req.body;
  await runQuery("INSERT INTO deal(code, name, approver_code) VALUES($1,$2,$3)", [
    code,
    name,
    approver_code
  ]);
  res.status(201).json({ ok: true });
});

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
 *         description: Deal object with members
 *       404:
 *         description: Deal not found
 */
app.get("/deal/:code", async (req, res) => {
  const { code } = req.params;
  const deal = await runQuery("SELECT * FROM deal WHERE code=$1", [code]);
  if (deal.rowCount === 0) return res.status(404).json({ error: "Deal not found" });
  const members = await runQuery("SELECT * FROM deal_members WHERE deal_code=$1", [code]);
  res.json({ deal: deal.rows[0], members: members.rows });
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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deal deleted
 */
app.delete("/deal/:code", async (req, res) => {
  const { code } = req.params;
  await runQuery("DELETE FROM deal_members WHERE deal_code=$1", [code]);
  await runQuery("DELETE FROM deal WHERE code=$1", [code]);
  res.json({ ok: true });
});

/**
 * @openapi
 * /deal/{code}/member:
 *   post:
 *     summary: Add a member to a deal
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [member_code, role]
 *             properties:
 *               member_code:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member added
 */
app.post("/deal/:code/member", async (req, res) => {
  const { code } = req.params;
  const { member_code, role } = req.body;
  await runQuery("INSERT INTO deal_members(deal_code, member_code, role) VALUES($1,$2,$3)", [
    code,
    member_code,
    role
  ]);
  res.status(201).json({ ok: true });
});

/**
 * @openapi
 * /barrier:
 *   get:
 *     summary: Get all barriers
 *     tags: [Barriers]
 *     responses:
 *       200:
 *         description: List of barriers
 */
app.get("/barrier", async (req, res) => {
  const result = await runQuery("SELECT * FROM barrier");
  res.json(result.rows);
});

/**
 * @openapi
 * /barrier:
 *   post:
 *     summary: Create a new barrier
 *     tags: [Barriers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               approver_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Barrier created
 */
app.post("/barrier", async (req, res) => {
  const { code, name, approver_code } = req.body;
  await runQuery("INSERT INTO barrier(code, name, approver_code) VALUES($1,$2,$3)", [
    code,
    name,
    approver_code
  ]);
  res.status(201).json({ ok: true });
});

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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Barrier object with members
 *       404:
 *         description: Barrier not found
 */
app.get("/barrier/:code", async (req, res) => {
  const { code } = req.params;
  const barrier = await runQuery("SELECT * FROM barrier WHERE code=$1", [code]);
  if (barrier.rowCount === 0) return res.status(404).json({ error: "Barrier not found" });
  const members = await runQuery("SELECT * FROM barrier_members WHERE barrier_code=$1", [code]);
  res.json({ barrier: barrier.rows[0], members: members.rows });
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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Barrier deleted
 */
app.delete("/barrier/:code", async (req, res) => {
  const { code } = req.params;
  await runQuery("DELETE FROM barrier_members WHERE barrier_code=$1", [code]);
  await runQuery("DELETE FROM barrier WHERE code=$1", [code]);
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
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [member_code, role]
 *             properties:
 *               member_code:
 *                 type: string
 *               role:
 *                 type: string
 *               on_date:
 *                 type: string
 *                 format: date
 *               off_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               deal_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member added
 */
app.post("/barrier/:code/member", async (req, res) => {
  const { code } = req.params;
  const { member_code, role, on_date, off_date, status, deal_code } = req.body;
  await runQuery(
    "INSERT INTO barrier_members(barrier_code, member_code, role, on_date, off_date, status, deal_code) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [code, member_code, role, on_date, off_date, status, deal_code]
  );
  res.status(201).json({ ok: true });
});

/**
 * @openapi
 * /barrier/status/{member_code}:
 *   get:
 *     summary: Get all barriers for a particular employee
 *     tags: [Barriers]
 *     parameters:
 *       - in: path
 *         name: member_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee code
 *     responses:
 *       200:
 *         description: List of barrier statuses for the employee
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   barrier_code:
 *                     type: string
 *                   barrier_name:
 *                     type: string
 *                   on_date:
 *                     type: string
 *                     format: date
 *                   off_date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   deal_code:
 *                     type: string
 *       404:
 *         description: Employee not found or no barriers
 */
app.get("/barrier/status/:member_code", async (req, res) => {
  const { member_code } = req.params;
  const emp = await runQuery("SELECT * FROM employee WHERE code=$1", [member_code]);
  if (emp.rowCount === 0) return res.status(404).json({ error: "Employee not found" });

  const barriers = await runQuery(
    `SELECT b.code AS barrier_code,
            b.name AS barrier_name,
            bm.on_date,
            bm.off_date,
            bm.status,
            bm.deal_code
     FROM barrier_members bm
     JOIN barrier b ON bm.barrier_code = b.code
     WHERE bm.member_code=$1`,
    [member_code]
  );

  if (barriers.rowCount === 0) return res.status(404).json({ error: "No barriers found for this employee" });
  res.json(barriers.rows);
});

// start server
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server running on port " + port);
});
