from pydantic import BaseModel

class Transaction(BaseModel):
    step: int
    type: str  # e.g., 'PAYMENT', 'TRANSFER', 'CASH_OUT'
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
