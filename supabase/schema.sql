-- Shameless Productions — Neon Postgres Schema
-- Run this in Neon SQL editor after creating your project

-- ── PROFILES / USERS ─────────────────────────────────────────────────────────
create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  phone       text,
  role        text not null default 'guest' check (role in ('guest', 'admin')),
  created_at  timestamptz not null default now()
);

-- ── EVENTS ──────────────────────────────────────────────────────────────────
create table events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  date            timestamptz not null,
  end_date        timestamptz,
  venue           text,
  address         text,
  image_url       text,
  tags            text[] default '{}',
  payment_link    text,           -- Venmo/Cash App/PayPal handle or URL
  suggested_price numeric(8,2),   -- suggested cover/donation
  is_public       boolean not null default true,
  is_published    boolean not null default false,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── LINEUP (artists per event) ───────────────────────────────────────────────
create table lineup (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete cascade not null,
  name        text not null,
  bio         text,
  image_url   text,
  mix_url     text,
  time_slot   text,
  sort_order  int default 0,
  created_at  timestamptz not null default now()
);

-- ── RSVPs ────────────────────────────────────────────────────────────────────
create table rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete cascade not null,
  user_id     uuid references users(id) on delete set null,
  name        text not null,
  email       text,
  phone       text,
  status      text not null default 'going' check (status in ('going', 'maybe', 'not_going')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (event_id, email)
);

-- ── MERCH PRODUCTS ───────────────────────────────────────────────────────────
create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  price           numeric(8,2) not null,
  image_url       text,
  category        text,
  sizes           text[],
  stock           int default 0,
  is_published    boolean not null default false,
  stripe_price_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references users(id) on delete set null,
  email               text not null,
  name                text not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  stripe_payment_id   text,
  stripe_session_id   text,
  total               numeric(8,2) not null,
  shipping_address    jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── ORDER ITEMS ──────────────────────────────────────────────────────────────
create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade not null,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  price       numeric(8,2) not null,
  quantity    int not null default 1,
  size        text,
  created_at  timestamptz not null default now()
);

-- ── NEWSLETTER SUBSCRIBERS ────────────────────────────────────────────────────
create table subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  phone       text,
  source      text default 'website',
  created_at  timestamptz not null default now()
);

-- ── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at before update on events
  for each row execute procedure set_updated_at();

create trigger products_updated_at before update on products
  for each row execute procedure set_updated_at();

create trigger orders_updated_at before update on orders
  for each row execute procedure set_updated_at();

-- ── INDEXES ──────────────────────────────────────────────────────────────────
create index events_date_idx on events(date);
create index events_slug_idx on events(slug);
create index rsvps_event_idx on rsvps(event_id);
create index orders_user_idx on orders(user_id);
create index order_items_order_idx on order_items(order_id);
