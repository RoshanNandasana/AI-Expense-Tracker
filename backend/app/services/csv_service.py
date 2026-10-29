import io
import csv
from typing import List

def generate_expenses_csv(expenses: List[dict]) -> io.StringIO:
    """
    Takes a list of expense dicts and generates an in-memory CSV file.
    Returns an io.StringIO buffer containing the compiled CSV data.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header
    writer.writerow([
        "Expense ID", 
        "Date", 
        "Merchant", 
        "Amount", 
        "Category", 
        "Payment Method", 
        "Description", 
        "Created At"
    ])
    
    # Write Data
    for expense in expenses:
        writer.writerow([
            expense.get("id", ""),
            expense.get("expense_date", ""),
            expense.get("merchant", ""),
            expense.get("amount", 0.0),
            expense.get("category", ""),
            expense.get("payment_method", ""),
            expense.get("description", ""),
            expense.get("created_at", "")
        ])
        
    output.seek(0)
    return output
