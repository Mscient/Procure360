CREATE TABLE  IF NOT EXISTS bids ( 
    id TEXT PRIMARY KEY,
    batch_id   TEXT NOT NULL,
    vendor_name TEXT,
    filename TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE  IF NOT EXISTS extracted_fields(
    id TEXT PRIMARY KEY,
    bid_id TEXT NOT NULL,
    price REAL,
    lead_time TEXT,
    payment_terms TEXT,
    price_hold_days INT,
    warranty_terms TEXT,
    raw_json TEXT
);


CREATE TABLE IF NOT EXISTS  flags (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    clause_text TEXT,
    flag_type TEXT,
    severity TEXT,
    source_location  TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE  IF NOT EXISTS audit_log(
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    input_ref TEXT,
    output_ref TEXT,
    user_note TEXT,
    created_at TEXT NOT null  DEFAULT  CURRENT_TIMESTAMP 
);

CREATE TABLE  IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    flag_id TEXT NOT NULL,
    reason TEXT,
    disputed_by TEXT,
    disputed_at TEXT NOT null  DEFAULT  CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);
