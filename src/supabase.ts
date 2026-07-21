import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables with standard Vite env access or use provided defaults
let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.SUPABASE_URL || "https://kpwlwygwebeisbrssizw.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.SUPABASE_ANON_KEY || "sb_publishable_4yCQSdPimv69l5jIOmPOBA_fcEGFbmQ";

// Sanitize URL to remove /rest/v1/ suffix if it was accidentally pasted
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

// Custom safe fetch wrapper to catch network/CORS/offline errors and prevent "Failed to fetch" crashes
const safeFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    console.warn("[Supabase Safe Fetch] Intercepted network/offline error:", err);
    // Return a mocked 503 response so the SDK handles it gracefully without throwing "Failed to fetch"
    return new Response(
      JSON.stringify({
        error: "offline_fallback",
        message: "Failed to connect to Supabase. Fallback to offline/local mode is active.",
        msg: String(err?.message || err)
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: safeFetch
  }
});

// Provide the SQL instructions for user convenience
export const SUPABASE_SQL_SETUP = `-- 0. ALLOWED USERS TABLE
create table if not exists public.allowed_users (
  email text primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'operator', 'Admin', 'Warehouse User')) default 'operator',
  department text,
  created_at timestamptz default now()
);

-- Enable RLS on allowed_users
alter table public.allowed_users enable row level security;

-- Create security definer helper function to safely check admin role and bypass RLS recursion
create or replace function public.is_admin(p_email text)
returns boolean as $$
begin
  if p_email is null or trim(p_email) = '' then
    return false;
  end if;
  return exists (
    select 1 from public.allowed_users
    where lower(trim(email)) = lower(trim(p_email))
      and (lower(trim(role)) = 'admin' or lower(trim(role)) = 'administrator')
  );
end;
$$ language plpgsql security definer;

-- Policies for allowed_users
drop policy if exists "Allow public read access to allowed_users" on public.allowed_users;
create policy "Allow public read access to allowed_users" on public.allowed_users
  for select using (true);

drop policy if exists "Allow all actions on allowed_users for Admin users" on public.allowed_users;
create policy "Allow all actions on allowed_users for Admin users" on public.allowed_users
  for all using (
    public.is_admin(auth.jwt() ->> 'email')
  );

drop policy if exists "Allow authenticated insert of own email as operator" on public.allowed_users;
create policy "Allow authenticated insert of own email as operator" on public.allowed_users
  for insert with check (
    auth.role() = 'authenticated' 
    and lower(trim(auth.jwt() ->> 'email')) = lower(trim(email)) 
    and lower(trim(role)) = 'operator'
  );

-- Seed primary administrator and operator accounts
insert into public.allowed_users (email, full_name, role, department)
values 
  ('saeedsatro7@gmail.com', 'Saeed Satari', 'admin', 'Logistics Control'),
  ('saeedsatro74@gmail.com', 'سعید', 'operator', 'Warehouse Operations')
on conflict (email) do update
set role = excluded.role,
    full_name = excluded.full_name,
    department = excluded.department;

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'operator', 'Admin', 'Warehouse User')) default 'operator',
  picture text,
  phone text,
  bio text,
  department text,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Allow system insert on user signup" on public.profiles;
create policy "Allow system insert on user signup" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Allow all actions on profiles for Admin users" on public.profiles;
create policy "Allow all actions on profiles for Admin users" on public.profiles
  for all using (
    public.is_admin(auth.jwt() ->> 'email')
  );

-- Automate profile sync trigger (Triggers when a new user signs up in auth.users)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text := 'operator';
  v_full_name text := '';
  v_department text := 'Operations';
begin
  -- Look up their role and details from allowed_users if pre-registered
  select role, full_name, department into v_role, v_full_name, v_department
  from public.allowed_users
  where lower(trim(email)) = lower(trim(new.email));

  if v_role is null then
    v_role := 'operator';
  end if;
  if v_full_name is null or v_full_name = '' then
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  end if;

  insert into public.profiles (id, email, name, role, picture, department, phone, bio)
  values (
    new.id,
    lower(new.email),
    v_full_name,
    lower(v_role),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    v_department,
    '',
    ''
  )
  on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      name = excluded.name;
      
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. PRODUCTS TABLE
create table if not exists public.products (
  sku text primary key,
  name text not null,
  quantity integer not null default 0,
  unit text not null default 'count',
  location text not null,
  last_updated timestamptz default now(),
  notes text,
  min_stock integer not null default 15,
  created_at timestamptz default now(),
  deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by text
);

-- Ensure columns exist for backwards compatibility migrations
alter table public.products add column if not exists deleted boolean not null default false;
alter table public.products add column if not exists deleted_at timestamptz;
alter table public.products add column if not exists deleted_by text;

-- Enable RLS on products
alter table public.products enable row level security;

-- Policies for products
drop policy if exists "Allow read access to products for all authenticated users" on public.products;
create policy "Allow read access to products for all authenticated users" on public.products
  for select using (true);

drop policy if exists "Allow all actions on products for Admin users" on public.products;
create policy "Allow all actions on products for Admin users" on public.products
  for all using (
    public.is_admin(auth.jwt() ->> 'email')
  );

drop policy if exists "Allow select & update for Warehouse users" on public.products;
create policy "Allow select & update for Warehouse users" on public.products
  for update using (
    auth.role() = 'authenticated'
  );

drop policy if exists "Allow insert for all authenticated users" on public.products;
create policy "Allow insert for all authenticated users" on public.products
  for insert with check (
    auth.role() = 'authenticated'
  );

-- 3. MOVEMENTS TABLE
create table if not exists public.movements (
  id uuid default gen_random_uuid() primary key,
  person_name text not null,
  product_sku text not null references public.products(sku) on delete cascade,
  product_name text not null,
  type text not null check (type in ('IN', 'OUT')),
  quantity integer not null check (quantity > 0),
  date timestamptz default now(),
  location text not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS on movements
alter table public.movements enable row level security;

-- Policies for movements
drop policy if exists "Allow read access to movements for all authenticated users" on public.movements;
create policy "Allow read access to movements for all authenticated users" on public.movements
  for select using (true);

drop policy if exists "Allow insert access to movements for logged in users" on public.movements;
create policy "Allow insert access to movements for logged in users" on public.movements
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Allow delete on movements for Admin users" on public.movements;
create policy "Allow delete on movements for Admin users" on public.movements
  for delete using (
    public.is_admin(auth.jwt() ->> 'email')
  );

-- 4. SYSTEM CONFIG TABLE
create table if not exists public.system_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Insert default configurations
insert into public.system_config (key, value)
values 
  ('warehouse_layout', '{"racksCount": 10, "shelvesCount": 5, "positionsCount": 5}'),
  ('global_min_stock', '15')
on conflict (key) do nothing;

alter table public.system_config enable row level security;

drop policy if exists "Allow read access to system config" on public.system_config;
create policy "Allow read access to system config" on public.system_config
  for select using (true);

drop policy if exists "Allow update access to system config for Admin users" on public.system_config;
drop policy if exists "Allow all actions on system config for Admin users" on public.system_config;
create policy "Allow all actions on system config for Admin users" on public.system_config
  for all using (
    public.is_admin(auth.jwt() ->> 'email')
  );

-- 5. PERFORMANCE INDEXES
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_movements_product_sku on public.movements(product_sku);

-- 6. ENTERPRISE INVENTORY AUDIT LOGS (inventory_audit)
create table if not exists public.inventory_audit (
  id uuid default gen_random_uuid() primary key,
  product_sku text not null,
  product_name text not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  difference integer not null,
  action_type text not null check (action_type in ('Create', 'Stock In', 'Stock Out', 'Admin Correction', 'Reset', 'Restore', 'Delete', 'Restore Deleted')),
  reason text not null,
  notes text,
  admin_email text not null,
  admin_user_id text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.inventory_audit enable row level security;

-- Policies for inventory_audit
drop policy if exists "Allow select on audit for authenticated users" on public.inventory_audit;
create policy "Allow select on audit for authenticated users" on public.inventory_audit
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow insert on audit for authenticated users" on public.inventory_audit;
create policy "Allow insert on audit for authenticated users" on public.inventory_audit
  for insert with check (auth.role() = 'authenticated');

create index if not exists idx_audit_sku on public.inventory_audit(product_sku);
create index if not exists idx_audit_created_at on public.inventory_audit(created_at);

-- Legacy corrections table fallback support (for backwards compatibility if requested)
create table if not exists public.inventory_corrections (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  user_name text not null,
  product_sku text not null references public.products(sku) on delete cascade,
  product_name text not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text not null,
  created_at timestamptz default now()
);

alter table public.inventory_corrections enable row level security;

drop policy if exists "Allow read access to corrections for authenticated users" on public.inventory_corrections;
create policy "Allow read access to corrections for authenticated users" on public.inventory_corrections
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow insert access to corrections for admin users" on public.inventory_corrections;
create policy "Allow insert access to corrections for admin users" on public.inventory_corrections
  for insert with check (auth.role() = 'authenticated');

-- 7. TRANSACTIONAL DATABASE FUNCTION (FOR DATABASE CONSISTENCY)
-- This executes both movement log insert, quantity update, and audit log generation inside a single database transaction safely.
create or replace function public.process_stock_movement(
  p_person_name text,
  p_product_sku text,
  p_product_name text,
  p_type text,
  p_quantity integer,
  p_location text,
  p_notes text,
  p_admin_email text,
  p_admin_user_id text
) returns jsonb as $$
declare
  v_current_quantity integer;
  v_new_quantity integer;
  v_inserted_movement_id uuid;
  v_unit text;
begin
  -- Retrieve current quantity and lock row to prevent concurrent race conditions
  select quantity, unit into v_current_quantity, v_unit
  from public.products
  where sku = p_product_sku and (deleted = false or deleted is null)
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Product not found or has been soft-deleted.');
  end if;

  -- Quantity calculations and negative stock validation
  if p_type = 'OUT' then
    if v_current_quantity < p_quantity then
      return jsonb_build_object('success', false, 'error', 'Insufficient inventory.');
    end if;
    v_new_quantity := v_current_quantity - p_quantity;
  else
    v_new_quantity := v_current_quantity + p_quantity;
  end if;

  -- Insert Stock Movement Record
  insert into public.movements (
    person_name,
    product_sku,
    product_name,
    type,
    quantity,
    location,
    notes
  ) values (
    p_person_name,
    p_product_sku,
    p_product_name,
    p_type,
    p_quantity,
    p_location,
    p_notes
  ) returning id into v_inserted_movement_id;

  -- Update Product's current stock count
  update public.products
  set 
    quantity = v_new_quantity,
    last_updated = now()
  where sku = p_product_sku;

  -- Write to Enterprise Audit Logs
  insert into public.inventory_audit (
    product_sku,
    product_name,
    previous_quantity,
    new_quantity,
    difference,
    action_type,
    reason,
    notes,
    admin_email,
    admin_user_id
  ) values (
    p_product_sku,
    p_product_name,
    v_current_quantity,
    v_new_quantity,
    (case when p_type = 'IN' then p_quantity else -p_quantity end),
    (case when p_type = 'IN' then 'Stock In'::text else 'Stock Out'::text end),
    'Stock movement registered by ' || p_person_name,
    p_notes,
    p_admin_email,
    p_admin_user_id
  );

  return jsonb_build_object(
    'success', true,
    'movement_id', v_inserted_movement_id,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity
  );
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
`;
