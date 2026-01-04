//server.js

// link vercel: https://convenient-market-app.vercel.app/
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import { supabase } from "./db.js"; // client Supabase
import registerMiddlewares from "./middlewares/index.js";
import setupSwagger from "./services/swagger.js";
import userRoute from "./routes/users.js";
import shoppingListRoute from "./routes/shoppingList.js";
import mealRoute from "./routes/mealPlan.js";
import recipeRoutes from "./routes/recipes.js";
import adminRoute from "./routes/admin.js";
import foodRoute from "./routes/food.js";
import fridgeRoute from "./routes/fridge.js";
import groupRoute from "./routes/group.js";
import taskRoute from "./routes/task.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
registerMiddlewares(app);
setupSwagger(app);

// Gắn Supabase client vào req để dùng ở route
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use("/api/user", userRoute);
app.use("/api/shopping", shoppingListRoute);
app.use("/api/task", taskRoute);
app.use("/api/recipe", recipeRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/meal", mealRoute);
app.use("/api/food", foodRoute);
app.use("/api/fridge", fridgeRoute);
app.use("/api/group", groupRoute);

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
