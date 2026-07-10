# 🧠 Procure360 — Session Context File
> भाऊ, हे file model बदलला तरी सगळं context ठेवेल!
> नवीन model ला सांग: "Read SESSION_CONTEXT.md and continue"

---

## 👤 Teaching Style
- Talk in **casual Marathi** — like talking to a close friend (bhau style)
- Example tone: "Kay karta rav, zhale ka? Chal puDhe jau!"
- Show **file structure** at the start of every explanation
- Give **multiple instructions in one reply** to save conversation turns
- Explain every line of code — beginner-friendly but not condescending
- Point out bugs gently, explain WHY not just WHAT

---

## 📦 Project: Procure360
**Type:** AI-powered Procurement Management System
**Stack:** FastAPI (Python) backend + React frontend
**DB:** SQLite (via app/storage/db.py using get_db())

### Project Structure
```
procure360/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app entry, routers registered
│       ├── config.py            # App config (title, version, CORS)
│       ├── routers/
│       │   ├── bids.py          # POST /bids/upload, GET /bids/compare/{batch_id}
│       │   ├── contracts.py     # Contract upload & flagging
│       │   ├── audit.py         # Audit log
│       │   └── disputes.py      # Dispute management
│       ├── services/
│       │   ├── bid_ranker.py    ✅ BUILT TODAY
│       │   ├── bid_extractor.py # Extracts fields from PDF text (via Gemini AI)
│       │   └── document_parser.py # PDF to raw text
│       ├── storage/
│       │   ├── db.py            # SQLite connection (get_db context manager)
│       │   └── schema.sql       # DB schema
│       └── integrations/        # External API integrations
├── frontend/
│   └── src/components/
│       └── DashBoard.jsx
└── SESSION_CONTEXT.md           # THIS FILE
```

---

## 🗄️ Database Schema (SQLite)
bids(id, batch_id, vendor_name, filename, uploaded_at)
extracted_fields(id, bid_id, price REAL, lead_time, payment_terms, price_hold_days, warranty_terms, raw_json)
flags(id, contract_id, clause_text, flag_type, severity, source_location, created_at)
audit_log(id, action_type, input_ref, output_ref, user_note, created_at)
disputes(id, flag_id, reason, disputed_by, disputed_at)
contracts(id, filename, uploaded_at)

---

## ✅ What We Built: bid_ranker.py
File: backend/app/services/bid_ranker.py

_score_bid(bid: dict) -> float
  Scores a single bid 0-10 based on:
  - price (50%): lower price = higher score, formula: max(0, 10 - price/10000) * 0.5
  - lead_time (30%): fewer days = higher score, formula: max(0, 10 - days/5) * 0.3
  - payment_terms (20%): net-60 gives +2.0, net-30 gives +1.0, others give 0

rank_bids(bids: list[dict]) -> list[dict]
  Takes list of bid dicts, scores each, sorts high to low, assigns rank 1,2,3
  Returns same list with added "score" and "rank" keys

Test Result (ran successfully):
  Rank 1: TechCorp  -> Score: 8.16  (price 20k, 14 days, Net-60)
  Rank 2: QuickVend -> Score: 6.08  (price 50k, 7 days, Net-30)
  Rank 3: CheapBid  -> Score: 4.80  (price 10k, 45 days, Net-15)

---

## ✅ What We Wired: GET /bids/compare/{batch_id}
File: backend/app/routers/bids.py

Old behaviour: Sorted bids only by price (dumb sort)
New behaviour: Uses rank_bids() for intelligent multi-factor scoring

SQL query selects: vendor_name, filename, price, lead_time, payment_terms
Then calls: ranked_bids = rank_bids(raw_bids)
Returns: {"batch_id": ..., "ranked_bids": [...scored and ranked...]}

---

## 🧑‍💻 Key Python Concepts Taught Today
- @dataclass: Auto-generates __init__, __repr__
- dataclass vs Pydantic BaseModel: dataclass has no validation; Pydantic has runtime validation + JSON serialization
- .get("key") or default: Safe dict access without KeyError
- filter(str.isdigit, text): Extract digits from string like "14 days" -> 14
- max(0, value): Clamp score to never go negative
- {**bid, "score": score}: Dict unpacking — copy + add key
- lambda x: x["score"]: Anonymous sort key function
- enumerate(list): Get index + value in loop
- List comprehension: [dict(row) for row in rows] = compact loop
- _underscore prefix: Convention for private/internal functions
- if __name__ == "__main__": Test block runs only when file executed directly

---

## 🚀 Server
uvicorn app.main:app --reload --port 8000
Swagger UI: http://127.0.0.1:8000/docs

---

## 📋 Next Steps (What is Left to Build)
- [x] contract_analyzer.py — analyze contract text for risky clauses
- [x] flag_detector.py — detect and flag suspicious terms
- [x] Frontend DashBoard.jsx — display ranked bids with scores
- [x] Add bid_id to SQL query in compare_bids for full traceability
- [x] Error handling in _score_bid (try/except for bad lead_time formats)

---

## 💡 How to Resume
Tell the new model exactly this:
"Read SESSION_CONTEXT.md in the project root (procure360 folder) and continue teaching me in Marathi bhau style. We were working on Procure360 backend. Continue from Next Steps."
