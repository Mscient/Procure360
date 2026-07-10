CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    vendor_name TEXT,
    filename TEXT,
    raw_file_path TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS extracted_fields (
    id TEXT PRIMARY KEY,
    bid_id TEXT NOT NULL,
    price REAL,
    lead_time TEXT,
    payment_terms TEXT,
    price_hold_days INT,
    warranty_terms TEXT,
    raw_json TEXT
);


-- `reason` stores why the clause was flagged (previously misnamed source_location)
CREATE TABLE IF NOT EXISTS flags (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    clause_text TEXT,
    flag_type TEXT,
    severity TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    input_ref TEXT,
    output_ref TEXT,
    user_note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    flag_id TEXT NOT NULL,
    reason TEXT,
    disputed_by TEXT,
    disputed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- raw_text stores the parsed contract body so the chat endpoint can reference it
-- status tracks lifecycle: 'draft' | 'active' | 'expired'
-- expires_at is an ISO-8601 date string (YYYY-MM-DD), optional
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    raw_text TEXT,
    status TEXT DEFAULT 'active',
    expires_at TEXT,
    raw_file_path TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);
