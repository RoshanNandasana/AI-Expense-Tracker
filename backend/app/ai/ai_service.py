import json
import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional

from app.config.settings import settings
from app.utils.helpers import clean_extracted_amount, parse_extracted_date

logger = logging.getLogger("app.ai.service")

class AIService:
    """
    Unified AI Service that handles receipt information extraction and
    personalized spending insights. Uses Gemini AI when a GEMINI_API_KEY is
    configured, and falls back to powerful local heuristics otherwise.
    """

    def __init__(self):
        self.categories = ["Bills", "Food", "Transport", "Shopping", "Entertainment", "Health", "Other"]

    async def parse_receipt_text(self, raw_text: str) -> dict:
        """
        Parses OCR receipt text to extract structural info: Merchant, Amount, Date, Category.
        Uses Gemini API when GEMINI_API_KEY is set, otherwise falls back to regex heuristics.
        """
        prompt = (
            "You are an expert receipt extraction AI. Parse the following OCR text and extract "
            "the merchant name, total transaction amount, date, and category. "
            f"Allowed categories are: {', '.join(self.categories)}.\n\n"
            "Return ONLY a clean JSON object conforming EXACTLY to the following schema:\n"
            "{\n"
            '  "merchant": "Name of the merchant or store",\n'
            '  "amount": 12.34,\n'
            '  "date": "YYYY-MM-DD",\n'
            '  "category": "One of the allowed categories",\n'
            '  "description": "Short summary of items bought"\n'
            "}\n\n"
            f"OCR TEXT TO PARSE:\n{raw_text}"
        )

        # 1. Try Gemini API
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                logger.info("Using Gemini API for receipt parsing...")
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
                parsed_json = self._extract_json_from_text(response.text)
                if parsed_json:
                    return self._validate_and_sanitize_parsed_receipt(parsed_json, raw_text)
            except Exception as e:
                logger.error(f"Gemini API receipt parsing failed: {e}. Falling back.")

        # Fallback: Local Regex Parsing Heuristics
        logger.info("Running local regex heuristic receipt parser...")
        return self._heuristic_parse_receipt(raw_text)

    async def generate_spending_insights(self, expenses: List[dict], budget: float) -> dict:
        """
        Analyzes a user's expense history and returns budget predictions, warnings,
        and actionable saving recommendations. Uses Gemini when available, otherwise
        falls back to the local data-driven insights engine.
        """
        if not expenses:
            return {
                "will_exceed": False,
                "predicted_spend": 0.0,
                "confidence": "High",
                "insight": "Add some expenses to generate spending patterns and AI insights!"
            }

        # Calculate metrics
        total_spent = sum(exp.get("amount", 0.0) for exp in expenses)
        
        # Breakdown by category
        cat_map = {}
        for exp in expenses:
            c = exp.get("category", "Other")
            cat_map[c] = cat_map.get(c, 0.0) + exp.get("amount", 0.0)
            
        sorted_cats = sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
        top_category = sorted_cats[0][0] if sorted_cats else "None"
        top_category_amount = sorted_cats[0][1] if sorted_cats else 0.0
        
        # Prepare context data for LLM
        history_summary = []
        for exp in expenses[:30]:  # Give last 30 expenses for token economy
            history_summary.append(
                f"- Date: {exp.get('expense_date')}, Merchant: {exp.get('merchant')}, "
                f"Amount: {exp.get('amount')}, Category: {exp.get('category')}"
            )
            
        history_text = "\n".join(history_summary)
        
        prompt = (
            "You are a professional financial planner AI. Analyze this user's monthly expense data "
            f"and budget limit. Provide spending trends, predict monthly budget usage, and "
            "provide 3 highly-actionable saving insights.\n\n"
            f"USER BUDGET LIMIT: ${budget:.2f}\n"
            f"TOTAL SPENT THIS MONTH: ${total_spent:.2f}\n"
            f"TOP SPENDING CATEGORY: {top_category} (${top_category_amount:.2f})\n\n"
            f"RECENT EXPENSE HISTORY:\n{history_text}\n\n"
            "Return ONLY a clean JSON object conforming EXACTLY to the following schema:\n"
            "{\n"
            '  "will_exceed": true,\n'
            '  "predicted_spend": 1250.45,\n'
            '  "confidence": "High",\n'
            '  "insight": "A comprehensive 3-paragraph summary of spending patterns. Include warnings, predicted run rate, and 3 bulleted actionable saving tips tailored to their history."\n'
            "}"
        )

        # 1. Try Gemini API
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                logger.info("Using Gemini API for insights...")
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
                parsed_json = self._extract_json_from_text(response.text)
                if parsed_json:
                    return parsed_json
            except Exception as e:
                logger.error(f"Gemini API insights generation failed: {e}. Falling back.")

        # Fallback: Local Data-Science Insights Engine
        logger.info("Running local data-driven insights engine...")
        return self._heuristic_generate_insights(expenses, budget, total_spent, top_category, top_category_amount)

    def _extract_json_from_text(self, text: str) -> Optional[dict]:
        """Filters model output to locate and parse clean JSON objects."""
        if not text:
            return None
        try:
            # Look for JSON markdown block
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            # Direct parse
            return json.loads(text.strip())
        except Exception:
            # Fallback regex extraction of anything inside curly braces
            try:
                curly_match = re.search(r"(\{.*\})", text, re.DOTALL)
                if curly_match:
                    return json.loads(curly_match.group(1))
            except Exception as e:
                logger.error(f"Failed to extract JSON from raw text response: {e}")
        return None

    def _validate_and_sanitize_parsed_receipt(self, data: dict, raw_text: str = "") -> dict:
        """Validates AI receipt outputs to guarantee category compliance and correct types."""
        sanitized = {}
        merchant = str(data.get("merchant", "")).strip()
        
        # If Gemini returned generic unknown name, try to extract a better candidate via heuristics
        generic_unknowns = ["unknown", "unknown merchant", "unparsed", "none", "null", "n/a", "unknown_merchant", "unparsed merchant"]
        if (not merchant or merchant.lower() in generic_unknowns) and raw_text:
            logger.info("Parsed merchant was unknown. Attempting heuristic merchant extraction...")
            try:
                heuristic_data = self._heuristic_parse_receipt(raw_text)
                merchant = heuristic_data.get("merchant", "Unknown Merchant")
            except Exception as e:
                logger.error(f"Heuristic fallback extraction failed: {e}")
                
        sanitized["merchant"] = merchant or "Unknown Merchant"
        
        # Clean amount
        raw_amount = data.get("amount", 0.0)
        try:
            sanitized["amount"] = float(raw_amount)
        except (ValueError, TypeError):
            sanitized["amount"] = clean_extracted_amount(str(raw_amount))
            
        # Clean date
        raw_date = data.get("date", "")
        sanitized["date"] = parse_extracted_date(str(raw_date))
        
        # Clean category
        raw_category = str(data.get("category", "Other")).strip()
        matched_cat = next((c for c in self.categories if c.lower() == raw_category.lower()), "Other")
        sanitized["category"] = matched_cat
        
        sanitized["description"] = str(data.get("description", "")).strip()
        return sanitized

    def _heuristic_parse_receipt(self, text: str) -> dict:
        """
        Robust rule-based parsing engine for receipt text scans.
        Runs when no Gemini API key is configured or when the API call fails.
        """
        lines = text.split('\n')
        merchant = "Unknown Merchant"
        amount = 0.0
        date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        category = "Other"
        description = "Receipt Scan"

        # Heuristic 1: Extract candidate lines for the Merchant name
        merchant_candidates = []
        for line in lines:
            cleaned = line.strip()
            # Clean up leading/trailing symbols, punctuation, or formatting remnants
            cleaned = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', cleaned).strip()
            if not cleaned:
                continue
                
            cleaned_lower = cleaned.lower()
            
            # Skip lines that are purely numeric, currency, symbols, or phone numbers
            if re.match(r'^[\d\s\-\+\(\)\*#\.,\\/:]+$', cleaned):
                continue
                
            # Skip lines that look like dates or times
            if re.search(r'\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b', cleaned):
                continue
                
            # Skip lines that are generic receipt headers or fields (whole words / prefixes)
            is_generic_label = False
            for pattern in [r'^total\b', r'^subtotal\b', r'^invoice\b', r'^receipt\b', r'^tax\b', r'^tel\b', r'^phone\b', r'^date\b', r'^welcome\b', r'^thank\b', r'^customer\s+copy\b', r'^merchant\s+copy\b', r'^duplicate\b', r'^cashier\b']:
                if re.match(pattern, cleaned_lower):
                    is_generic_label = True
                    break
            if is_generic_label:
                continue
                
            # Skip typical address lines
            if re.search(r'^\d+\s+[a-zA-Z0-9\s]+(street|st|avenue|ave|road|rd|highway|hwy|way|boulevard|blvd|drive|dr)\b', cleaned_lower):
                continue
                
            # Skip line items with quantities and prices (e.g. "1 item 5.00")
            if re.search(r'^\d+\s+[a-zA-Z\s]+\d+[\.,]\d{2}', cleaned):
                continue
                
            merchant_candidates.append(cleaned)
            
        if merchant_candidates:
            merchant = merchant_candidates[0]
        else:
            # Secondary fallback: just pick first non-empty line that doesn't look like pure numbers/symbols
            for line in lines:
                cleaned = line.strip()
                if cleaned and not re.match(r'^[\d\s\-\+\(\)\*#\.,\\/:]+$', cleaned):
                    merchant = cleaned
                    break
                    
        # Limit merchant length
        if len(merchant) > 50:
            merchant = merchant[:50].strip() + "..."

        # Heuristic 2: Search for amounts (Total, Grand Total, Cash, Charged)
        amount_matches = []
        for line in lines:
            line_lower = line.lower()
            # Match formats like $10.00, USD 15.00, or 25.50
            matches = re.findall(r'(?:\$|usd|eur)?\s*(\d+[\.,]\d{2})\b', line_lower)
            if matches:
                for match in matches:
                    val = clean_extracted_amount(match)
                    # Check if line contains keywords indicating grand total (avoid subtotal)
                    is_grand_total = False
                    if re.search(r'\b(grand\s+total|total\s+paid|amount\s+paid|charged)\b', line_lower):
                        is_grand_total = True
                    elif re.search(r'\btotal\b', line_lower) and not re.search(r'\bsubtotal\b', line_lower):
                        is_grand_total = True
                        
                    if is_grand_total:
                        amount = val
                        break
                    amount_matches.append(val)
            if amount > 0.0:
                break
                
        # If no explicit 'total' line was matched, pick the largest found value (usually the total)
        if amount == 0.0 and amount_matches:
            amount = max(amount_matches)

        # Heuristic 3: Dates search
        for line in lines:
            # Look for YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
            date_match = re.search(r'\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b', line)
            if date_match:
                date = parse_extracted_date(date_match.group(1))
                break

        # Heuristic 4: Category classification from merchant or item keywords
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["starbucks", "coffee", "restaurant", "cafe", "food", "mcdonald", "diner", "pizza", "burger", "whole foods"]):
            category = "Food"
        elif any(kw in text_lower for kw in ["uber", "taxi", "gas", "shell", "chevron", "fuel", "chevron", "transit", "subway", "train"]):
            category = "Transport"
        elif any(kw in text_lower for kw in ["electric", "water", "coned", "rent", "apartment", "bill", "invoice", "utility", "phone", "verizon"]):
            category = "Bills"
        elif any(kw in text_lower for kw in ["netflix", "spotify", "hulu", "cinema", "movie", "ticket", "game", "steam"]):
            category = "Entertainment"
        elif any(kw in text_lower for kw in ["pharmacy", "medical", "doctor", "health", "gym", "equinox", "cvs", "hospital"]):
            category = "Health"
        elif any(kw in text_lower for kw in ["amazon", "walmart", "target", "shopping", "store", "mall", "nordstrom", "ikea"]):
            category = "Shopping"

        return {
            "merchant": merchant,
            "amount": amount,
            "date": date,
            "category": category,
            "description": description
        }

    def _heuristic_generate_insights(self, expenses: List[dict], budget: float, total_spent: float, top_category: str, top_category_amount: float) -> dict:
        """
        Generates fully-featured local data-driven saving recommendations.
        Ensures users get beautifully presented statistics even without API keys.
        """
        # Calculate projection
        today = datetime.now(timezone.utc).day
        days_in_month = 30 # standard approximation
        
        # Simple projection based on run-rate
        daily_rate = total_spent / max(today, 1)
        predicted_spend = daily_rate * days_in_month
        will_exceed = predicted_spend > budget
        
        # Generate dynamic suggestions
        percentage_of_budget = (total_spent / budget) * 100 if budget > 0 else 100
        
        insights = []
        insights.append(f"📊 **Monthly Review**: You have consumed **{percentage_of_budget:.1f}%** of your monthly budget limit (${budget:.2f}) so far.")
        
        if will_exceed:
            insights.append(
                f"⚠️ **Budget Advisory**: Based on your average daily spend rate of **${daily_rate:.2f}**, you are on track to spend "
                f"**${predicted_spend:.2f}** by the end of the month, which will exceed your budget by **${(predicted_spend - budget):.2f}**."
            )
        else:
            insights.append(
                f"✅ **Good News**: You are pacing beautifully! At your current spending velocity, you are projected to reach "
                f"**${predicted_spend:.2f}** by the end of the month, leaving **${(budget - predicted_spend):.2f}** intact."
            )
            
        if top_category != "None":
            insights.append(
                f"💡 **Saving Recommendations**:\n"
                f"* **Category Optimization**: Your highest spending category is **{top_category}** at **${top_category_amount:.2f}**. "
                f"Trimming your spending in {top_category} by just 10% would save you **${(top_category_amount * 0.1):.2f}**.\n"
                f"* **Pacing Control**: Limit non-essential transactions over the next week to keep your run-rate inside the green zone.\n"
                f"* **Payment Auditing**: Review your recurrent digital billing (e.g. active subscription cards) to cancel any unused utilities."
            )

        return {
            "will_exceed": will_exceed,
            "predicted_spend": round(predicted_spend, 2),
            "confidence": "Medium",
            "insight": "\n\n".join(insights)
        }

ai_service = AIService()
