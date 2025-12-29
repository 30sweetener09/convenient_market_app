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
<<<<<<< HEAD
import adminRoute from "./routes/admin.js"
=======
import recipeRoutes from "./routes/recipes.js";
import adminRoute from "./routes/admin.js";
>>>>>>> c421d8d2c5aedc12b1e5527be6dd38178dc844d5

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
<<<<<<< HEAD
=======
app.use("/api/recipes", recipeRoutes);
>>>>>>> c421d8d2c5aedc12b1e5527be6dd38178dc844d5
app.use("/api/admin", adminRoute);

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
