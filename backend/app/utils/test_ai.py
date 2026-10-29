import asyncio
import sys
import os

# Append parent dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ai.ai_service import ai_service
from app.config.settings import settings

async def test_ai_integration():
    print("==================================================")
    print("         AI Service Integration Validator         ")
    print("==================================================")
    
    # 1. Show Active Configuration
    has_gemini = bool(settings.GEMINI_API_KEY.strip())
    
    print(f"Configured Gemini API Key: {'[SET]' if has_gemini else '[NOT SET]'}")
    
    if not has_gemini:
        print("\n[NOTE] No Gemini key configured. The system will run in local Heuristic Mode.")
    else:
        print("\n[OK] The system will use Google Gemini!")

    # 2. Define Sample OCR text
    sample_receipt_text = (
        "STARBUCKS COFFEE STORE #3829\n"
        "206-555-0199\n"
        "SEATTLE, WA 98101\n"
        "\n"
        "DATE: 2026-05-29 08:32 AM\n"
        "INVOICE: 94819\n"
        "\n"
        "1  ICED CARAMEL MACCHIATO   5.75\n"
        "1  WARM BUTTER CROISSANT     3.50\n"
        "SUBTOTAL                   9.25\n"
        "TAX 8.5%                   0.79\n"
        "TOTAL PAID                10.04\n"
        "\n"
        "PAID BY VISA ************4829\n"
        "THANK YOU!"
    )
    
    print("\nRunning test parse on sample OCR receipt text...")
    print("--------------------------------------------------")
    
    try:
        # Run service parsing
        result = await ai_service.parse_receipt_text(sample_receipt_text)
        
        print("\n--- EXTRACTED STRUCTURED DATA ---")
        print(f"Merchant Name:  {result.get('merchant')}")
        print(f"Total Amount:   ${result.get('amount')}")
        print(f"Date:           {result.get('date')}")
        print(f"Category:       {result.get('category')}")
        print(f"Description:    {result.get('description')}")
        print("--------------------------------------------------")
        print("[SUCCESS] AI Extraction test completed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] AI Test Failed: {e}")
        
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_ai_integration())
