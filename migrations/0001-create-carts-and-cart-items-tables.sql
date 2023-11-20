CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');

CREATE TABLE IF NOT EXISTS carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uesr_id uuid NOT NULL,
    created_at date NOT NULL,
    updated_at date NOT NULL,
    status cart_status NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    cart_id uuid references carts(id),
    product_id uuid,
    count smallint
);
