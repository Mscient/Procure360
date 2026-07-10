 




def _score_bid(bid:dict)->float:
    score=0.0
    price=bid.get("price") or 0
    if price>0:
        price_score=max(0,10-(price/10000))
        score+=price_score*0.5



    lead_time=bid.get("lead_time") or ""
    if lead_time:
        try:
            days=int("".join(filter(str.isdigit,lead_time)))
            lead_score=max(0,10-(days/5))
            score+=lead_score*0.3
        except Exception as e:
            pass
            
    
    terms=bid.get("payment_terms") or ""
    if "60" in terms:
        score+=2.0
    elif "30" in terms:
        score+=1.0

    total_score=round(score,2)
    return total_score



def rank_bids(bids:list[dict])->list[dict]:

    scored=[]
    for bid in bids:
        score=_score_bid(bid)
        scored.append({**bid,"score":score})

    scored.sort(key=lambda x:x["score"],reverse=True)

    for i,bid in enumerate(scored):
        bid["rank"]=i+1

    return scored








        
