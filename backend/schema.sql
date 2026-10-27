-- AutoStyle: modelo relacional (sección 11 del documento). DESTRUYE datos existentes: solo desarrollo.
DROP TABLE IF EXISTS reviews, order_items, orders, wishlist, cart_items, products, categories, users CASCADE;
DROP TYPE IF EXISTS user_role, order_status;
CREATE TYPE user_role AS ENUM ('adm','cli','inv');
CREATE TYPE order_status AS ENUM ('PENDIENTE','ENVIADO','ENTREGADO','CANCELADO');

CREATE TABLE users(
  id SERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(160) NOT NULL,
  password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'cli', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX users_email_uq ON users(lower(email));

CREATE TABLE categories(id SERIAL PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE);

CREATE TABLE products(
  id SERIAL PRIMARY KEY, category_id INT NOT NULL REFERENCES categories(id),
  name VARCHAR(120) NOT NULL, brand VARCHAR(60) NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),          -- última defensa contra stock negativo
  emoji VARCHAR(8) NOT NULL DEFAULT '🚗',
  is_active BOOLEAN NOT NULL DEFAULT true);                  -- Soft Delete
CREATE INDEX products_cat_idx ON products(category_id);

CREATE TABLE cart_items(
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  qty INT NOT NULL CHECK (qty > 0), PRIMARY KEY(user_id, product_id));
CREATE TABLE wishlist(
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id), PRIMARY KEY(user_id, product_id));

CREATE TABLE orders(
  id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'PENDIENTE', total NUMERIC(12,2) NOT NULL,
  phone CHAR(10) NOT NULL, address TEXT NOT NULL,
  payment_method VARCHAR(12) NOT NULL, payment_ref VARCHAR(80) NOT NULL,  -- nunca se guarda el CVV ni el PAN completo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE order_items(
  id SERIAL PRIMARY KEY, order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  name VARCHAR(120) NOT NULL, unit_price NUMERIC(10,2) NOT NULL, qty INT NOT NULL CHECK (qty > 0));
CREATE INDEX order_items_order_idx ON order_items(order_id);

CREATE TABLE reviews(
  id SERIAL PRIMARY KEY, product_id INT NOT NULL REFERENCES products(id),
  user_id INT NOT NULL REFERENCES users(id),
  order_id INT NOT NULL REFERENCES orders(id),               -- RN-05: vinculada a un pedido ENTREGADO
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5), comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(product_id, user_id));
