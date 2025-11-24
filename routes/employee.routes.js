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
 *     summary: Search for an employee by email or name
 *     description: >
 *       Allows searching employees using either email (exact match) or name (partial match).
 *       At least one query parameter (`email` or `name`) must be provided.
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: false
 *         description: Employee email for exact match search.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: Employee name for case-insensitive partial search.
 *     responses:
 *       200:
 *         description: Employee(s) matching the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: E003
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   email:
 *                     type: string
 *                     example: johndoe@microsoft.com
 *       400:
 *         description: Missing both email and name query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: You must provide either 'email' or 'name'
 *       404:
 *         description: No employee found matching the criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Employee not found
 *       500:
 *         description: Server error occurred during search.
 */
router.get("/search", async (req, res) => {
  try {
    const { email, name } = req.query;

    // Validate
    if (!email && !name) {
      return res.status(400).json({
        error: "You must provide either 'email' or 'name' as a query parameter"
      });
    }

    let query = "";
    let params = [];

    // Search by email
    if (email) {
      query = `
        SELECT code, name, email
        FROM employee
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      `;
      params = [email];
    }

    // Search by name (partial match allowed)
    else if (name) {
      query = `
        SELECT code, name, email
        FROM employee
        WHERE LOWER(name) LIKE LOWER($1)
      `;
      params = [`%${name}%`];
    }

    const result = await runQuery(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows);
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
