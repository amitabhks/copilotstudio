const express = require("express");
const runQuery = require("../db");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Employees
 *   - name: Deals
 *   - name: Barriers
 */

/**
 * @openapi
 * /employee:
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
router.get("/", async (req, res) => {
  try {
    const result = await runQuery("SELECT * FROM employee");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

module.exports = router;
