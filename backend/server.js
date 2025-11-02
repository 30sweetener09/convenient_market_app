//server.js

// link vercel: https://convenient-market-app.vercel.app/
import express from "express";
import cors from "cors";
import { supabase } from "./db.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import registerMiddlewares from "./middlewares/index.js";
import setupSwagger from "./services/swagger.js";
import userRoute from "./routes/users.js";

dotenv.config();



const app = express();
const PORT = process.env.PORT || 3000;
// Cho phép mọi origin, mọi method, mọi header
app.use(cors({
  origin: "*",          
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"], 
  credentials: false     
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
setupSwagger(app);

// Middleware
registerMiddlewares(app);

// Routes
app.use("/api/user", userRoute);


app.get("/", (req, res) => res.send("Smart Schedule API running"));

// Start server
(async () => {
  try {
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(" Shutting down server...");
  process.exit(0);
});
