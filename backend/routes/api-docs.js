import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import express from "express";

const app = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Đi Chợ Tiện Lợi API",
      version: "1.0.0",
      description: "API backend cho ứng dụng đa nền tảng",
    },
    servers: [{ url: "https://convenient-market-app.vercel.app/api" }],
  },
  apis: ["./controllers/*.js", "./api/*.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Tạo router Express mini cho Vercel serverless
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
