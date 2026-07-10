"""
Bid Ranker — Procure360
=======================
Scores and ranks vendor bids using a 5-factor weighted algorithm.

Factor weights (sum = 1.0):
  price          40%  — lower is better
  lead_time      25%  — fewer days is better
  payment_terms  15%  — net-60 > net-30 > other
  warranty       10%  — any warranty mention = full marks
  price_hold     10%  — longer hold = lower risk

Each factor produces a 0–10 sub-score. The weighted sum is the final score,
also normalised to 0–10 and rounded to 2dp.
"""

import re


# ── Weights ──────────────────────────────────────────────────────────────
WEIGHT_PRICE         = 0.40
WEIGHT_LEAD_TIME     = 0.25
WEIGHT_PAYMENT_TERMS = 0.15
WEIGHT_WARRANTY      = 0.10
WEIGHT_PRICE_HOLD    = 0.10


def _score_price(price) -> float:
    """Lower price → higher score.  $100 k = 0.  $0 = 10."""
    if not price or price <= 0:
        return 5.0   # unknown price: neutral mid-score
    return max(0.0, 10.0 - (price / 10_000))


def _score_lead_time(lead_time: str) -> float:
    """Fewer delivery days → higher score.  50+ days = 0."""
    if not lead_time:
        return 5.0   # unknown lead time: neutral
    try:
        # Extract first integer found, e.g. "4 weeks" → 4, "14 days" → 14
        digits = re.search(r'\d+', lead_time)
        if not digits:
            return 5.0
        raw = int(digits.group())
        # Normalise: weeks are ~7 days each
        days = raw * 7 if any(w in lead_time.lower() for w in ('week', 'wk')) else raw
        return max(0.0, 10.0 - (days / 5.0))
    except Exception:
        return 5.0


def _score_payment_terms(terms: str) -> float:
    """Net-60 (buyer-friendly) > Net-30 > other."""
    if not terms:
        return 0.0
    t = terms.lower()
    if '60' in t:   return 10.0
    if '45' in t:   return 7.0
    if '30' in t:   return 5.0
    if '15' in t:   return 2.0
    if 'advance' in t or 'upfront' in t: return 0.0
    return 3.0   # unrecognised terms: below average


def _score_warranty(warranty: str) -> float:
    """Any warranty mention = full marks. None = 0."""
    if not warranty or str(warranty).lower() in ('null', 'none', ''):
        return 0.0
    return 10.0


def _score_price_hold(price_hold_days) -> float:
    """Longer price commitment = lower procurement risk = higher score."""
    if price_hold_days is None:
        return 0.0   # no price hold = HIGH risk
    try:
        days = int(price_hold_days)
    except (TypeError, ValueError):
        return 0.0
    if days >= 180: return 10.0
    if days >= 90:  return 8.0
    if days >= 60:  return 6.0
    if days >= 30:  return 4.0
    return max(0.0, days / 3.0)


# ── Public API ────────────────────────────────────────────────────────────

def _score_bid(bid: dict) -> dict:
    """
    Score a single bid across all 5 factors.
    Returns a dict with the total score and individual sub-scores.
    """
    sub_price    = _score_price(bid.get('price'))
    sub_lead     = _score_lead_time(bid.get('lead_time', ''))
    sub_terms    = _score_payment_terms(bid.get('payment_terms', ''))
    sub_warranty = _score_warranty(bid.get('warranty_terms', ''))
    sub_hold     = _score_price_hold(bid.get('price_hold_days'))

    total = (
        sub_price    * WEIGHT_PRICE         +
        sub_lead     * WEIGHT_LEAD_TIME     +
        sub_terms    * WEIGHT_PAYMENT_TERMS +
        sub_warranty * WEIGHT_WARRANTY      +
        sub_hold     * WEIGHT_PRICE_HOLD
    )

    return {
        'score':         round(min(10.0, total), 2),
        'score_breakdown': {
            'price':         round(sub_price,    2),
            'lead_time':     round(sub_lead,     2),
            'payment_terms': round(sub_terms,    2),
            'warranty':      round(sub_warranty, 2),
            'price_hold':    round(sub_hold,     2),
        }
    }


def rank_bids(bids: list[dict]) -> list[dict]:
    """
    Score and rank a list of bid dicts.
    Adds 'score', 'score_breakdown', and 'rank' keys to each bid.
    Returns sorted list (rank 1 = best).
    """
    scored = []
    for bid in bids:
        result = _score_bid(bid)
        scored.append({**bid, **result})

    scored.sort(key=lambda x: x['score'], reverse=True)

    for i, bid in enumerate(scored):
        bid['rank'] = i + 1

    return scored
