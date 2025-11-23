const express = require("express");
const runQuery = require("../db");
const router = express.Router();

/**
 * @openapi
 * /employee:
 *   get:
 *     summary: Get all employees
 *     tags: [Employee]
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


/**
 * @openapi
 * /employee/search:
 *   get:
 *     summary: Search employee by email
 *     description: Returns employee details for the given email.
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Full email of the employee
 *     responses:
 *       200:
 *         description: Employee found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: No employee found
 *       500:
 *         description: Database error
 */
router.get("/search", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email query parameter is required" });
    }

    const result = await runQuery(
      "SELECT code, name, email FROM employee WHERE LOWER(email) = LOWER($1)",
      [email]
    );
  
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error searching employee:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /employee/{code}:
 *   get:
 *     summary: Get an employee by code
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee object with details
 *       404:
 *         description: Employee not found
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const employee = await runQuery("SELECT * FROM employee WHERE code=$1", [
      code,
    ]);
    if (employee.rowCount === 0)
      return res.status(404).json({ error: "Employee not found" });
    res.json(employee.rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

module.exports = router;
