const express = require("express");
const runQuery = require("../db");
const router = express.Router();

/**
 * @openapi
 * /deal:
 *   get:
 *     summary: Get all deals
 *     tags: [Deal]
 *     responses:
 *       200:
 *         description: List of deals
 */
router.get("/", async (req, res) => {
  try {
    const result = await runQuery("SELECT * FROM deal");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/**
 * @openapi
 * /deal:
 *   post:
 *     summary: Create a new deal
 *     tags: [Deal]
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
router.post("/", async (req, res) => {
  try {
    const { code, name, approver_code } = req.body;
    await runQuery(
      "INSERT INTO deal(code, name, approver_code) VALUES($1,$2,$3)",
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
 * /deal/{code}:
 *   get:
 *     summary: Get a deal by code
 *     tags: [Deal]
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
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const deal = await runQuery("SELECT * FROM deal WHERE code=$1", [code]);
    if (deal.rowCount === 0)
      return res.status(404).json({ error: "Deal not found" });
    const members = await runQuery(
      "SELECT * FROM deal_members WHERE deal_code=$1",
      [code]
    );
    res.json({ deal: deal.rows[0], members: members.rows });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/**
 * @openapi
 * /deal/{code}:
 *   delete:
 *     summary: Delete a deal
 *     tags: [Deal]
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
router.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    await runQuery("DELETE FROM deal_members WHERE deal_code=$1", [code]);
    await runQuery("DELETE FROM deal WHERE code=$1", [code]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/**
 * @openapi
 * /deal/{code}/member:
 *   post:
 *     summary: Add a member to a deal
 *     tags: [Deal]
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
router.post("/:code/member", async (req, res) => {
  try {
    const { code } = req.params;
    const { member_code, role } = req.body;
    await runQuery(
      "INSERT INTO deal_members(deal_code, member_code, role) VALUES($1,$2,$3)",
      [code, member_code, role]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

module.exports = router;
