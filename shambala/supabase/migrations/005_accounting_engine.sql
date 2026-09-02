-- ============================================================
-- 5. ACCOUNTING ENGINE (DOUBLE-ENTRY)
-- ============================================================

-- Ledger Account Groups
CREATE TYPE account_group AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense');

CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_group account_group NOT NULL,
  normal_balance TEXT CHECK (normal_balance IN ('Debit', 'Credit')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voucher Types
CREATE TYPE voucher_type AS ENUM ('Receipt', 'Payment', 'Journal', 'Contra', 'Purchase', 'Sales');

-- Vouchers (Header)
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voucher_no TEXT NOT NULL,
  type voucher_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  narration TEXT,
  reference_table TEXT,
  reference_id UUID,
  is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voucher Lines (Debits and Credits)
CREATE TABLE voucher_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  ledger_id UUID NOT NULL REFERENCES ledger_accounts(id),
  party_id UUID REFERENCES parties(id),
  cost_center_id UUID REFERENCES buildings(id), -- Projects/Buildings as cost centers
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (debit > 0 OR credit > 0)
);

-- Bill Allocations (To map payments to specific bills/accruals)
CREATE TABLE bill_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_line_id UUID NOT NULL REFERENCES voucher_lines(id) ON DELETE CASCADE,
  bill_line_id UUID NOT NULL REFERENCES voucher_lines(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (allocated_amount > 0)
);

-- Fiscal Periods (To prevent backdated entries in closed periods)
CREATE TABLE fiscal_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RPC: post_voucher
-- Inserts a voucher and lines atomically, enforcing balance.
-- ============================================================

CREATE OR REPLACE FUNCTION post_voucher(
  p_project_id UUID,
  p_voucher_no TEXT,
  p_type voucher_type,
  p_date DATE,
  p_narration TEXT,
  p_reference_table TEXT,
  p_reference_id UUID,
  p_lines JSONB
) RETURNS UUID AS $$
DECLARE
  v_voucher_id UUID;
  v_total_debit NUMERIC(15,2) := 0;
  v_total_credit NUMERIC(15,2) := 0;
  v_line JSONB;
BEGIN
  -- Insert Voucher Header
  INSERT INTO vouchers (
    project_id, voucher_no, type, date, narration, reference_table, reference_id
  ) VALUES (
    p_project_id, p_voucher_no, p_type, p_date, p_narration, p_reference_table, p_reference_id
  ) RETURNING id INTO v_voucher_id;

  -- Insert Lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    INSERT INTO voucher_lines (
      voucher_id, ledger_id, party_id, cost_center_id, debit, credit, due_date
    ) VALUES (
      v_voucher_id,
      (v_line->>'ledger_id')::UUID,
      NULLIF(v_line->>'party_id', '')::UUID,
      NULLIF(v_line->>'cost_center_id', '')::UUID,
      COALESCE((v_line->>'debit')::NUMERIC, 0),
      COALESCE((v_line->>'credit')::NUMERIC, 0),
      NULLIF(v_line->>'due_date', '')::DATE
    );
    
    v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
  END LOOP;

  -- Enforce Balance
  IF v_total_debit <> v_total_credit THEN
    RAISE EXCEPTION 'Voucher is not balanced. Total Debit: %, Total Credit: %', v_total_debit, v_total_credit;
  END IF;

  RETURN v_voucher_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_vouchers_project ON vouchers(project_id);
CREATE INDEX idx_voucher_lines_ledger ON voucher_lines(ledger_id);
CREATE INDEX idx_voucher_lines_party ON voucher_lines(party_id);
