-- =========================================================
-- DATABASE SCHEMA: Smart Grocery System (MSSQL Stable Version)
-- =========================================================

create database SmartMarketDB
go

-- =========================================================
-- 1. USERS (chưa có foreign key self-reference)
-- =========================================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    username NVARCHAR(100) NOT NULL UNIQUE,
    name NVARCHAR(255),
    type NVARCHAR(10) DEFAULT 'user' CHECK (type IN ('user','admin')),
    language NVARCHAR(50) DEFAULT 'en',
    gender NVARCHAR(20) NULL,
    countryCode NVARCHAR(10),
    timezone INT DEFAULT 7,
    birthDate DATE NULL,
    photoUrl NVARCHAR(MAX),
    isActivated BIT DEFAULT 0,
    isVerified BIT DEFAULT 0,
    deviceId NVARCHAR(255) NULL,
    belongsToGroupAdminId INT NULL, -- thêm sau foreign key
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =========================================================
-- 2. ROLES
-- =========================================================
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(MAX)
);
GO

-- =========================================================
-- 3. PERMISSIONS
-- =========================================================
CREATE TABLE permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(MAX)
);
GO

-- =========================================================
-- 4. USER_ROLE
-- =========================================================
CREATE TABLE user_role (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
GO

-- =========================================================
-- 5. ROLE_PERMISSION
-- =========================================================
CREATE TABLE role_permission (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
GO

-- =========================================================
-- 6. GROUPS
-- =========================================================
CREATE TABLE groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- =========================================================
-- 7. GROUP_USERS
-- =========================================================
CREATE TABLE group_users (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role_in_group NVARCHAR(50) DEFAULT 'member',
    joined_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id) 
);
GO

-- =========================================================
-- 8. FOOD CATEGORY
-- =========================================================
CREATE TABLE FoodCategory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =========================================================
-- 9. UNIT OF MEASUREMENT
-- =========================================================
CREATE TABLE UnitOfMeasurement (
    id INT IDENTITY(1,1) PRIMARY KEY,
    unitName NVARCHAR(100) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =========================================================
-- 10. FOOD
-- =========================================================
CREATE TABLE Food (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    imageUrl NVARCHAR(MAX),
    type NVARCHAR(20) DEFAULT 'ingredient' CHECK (type IN ('ingredient', 'meal')),
    FoodCategoryId INT NULL,
    UserId INT NULL,
    UnitOfMeasurementId INT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FoodCategoryId) REFERENCES FoodCategory(id),
    FOREIGN KEY (UserId) REFERENCES users(id),
    FOREIGN KEY (UnitOfMeasurementId) REFERENCES UnitOfMeasurement(id)
);
GO

-- =========================================================
-- 11. RECIPE
-- =========================================================
CREATE TABLE Recipe (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    htmlContent NVARCHAR(MAX),
    FoodId INT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FoodId) REFERENCES Food(id)
);
GO

-- =========================================================
-- 12. MEAL PLAN
-- =========================================================
CREATE TABLE MealPlan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    timestamp DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'NOT_PASS_YET' CHECK (status IN ('NOT_PASS_YET','DONE')),
    name NVARCHAR(255),
    FoodId INT NULL,
    UserId INT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FoodId) REFERENCES Food(id),
    FOREIGN KEY (UserId) REFERENCES users(id)
);
GO

-- =========================================================
-- 13. FRIDGE
-- =========================================================
CREATE TABLE Fridge (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    quantity FLOAT DEFAULT 0,
    unit NVARCHAR(50),
    expiryDate DATE NULL,
    note NVARCHAR(MAX),
    UserId INT NULL,
    FoodId INT NULL,
    startDate DATETIME DEFAULT GETDATE(),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES users(id),
    FOREIGN KEY (FoodId) REFERENCES Food(id)
);
GO

-- =========================================================
-- 14. SHOPPING LIST
-- =========================================================
CREATE TABLE ShoppingList (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    note NVARCHAR(MAX),
    belongsToGroupAdminId INT NULL,
    assignedToUserId INT NULL,
    date DATETIME NULL,
    UserId INT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (assignedToUserId) REFERENCES users(id),
    FOREIGN KEY (UserId) REFERENCES users(id)
);
GO

-- =========================================================
-- 15. TASK
-- =========================================================
CREATE TABLE Task (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    quantity FLOAT DEFAULT 1,
    unit NVARCHAR(50),
    isDone BIT DEFAULT 0,
    shoppingListId INT NULL,
    UserId INT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (shoppingListId) REFERENCES ShoppingList(id),
    FOREIGN KEY (UserId) REFERENCES users(id)
);
GO

-- =========================================================
-- 16. BỔ SUNG KHÓA NGOÀI SELF-REFERENCE (đưa xuống cuối)
-- =========================================================
ALTER TABLE users
ADD CONSTRAINT FK_users_belongsTo
FOREIGN KEY (belongsToGroupAdminId)
REFERENCES users(id);
GO
