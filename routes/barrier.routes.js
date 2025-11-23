const express = require("express");
const runQuery = require("../db");
const router = express.Router();

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
router.get("/", async (req, res) => {
  try {
    const result = await runQuery("SELECT * FROM barrier");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
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
router.post("/", async (req, res) => {
  try {
    const { code, name, approver_code } = req.body;
    await runQuery(
      "INSERT INTO barrier(code, name, approver_code) VALUES($1,$2,$3)",
      [code, name, approver_code]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
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
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const barrier = await runQuery("SELECT * FROM barrier WHERE code=$1", [
      code,
    ]);
    if (barrier.rowCount === 0)
      return res.status(404).json({ error: "Barrier not found" });
    const members = await runQuery(
      "SELECT * FROM barrier_members WHERE barrier_code=$1",
      [code]
    );
    res.json({ barrier: barrier.rows[0], members: members.rows });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
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
router.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    await runQuery("DELETE FROM barrier_members WHERE barrier_code=$1", [code]);
    await runQuery("DELETE FROM barrier WHERE code=$1", [code]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
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
router.post("/:code/member", async (req, res) => {
  try {
    const { code } = req.params;
    const { member_code, role, on_date, off_date, status, deal_code } =
      req.body;
    await runQuery(
      "INSERT INTO barrier_members(barrier_code, member_code, role, on_date, off_date, status, deal_code) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [code, member_code, role, on_date, off_date, status, deal_code]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
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
router.get("/status/:member_code", async (req, res) => {
  try {
    const { member_code } = req.params;
    const emp = await runQuery("SELECT * FROM employee WHERE code=$1", [
      member_code,
    ]);
    if (emp.rowCount === 0)
      return res.status(404).json({ error: "Employee not found" });

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

    if (barriers.rowCount === 0)
      return res
        .status(404)
        .json({ error: "No barriers found for this employee" });
    res.json(barriers.rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

module.exports = router;
