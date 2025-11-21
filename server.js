const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "IB & Deal API", version: "1.0.0" },
    servers: [{ url: process.env.SWAGGER_SERVER_URL }]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/barrier/:code", async (req,res)=> {
  const { code } = req.params;
  const barrier = await pool.query(
    "SELECT * FROM barrier WHERE code=$1", [code]
  );
  if (barrier.rowCount === 0) return res.status(404).send("Not found");
  const members = await pool.query(
    "SELECT * FROM barrier_members WHERE barrier_code=$1", [code]
  );
  res.send({ barrier: barrier.rows[0], members: members.rows });
});

app.post("/barrier", async (req,res)=> {
  const { code, name, approver_code } = req.body;
  await pool.query(
    "INSERT INTO barrier(code,name,approver_code) VALUES($1,$2,$3)",
    [code,name,approver_code]
  );
  res.status(201).send("Created");
});

app.delete("/barrier/:code", async (req,res)=> {
  const { code } = req.params;
  await pool.query("DELETE FROM barrier_members WHERE barrier_code=$1",[code]);
  await pool.query("DELETE FROM barrier WHERE code=$1",[code]);
  res.send("Deleted");
});

app.get("/deal/:code", async (req,res)=> {
  const { code } = req.params;
  const deal = await pool.query("SELECT * FROM deal WHERE code=$1",[code]);
  if (deal.rowCount===0) return res.status(404).send("Not found");
  const members = await pool.query(
    "SELECT * FROM deal_members WHERE deal_code=$1",[code]
  );
  res.send({ deal: deal.rows[0], members: members.rows });
});

app.post("/deal", async (req,res)=> {
  const { code, name, approver_code } = req.body;
  await pool.query(
    "INSERT INTO deal(code,name,approver_code) VALUES($1,$2,$3)",
    [code,name,approver_code]
  );
  res.status(201).send("Created");
});

app.delete("/deal/:code", async (req,res)=> {
  const { code } = req.params;
  await pool.query("DELETE FROM deal_members WHERE deal_code=$1",[code]);
  await pool.query("DELETE FROM deal WHERE code=$1",[code]);
  res.send("Deleted");
});

app.post("/deal/:code/member", async (req,res)=>{
  const { code } = req.params;
  const { member_code, role } = req.body;
  await pool.query(
    "INSERT INTO deal_members(deal_code,member_code,role) VALUES($1,$2,$3)",
    [code,member_code,role]
  );
  res.status(201).send("Added");
});

app.listen(3000, ()=> console.log("Running on 3000"));
