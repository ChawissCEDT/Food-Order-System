# Food Order System Database Notes

## จุดที่ตอนนี้ยังเป็น mock/hardcoded

- `src/app/food-order.service.ts`
  - `restaurants`: รายชื่อร้าน, ประเภทอาหาร, description, rating, delivery time, delivery fee, open/closed เป็น seed data ในหน้า frontend
  - `menuItems`: รายการอาหาร, category, ราคา, popular เป็น seed data ใน frontend
  - `cartLines`: ตะกร้าอยู่ใน memory เท่านั้น refresh แล้วหาย
  - `orders`, `nextOrderId`: ประวัติ order และเลข order อยู่ใน memory เท่านั้น refresh แล้วหาย
  - `getDashboardSummary()`: ตัวเลข dashboard/revenue คำนวณจาก array mock

- `src/app/auth/auth.service.ts`
  - user register/login เก็บใน `localStorage` key `food-order-users`
  - session ผู้ใช้เก็บใน `localStorage` key `food-order-current-user`
  - password ยังเป็น plain text สำหรับ demo เท่านั้น ของจริงต้องเก็บเป็น `password_hash`

- `src/app/restaurant/restaurant.css`
  - รูปร้าน/รูปเมนูเป็น placeholder จาก Unsplash และผูกกับ class/category
  - ของจริงควรเก็บ `image_url` ใน database แล้ว bind มาแสดง

## ตารางหลักที่ควรมี

### `users`
- `id`
- `name`
- `email` unique
- `phone`
- `address`
- `password_hash`
- `role` เช่น `customer`, `staff`, `admin` ถ้าต้องมีหลังบ้าน
- `created_at`
- `updated_at`

### `restaurants`
- `id`
- `name`
- `cuisine`
- `description`
- `rating`
- `delivery_time` หรือ `delivery_min_minutes`, `delivery_max_minutes`
- `delivery_fee`
- `image_url`
- `is_open`
- `created_at`
- `updated_at`

### `menu_items`
- `id`
- `restaurant_id` foreign key ไป `restaurants.id`
- `name`
- `description`
- `category`
- `price`
- `image_url`
- `is_popular`
- `is_available`
- `created_at`
- `updated_at`

### `carts`
- `id`
- `user_id` foreign key ไป `users.id`
- `created_at`
- `updated_at`

### `cart_items`
- `id`
- `cart_id` foreign key ไป `carts.id`
- `menu_item_id` foreign key ไป `menu_items.id`
- `quantity`
- `created_at`
- `updated_at`

### `orders`
- `id`
- `user_id` foreign key ไป `users.id`
- `customer_name`
- `phone`
- `delivery_address`
- `note`
- `status` เช่น `Pending`, `Preparing`, `Delivered`, `Cancelled`
- `subtotal`
- `delivery_fee`
- `total`
- `created_at`
- `updated_at`
- `cancelled_at`

### `order_items`
- `id`
- `order_id` foreign key ไป `orders.id`
- `restaurant_id` foreign key ไป `restaurants.id`
- `menu_item_id` foreign key ไป `menu_items.id`
- `item_name` snapshot ตอนสั่ง
- `unit_price` snapshot ตอนสั่ง
- `quantity`
- `line_total`

## API/data flow ที่ project นี้ต้องใช้

- Restaurant list: ดึงจาก `restaurants`
- Restaurant detail/menu: ดึง `restaurant` ตาม `id` และ `menu_items` ตาม `restaurant_id`
- Register/login: ส่งไป backend auth และอ่าน/เขียน `users`
- Cart: เก็บ `cart_items` ตาม `user_id` ถ้าต้องการให้ refresh แล้วยังอยู่
- Checkout: สร้าง `orders` และ `order_items`
- Order history: ดึง `orders` ของ user ปัจจุบัน พร้อม `order_items`
- Cancel order: update `orders.status = 'Cancelled'`
- Dashboard summary: aggregate จาก `restaurants`, `menu_items`, `orders`
