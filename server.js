const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Swagger setup
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

// ---------------------------
// Employees
app.get("/employees", async (req,res)=>{
  res.json(await pool.query("SELECT * FROM employee"));
});

// ---------------------------
// Deals
app.get("/deal", async (req,res)=>res.json(await pool.query("SELECT * FROM deal")));
app.post("/deal", async (req,res)=>{
  const { code, name, approver_code } = req.body;
  await pool.query("INSERT INTO deal(code,name,approver_code) VALUES($1,$2,$3)", [code,name,approver_code]);
  res.status(201).json({ok:true});
});
app.delete("/deal/:code", async (req,res)=>{
  const { code } = req.params;
  await pool.query("DELETE FROM deal_members WHERE deal_code=$1", [code]);
  await pool.query("DELETE FROM deal WHERE code=$1", [code]);
  res.json({ok:true});
});
app.post("/deal/:code/member", async (req,res)=>{
  const { code } = req.params;
  const { member_code, role } = req.body;
  await pool.query("INSERT INTO deal_members(deal_code,member_code,role) VALUES($1,$2,$3)", [code,member_code,role]);
  res.status(201).json({ok:true});
});

// ---------------------------
// Barriers
app.get("/barrier", async (req,res)=>res.json(await pool.query("SELECT * FROM barrier")));
app.post("/barrier", async (req,res)=>{
  const { code, name, approver_code } = req.body;
  await pool.query("INSERT INTO barrier(code,name,approver_code) VALUES($1,$2,$3)", [code,name,approver_code]);
  res.status(201).json({ok:true});
});
app.delete("/barrier/:code", async (req,res)=>{
  const { code } = req.params;
  await pool.query("DELETE FROM barrier_members WHERE barrier_code=$1", [code]);
  await pool.query("DELETE FROM barrier WHERE code=$1", [code]);
  res.json({ok:true});
});

// Add member to barrier
app.post("/barrier/:code/member", async (req,res)=>{
  const { code } = req.params;
  const { member_code, role, on_date, off_date, status } = req.body;
  await pool.query(
    "INSERT INTO barrier_members(barrier_code,member_code,role,on_date,off_date,status) VALUES($1,$2,$3,$4,$5,$6)",
    [code, member_code, role, on_date, off_date, status]
  );
  res.status(201).json({ok:true});
});

// Get barriers for an employee
app.get("/barrier/status/:member_code", async (req,res)=>{
  const { member_code } = req.params;
  const emp = await pool.query("SELECT * FROM employee WHERE code=$1", [member_code]);
  if(emp.rowCount===0) return res.status(404).json({error:"Employee not found"});
  const barriers = await pool.query(`
    SELECT b.code AS barrier_code, b.name AS barrier_name, bm.status, bm.on_date, bm.off_date, bm.deal_id AS deal_id
    FROM barrier_members bm
    JOIN barrier b ON bm.barrier_code = b.code
    WHERE bm.member_code=$1
  `,[member_code]);
  if(barriers.rowCount===0) return res.status(404).json({error:"No barriers found for this employee"});
  res.json(barriers.rows);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
