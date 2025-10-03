// services/swagger.js

import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Đi Chợ Tiện Lợi API",
      version: "1.0.0",
      description: "API backend cho ứng dụng đa nền tảng"
    },
    servers: [
      { url: "http://localhost:3000/api" }
    ]
  },
  apis: ["./server.js", "./routes/*.js", "./controllers/*.js"], // nơi chứa swagger comment
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export default (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

// url swagger: http://localhost:3000/api-docs