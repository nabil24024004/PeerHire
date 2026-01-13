-- Migration: Create Payments Table for RupantorPay Integration
-- Date: December 30, 2024

-- =============================================
-- PAYMENTS TABLE
-- =============================================

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  
  -- Amount breakdown
  amount numeric not null,                    -- Total amount paid
  site_fee numeric not null,                  -- 15% site charge
  freelancer_amount numeric default 0,        -- Amount for freelancer (0 for pay_later)
  currency text default 'BDT',
  
  -- Payment method and status
  payment_method text check (payment_method in ('pay_now', 'pay_later')) not null,
  status text check (status in ('pending', 'processing', 'paid', 'failed', 'refunded')) not null default 'pending',
  
  -- RupantorPay fields
  transaction_id text,                        -- RupantorPay transaction ID
  rupantor_checkout_url text,                 -- Redirect URL from RupantorPay
  
  -- Additional data
  metadata jsonb,                             -- Extra data (job details, etc.)
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_job_id on payments(job_id);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_transaction_id on payments(transaction_id);

-- =============================================
-- RLS POLICIES
-- =============================================

alter table payments enable row level security;

-- Users can view their own payments
create policy "payments_select_own" on payments
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Users can insert their own payments
create policy "payments_insert_own" on payments
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Users can update their own pending payments only
create policy "payments_update_own" on payments
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

-- =============================================
-- UPDATE TRIGGER
-- =============================================

create or replace function update_payment_timestamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payment_updated
  before update on payments
  for each row
  execute function update_payment_timestamp();
