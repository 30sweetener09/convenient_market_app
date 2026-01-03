CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    name TEXT,
    type TEXT CHECK (type IN ('user', 'admin')) DEFAULT 'user',
    language TEXT,
    gender TEXT,
    countryCode TEXT,
    timezone TIMESTAMPTZ,
    birthDate DATE,
    photoUrl TEXT,
    isActivated BOOLEAN DEFAULT FALSE,
    isVerified BOOLEAN DEFAULT FALSE,
    deviceId TEXT,
    belongsToGroupAdminId UUID REFERENCES public.users(id) ON DELETE SET NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_role (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permission (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_users (
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_in_group VARCHAR(50),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE FoodCategory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE UnitOfMeasurement (
    id SERIAL PRIMARY KEY,
    unitName VARCHAR(255) NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE food_type_enum AS ENUM ('ingredient', 'meal');

CREATE TABLE Food (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    imageUrl TEXT,
    type food_type_enum NOT NULL,
    FoodCategoryId INT REFERENCES FoodCategory(id),
    UserId UUID REFERENCES auth.users(id),
    UnitOfMeasurementId INT REFERENCES UnitOfMeasurement(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Recipe (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    htmlContent TEXT,
    FoodId INT REFERENCES Food(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE mealplan_status_enum AS ENUM ('NOT_PASS_YET', 'DONE');

CREATE TABLE MealPlan (
    id SERIAL PRIMARY KEY,
    timestamp DATE,
    status mealplan_status_enum NOT NULL,
    name VARCHAR(255),
    FoodId INT REFERENCES Food(id),
    UserId UUID REFERENCES auth.users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Fridge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    quantity FLOAT,
    unit VARCHAR(50),
    expiryDate DATE,
    note TEXT,
    UserId UUID REFERENCES auth.users(id),
    FoodId INT REFERENCES Food(id),
    startDate TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ShoppingList (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    note TEXT,
    belongsToGroupAdminId UUID REFERENCES auth.users(id),
    assignedToUserId UUID REFERENCES auth.users(id),
    date TIMESTAMPTZ,
    UserId UUID REFERENCES auth.users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Task (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    quantity FLOAT,
    unit VARCHAR(50),
    isDone BOOLEAN DEFAULT FALSE,
    shoppingListId INT REFERENCES ShoppingList(id) ON DELETE CASCADE,
    UserId UUID REFERENCES auth.users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);
