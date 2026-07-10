import re
from typing import NamedTuple


class ClauseFlag(NamedTuple):
    clause_text:str
    flag_type:str
    severity:str
    reason:str


RISKY_PATTERNS=[
    (r"unlimited liability","LIABILITY_RISK","HIGH","Exposes buyer to unlimited financial risk"),
    (r"no warranty","WARRANTY_RISK","HIGH","Vendor provides zero warranty coverage"),
    (r"payment within \d+ days","PAYMENT_RISK","MEDIUM","Short payment window detected"),
    (r"auto.?renew","CONTRACT_RISK","MEDIUM","Contract auto-renews without notice"),
    (r" sole discretion ","CONTROL_RISK","LOW","Vendor retains unilateral decision power"),
]


def scan_clauses(text:str)->list[ClauseFlag]:
    found=[]
    lower_text=text.lower()


    for pattern,flag_type ,severity,reason in RISKY_PATTERNS:
        match=re.search(pattern,lower_text)
        if match:
            found.append(ClauseFlag (
                clause_text=match.group(),
                flag_type=flag_type,
                severity=severity,
                reason=reason
            ))

    return found


if __name__ == "__main__":
    sample = "The vendor has unlimited liability. Payment within 7 days required."
    flags = scan_clauses(sample)
    for f in flags:
        print(f.severity, "|", f.flag_type, "|", f.clause_text)
