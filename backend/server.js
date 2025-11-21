// link vercel: https://convenient-market-app.vercel.app/
import express from "express";
import cors from "cors";
import { supabase } from "./db.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import registerMiddlewares from "./middlewares/index.js";
import setupSwagger from "./services/swagger.js";
import userRoute from "./routes/users.js";
import shoppingListRoutes from "./routes/shoppingList.js";
import mealPlanRoutes from "./routes/mealPlan.js";
import recipeRoutes from "./routes/recipes.js";
import adminRoutes from "./routes/admin.js";
import foodRoutes from "./routes/food.js";
import fridgeRoutes from "./routes/fridge.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
setupSwagger(app);

// Middleware
registerMiddlewares(app);

// Routes
app.use("/api/user", userRoute);
app.use("/api/shoppingList", shoppingListRoutes);
app.use("/api/mealPlan", mealPlanRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/fridge", fridgeRoutes);

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
