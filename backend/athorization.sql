CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- user, group_admin, super_admin
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- manage_group, manage_food, delete_user...
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);


-- Roles
INSERT INTO roles (name, description) VALUES
('user', 'Người dùng bình thường'),
('group_admin', 'Quản trị nhóm'),
('super_admin', 'Quản trị hệ thống');

-- Permissions
INSERT INTO permissions (name, description) VALUES
('manage_group', 'Quản lý nhóm'),
('manage_food', 'Quản lý thực phẩm'),
('manage_fridge', 'Quản lý tủ lạnh'),
('manage_shopping_list', 'Quản lý danh sách mua sắm'),
('manage_meal_plan', 'Quản lý kế hoạch bữa ăn'),
('manage_recipe', 'Quản lý công thức'),
('manage_category', 'Quản lý danh mục'),
('manage_unit', 'Quản lý đơn vị đo lường'),
('view_logs', 'Xem nhật ký hệ thống'),
('delete_user', 'Xóa người dùng');

-- Gán quyền cho group_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
  'manage_group','manage_food','manage_fridge','manage_shopping_list','manage_meal_plan','manage_recipe'
);

-- Gán quyền cho super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
  'manage_category','manage_unit','view_logs','delete_user'
);

-- RLS Policies

alter table public.orders enable row level security;

create policy "Users can view their own orders"
on public.orders
for select
using (auth.uid() = user_id);

create policy "Users can insert their own orders"
on public.orders
for insert
with check (auth.uid() = user_id);
