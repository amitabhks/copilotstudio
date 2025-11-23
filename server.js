// server.js (CommonJS) - fully annotated for swagger-jsdoc
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors")
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("yaml");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors())

// Routes
const barrierRoutes = require("./routes/barrier.routes.js");
const dealRoutes = require("./routes/deal.routes.js");
const employeeRoutes = require("./routes/employee.routes.js");

app.use("/barrier", barrierRoutes);
app.use("/deal", dealRoutes);
app.use("/employee", employeeRoutes);

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Info Barrier & Deals API",
      version: "1.0.0",
      description: "REST API for barrier, deal and employee"
    },
    servers: [
      { url: process.env.SWAGGER_SERVER_URL}
    ]
  },
  apis: ["./server.js", "./routes/*.js"]
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

// start server
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server running on port " + port);
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

