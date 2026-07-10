def explain_bid_score(bid:dict)->str:
    lines=[]
    lines.append(f"Vendor:{bid.get('vendor_name','Unknown')}")
    lines.append(f"Final Score:{bid.get('score',0)}/10")
    lines.append(f"Rank:{bid.get('rank','N/A')}")
    lines.append("___")


    price=bid.get("price")
    if price:
        lines.append(f"Price :${price:,.0f}")
    lead=bid.get("lead_time","Not specified")
    lines.append(f"Lead Time:{lead}")

    terms=bid.get("payment_terms","Not specified")
    lines.append(f"Payment Terms:{terms}")

    return "\n".join(lines)
 