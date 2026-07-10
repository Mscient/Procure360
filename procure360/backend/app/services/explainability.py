"""
Explainability — Procure360
============================
Generates a human-readable explanation for a ranked bid, including
per-factor sub-scores if available from the 5-factor ranker.
"""


def explain_bid_score(bid: dict) -> str:
    """
    Build a clean, structured explanation string for a single ranked bid.
    Reads the 'score_breakdown' dict if present (populated by bid_ranker.py).
    """
    vendor  = bid.get('vendor_name', 'Unknown Vendor')
    score   = bid.get('score', 0)
    rank    = bid.get('rank', 'N/A')
    breakdown = bid.get('score_breakdown', {})

    lines = []

    # ── Headline ──
    lines.append(f"🏆 Rank #{rank} — {vendor}   Final Score: {score}/10")
    lines.append("─" * 45)

    # ── Key fields ──
    price = bid.get('price')
    if price:
        lines.append(f"💰  Price:          ${price:,.0f}")

    lead = bid.get('lead_time') or 'Not specified'
    lines.append(f"🚚  Lead Time:      {lead}")

    terms = bid.get('payment_terms') or 'Not specified'
    lines.append(f"📑  Payment Terms:  {terms}")

    warranty = bid.get('warranty_terms') or 'None'
    lines.append(f"🛡️  Warranty:       {warranty}")

    hold = bid.get('price_hold_days')
    lines.append(f"🔒  Price Hold:     {f'{hold} days' if hold else 'Not specified'}")

    # ── Score breakdown ──
    if breakdown:
        lines.append("")
        lines.append("📊  Score Breakdown (out of 10):")
        factor_labels = {
            'price':         ('💰 Price',         '40%'),
            'lead_time':     ('🚚 Lead Time',      '25%'),
            'payment_terms': ('📑 Payment Terms',  '15%'),
            'warranty':      ('🛡️  Warranty',       '10%'),
            'price_hold':    ('🔒 Price Hold',      '10%'),
        }
        for key, (label, weight) in factor_labels.items():
            sub = breakdown.get(key)
            if sub is not None:
                bar = _mini_bar(sub)
                lines.append(f"   {label:<22} {sub:>4}/10  {bar}  [{weight}]")

    # ── Verdict ──
    lines.append("")
    if rank == 1:
        lines.append("✅  RECOMMENDED — Best overall value across all factors.")
    elif score >= 7:
        lines.append("👍  Strong bid — consider if #1 vendor has capacity issues.")
    elif score >= 5:
        lines.append("⚠️  Average bid — review terms before proceeding.")
    else:
        lines.append("❌  Weak bid — significant risk factors identified.")

    return "\n".join(lines)


def _mini_bar(score: float, width: int = 8) -> str:
    """Render a tiny ASCII progress bar: score 0–10 → width chars."""
    filled = round((score / 10) * width)
    return "█" * filled + "░" * (width - filled)