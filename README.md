# convenient_market_app

Cấu trúc thư mục
backend/
│
├── controllers/
│   ├── foodController.js
│   ├── fridgeController.js
│   ├── groupController.js
│   ├── mealPlanController.js
│   ├── recipeController.js
│   ├── shoppingListController.js
│   ├── taskController.js
│   └── userController.js
│
├── middlewares/
│   ├── index.js
│   ├── permission.js
│   ├── supabaseAuth.js
│   ├── upload.js
│   ├── uploadMiddleware.js
│   └── userContext.js
│
├── routes/
│   ├── admin.js
│   ├── api-docs.js
│   ├── food.js
│   ├── fridge.js
│   ├── group.js
│   ├── mealPlan.js
│   ├── recipes.js
│   ├── shoppingList.js
│   ├── task.js
│   └── user.js
│
├── services/
│   ├── authService.js
│   ├── uploadService.js
│   └── swagger.js
│
├── node_modules/
│
├── .env
├── .gitignore
│
├── authorization.sql
├── Database.sql
├── Cơ sở dữ liệu.pdf
│
├── db.js
├── server.js
├── package.json
└── package-lock.json

frontend/
├── lib/
│   ├── core/
│   ├── data/
│   │   ├── dto/
│   │   ├── models/
│   │   └── services/
│   ├── providers/
│   ├── routes/
│   ├── screens/
│   │   ├── auth/
│   │   ├── food/
│   │   ├── fridge/
│   │   ├── group/
│   │   ├── home/
│   │   ├── meal_plan/
│   │   ├── recipe/
│   │   ├── stats/
│   │   ├── user/
│   │   ├── main_layout.dart
│   │   ├── notification_screen.dart
│   │   └── splash/
│   ├── widgets/
│   └── main.dart