

def assess_price_hold(price_hold_days:int |None )->dict:
    if price_hold_days is None:
        return {"risk":"HIGH","reason":f"Price duration not specified"}
    
    if price_hold_days<30:
        return {"risk":"HIGH","reason":f"Price only held for {price_hold_days} days -very short"}

    if price_hold_days<90:
        return {"risk":"MEDIUM","reason":f"Price held for {price_hold_days} days - acceptable"}

    return {"risk":" LOW","reason":f"Price held for {price_hold_days} days -strong commitment"}