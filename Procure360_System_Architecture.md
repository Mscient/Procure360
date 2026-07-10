# Procure360 — System Architecture (Design Only)

This document lays out the **file-by-file structure** of Procure360 for team review before any code is written. It covers:
- Modules 1 & 2 (**Bid Comparison + Price-Hold Risk**, **Contract Risk Scanner**) — scoped to be actually built for Stage 1
- Modules 3 & 4 (**PO–Invoice Reconciliation**, **Vendor Trust & Fraud Signal**) — specified as roadmap, not built yet
- The reliability/accountability layer (explainability, audit log, dispute mechanism) — woven through both

**Stack choice:** Python (FastAPI) backend for document parsing + LLM extraction, React frontend for the dashboard, SQLite for the hackathon (swappable to Postgres later). This is fast to build solo/small-team and keeps every extraction step inspectable — important given the accountability goals.

---

## 1. Top-Level Repository Layout

```
procure360/
├── README.md
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── data/
│   │   ├── storage/
│   │   └── integrations/        (stubs only — see Section 5)
│   └── tests/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       └── api/
└── docs/
    ├── architecture.md          (this file)
    └── api_spec.md
```

---

## 2. Backend — File by File

### `app/main.py`
Entry point. Creates the FastAPI app, mounts all routers (`bids`, `contracts`, `audit`, `disputes`), enables CORS for the frontend.

### `app/config.py`
Central config: LLM API key, upload size limits, path to sample data, SQLite file path. Single source of truth so nothing is hardcoded across services.

### `app/models/` — Data Schemas
| File | Purpose |
|---|---|
| `bid.py` | Schema for a single extracted bid: vendor name, price, lead time, payment terms, price-hold period, warranty terms |
| `contract_flag.py` | Schema for one contract risk flag: clause text, flag type, severity, cited source location |
| `audit_log.py` | Schema for one audit entry: timestamp, action type, input reference, output/flag reference, user (if disputed) |
| `vendor.py` | Schema for vendor identity + running trust metadata (placeholder fields for Module 4, unused in Stage 1) |

### `app/routers/` — API Endpoints
| File | Endpoints | Purpose |
|---|---|---|
| `bids.py` | `POST /bids/upload`, `GET /bids/compare/{batch_id}` | Accepts multiple bid files for one RFQ batch, returns ranked comparison table |
| `contracts.py` | `POST /contracts/upload`, `GET /contracts/{id}/flags` | Accepts one contract file, returns list of risk flags |
| `audit.py` | `GET /audit`, `GET /audit/export` | Returns/exports the full audit trail |
| `disputes.py` | `POST /disputes/{flag_id}` | Marks a flag as disputed/overridden by a human, logs the override |

### `app/services/` — Core Logic (the actual "brain")
| File | Purpose |
|---|---|
| `document_parser.py` | Extracts raw text from uploaded PDF/spreadsheet bids and contracts (shared by both modules) |
| `bid_extractor.py` | Prompts the LLM to pull structured fields (price, lead time, terms) out of raw bid text into JSON |
| `price_hold_risk.py` | Rule-based check: compares a bid's quoted price-hold period against `material_cost_index.json` to flag unrealistic holds |
| `bid_ranker.py` | Combines price, extracted terms, and price-hold risk into one ranked comparison; scoring logic is transparent (weighted, not black-box) |
| `contract_scanner.py` | Prompts the LLM to extract clauses from contract text and diff them against `standard_clause_templates.json` |
| `clause_templates.py` | Loader/helper for the standard clause reference data used by `contract_scanner.py` |
| `explainability.py` | Shared helper used by **both** modules — attaches the exact source clause/field to every flag so nothing is a bare score |
| `audit_logger.py` | Shared helper — writes a timestamped entry to the audit log every time an extraction runs or a flag is raised/disputed |

### `app/data/` — Reference & Sample Data
| File/Folder | Purpose |
|---|---|
| `sample_bids/` | Synthetic bid PDFs + publicly available GeM tender documents used as realistic demo input |
| `sample_contracts/` | Synthetic sample contracts for the demo |
| `standard_clause_templates.json` | Baseline "expected" clause language/thresholds (payment terms, liability caps) used by the Contract Risk Scanner |
| `material_cost_index.json` | Reference material cost volatility data used by the Price-Hold Risk check |

### `app/storage/`
| File | Purpose |
|---|---|
| `db.py` | SQLite connection setup |
| `schema.sql` | Table definitions: `bids`, `extracted_fields`, `flags`, `disputes`, `audit_log`, `vendors` (the last unused until Module 4) |

### `app/integrations/` — Stubs Only (Not Implemented in Stage 1)
| File | Purpose |
|---|---|
| `kaya_connector.py` | Placeholder for future Kaya AI platform data integration — stub function + comments only |
| `gem_data_adapter.py` | Placeholder for future GeM ERP/API integration — stub function + comments only |

### `tests/`
`test_bid_extractor.py`, `test_contract_scanner.py`, `test_price_hold_risk.py` — basic unit tests confirming extraction and flagging logic behave on sample data.

---

## 3. Frontend — File by File

### `src/App.jsx`
Top-level routing: Dashboard, Bid Comparison, Contract Review, Audit Log, Roadmap.

### `src/pages/`
| File | Purpose |
|---|---|
| `BidComparison.jsx` | Upload UI + ranked comparison table + price-hold risk badges |
| `ContractReview.jsx` | Upload UI + list of flagged clauses, each showing its cited source text |
| `AuditLog.jsx` | Searchable, exportable table of every extraction/flag/dispute event |
| `Roadmap.jsx` | **Static, non-functional mockup screens** for Module 3 (PO–Invoice) and Module 4 (Vendor Trust) — used only in the video/demo to show the full vision |

### `src/components/`
| File | Purpose |
|---|---|
| `FileUploader.jsx` | Drag-and-drop upload widget, reused by both Bid Comparison and Contract Review |
| `ComparisonTable.jsx` | Renders the ranked bid table |
| `RiskFlagCard.jsx` | Renders one flag: description + cited clause/field + a "Dispute this flag" button (calls `disputes.py`) |
| `ConfidenceBadge.jsx` | Small visual indicator of flag severity (High/Medium/Low) |
| `Navbar.jsx` | Shared navigation |

### `src/api/client.js`
Thin fetch wrapper for all backend calls — single place to change the base URL later (e.g. when deployed).

---

## 4. Data Flow (Stage 1 — Modules 1 & 2)

```
Bid PDFs ──▶ document_parser.py ──▶ bid_extractor.py ──▶ price_hold_risk.py
                                                              │
                                                              ▼
                                                       bid_ranker.py ──▶ explainability.py ──▶ audit_logger.py
                                                              │
                                                              ▼
                                              GET /bids/compare/{batch_id} ──▶ ComparisonTable.jsx

Contract PDF ──▶ document_parser.py ──▶ contract_scanner.py ──▶ clause_templates.py (diff)
                                                              │
                                                              ▼
                                                    explainability.py ──▶ audit_logger.py
                                                              │
                                                              ▼
                                              GET /contracts/{id}/flags ──▶ RiskFlagCard.jsx
```

Every path through the system passes through `explainability.py` and `audit_logger.py` before reaching the frontend — this is what makes the accountability story real rather than a claim: the flag literally cannot be produced without a citation and a log entry attached.

---

## 5. Modules 3 & 4 — Planned File Structure (Not Built for Stage 1)

Presented here so the team can see the intended shape without committing build time yet.

**Module 3 — PO–Invoice Reconciliation** (future additions)
- `services/po_invoice_matcher.py` — 3-way match logic (PO vs. goods receipt vs. invoice)
- `models/purchase_order.py`, `models/invoice.py`
- `routers/reconciliation.py`

**Module 4 — Vendor Trust & Fraud Signal** (future additions)
- `services/vendor_trust_scorer.py` — aggregates discrepancy/delay history per vendor
- `services/fraud_signal.py` — duplicate billing / price-inflation detection vs. vendor's own history
- Feeds back into `bid_ranker.py` via a new `vendor_trust` field once implemented

---

## 6. What This Structure Is Optimized For

- **Separation of extraction vs. scoring vs. explanation** — each is its own file, so any one piece (e.g. the price-hold rule) can be reviewed or swapped without touching the LLM extraction logic.
- **Nothing reaches the frontend without an audit entry** — `audit_logger.py` sits on every path, by construction, not by convention.
- **Modules 3 & 4 are additive, not disruptive** — they slot into the existing `services/`, `models/`, `routers/` folders rather than requiring a rewrite.

Team: review this structure and flag anything that should move, merge, or split before we start writing actual code.
