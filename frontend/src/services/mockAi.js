/**
 * AI simulation service for receipt parsing and financial coach insights.
 */

const MOCK_RECEIPTS = [
  {
    vendor: "Whole Foods Market",
    amount: 142.50,
    category: "Food",
    date: new Date().toISOString().split('T')[0],
    notes: "Weekly organic groceries scan",
    items: [
      { name: "Organic Blueberries (x3)", price: 14.97 },
      { name: "Atlantic Salmon Fillet", price: 34.20 },
      { name: "Almond Milk (Unsweetened)", price: 4.89 },
      { name: "Organic Spinach", price: 3.99 },
      { name: "Avocados Bag", price: 6.99 },
      { name: "Grass-Fed New York Strip", price: 42.50 },
      { name: "Assorted Organic Veggies", price: 34.96 }
    ]
  },
  {
    vendor: "Apple Store - Infinite Loop",
    amount: 129.00,
    category: "Shopping",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    notes: "MagSafe Duo Charger and silicone case",
    items: [
      { name: "MagSafe Duo Charger", price: 79.00 },
      { name: "iPhone 15 Silicone Case - Storm Blue", price: 50.00 }
    ]
  },
  {
    vendor: "Shell Gas Station",
    amount: 48.75,
    category: "Transport",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    notes: "Regular unleaded fuel refill",
    items: [
      { name: "Fuel Grade 87 (12.5 gallons)", price: 43.75 },
      { name: "Monster Energy Drink", price: 3.00 },
      { name: "Orbit Spearmint Gum", price: 2.00 }
    ]
  },
  {
    vendor: "Netflix Subscription",
    amount: 22.99,
    category: "Entertainment",
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
    notes: "Monthly Premium Ultra HD subscription auto-renewed",
    items: [
      { name: "Premium Plan (4K Ultra HD)", price: 22.99 }
    ]
  }
];

/**
 * Simulate OCR receipt scanning and return structured JSON
 */
export const simulateReceiptScan = (fileName) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Pick a random receipt from MOCK_RECEIPTS
      const randomIndex = Math.floor(Math.random() * MOCK_RECEIPTS.length);
      const receipt = { ...MOCK_RECEIPTS[randomIndex] };
      
      // Update date to current or yesterday for realism
      if (Math.random() > 0.5) {
        receipt.date = new Date().toISOString().split('T')[0];
      }
      
      resolve({
        success: true,
        data: receipt,
        rawOcr: `
          WHOLE FOODS MARKET - STORE #10432
          2905 PEARL ST, BOULDER, CO 80301
          TEL: 303-545-6677
          
          DATE: ${receipt.date}  TIME: 14:32:01
          CASHIER: AMANDA_S
          
          * ORG BLUEBERRIES     3 @ 4.99     14.97  A
          * SALMON FILLET                  34.20  A
          * ALMOND MILK                     4.89  B
          * ORG SPINACH                     3.99  A
          * AVOCADOS BAG                    6.99  A
          * NY STRIP STEAK                 42.50  A
          * ORG VEG MIX                    34.96  A
          
          SUBTOTAL                        142.50
          TAX                              0.00
          TOTAL                           142.50
          
          CARD ENDING IN *4920
          AUTH CODE: 849302
          
          THANK YOU FOR SHOPPING AT WHOLE FOODS!
        `.trim()
      });
    }, 2500); // 2.5 second delay for realistic scanning
  });
};

/**
 * Generate AI-like advice based on active expenses
 */
export const getAIAdvisorResponse = (userMessage, expenses = [], monthlyBudget = 2000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msg = userMessage.toLowerCase();
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
      
      // Category analysis
      const categoryMap = {};
      expenses.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      });
      
      let highestCategory = 'N/A';
      let highestAmount = 0;
      Object.entries(categoryMap).forEach(([cat, amt]) => {
        if (amt > highestAmount) {
          highestAmount = amt;
          highestCategory = cat;
        }
      });

      let responseText = "";

      if (msg.includes("budget") || msg.includes("overspending") || msg.includes("spent") || msg.includes("limit")) {
        const percent = Math.round((totalSpent / monthlyBudget) * 100);
        if (percent > 85) {
          responseText = `🚨 **Warning:** You have spent **${percent}%** of your monthly budget ($${totalSpent.toFixed(2)} / $${monthlyBudget}). You only have **$${remainingBudget.toFixed(2)}** left for this billing cycle. I strongly suggest freezing non-essential **${highestCategory}** purchases immediately.`;
        } else if (percent > 60) {
          responseText = `⚠️ **Moderate spending:** You've utilized **${percent}%** of your $${monthlyBudget} budget. You are on track to finish the month close to your limit. Try optimizing your **${highestCategory}** expenses ($${highestAmount.toFixed(2)} spent so far) to save some cash.`;
        } else {
          responseText = `✅ **Great job!** You have used only **${percent}%** ($${totalSpent.toFixed(2)}) of your $${monthlyBudget} budget. You have a comfortable **$${remainingBudget.toFixed(2)}** cushion remaining. Your financial pace is excellent!`;
        }
      } else if (msg.includes("category") || msg.includes("where") || msg.includes("breakdown") || msg.includes("most")) {
        if (expenses.length === 0) {
          responseText = `You don't have any recorded expenses yet! Add some transactions or scan a receipt so I can break down your spending habits.`;
        } else {
          const breakdown = Object.entries(categoryMap)
            .map(([cat, amt]) => `• **${cat}**: $${amt.toFixed(2)} (${Math.round((amt / totalSpent) * 100)}%)`)
            .join('\n');
          responseText = `Here is your current category breakdown:\n\n${breakdown}\n\nYour highest expenditure is **${highestCategory}** at **$${highestAmount.toFixed(2)}**. Consider dialing back in this category to fast-track your savings.`;
        }
      } else if (msg.includes("save") || msg.includes("saving") || msg.includes("invest")) {
        responseText = `💡 **AI Financial Strategy:**\n\n1. **High-Yield Savings:** Keep 3-6 months of your average spending ($${(totalSpent || 500).toFixed(2)}) in an emergency fund.\n2. **The 50/30/20 Rule:** Allocate 50% of income to Needs, 30% to Wants (currently dominated by **${highestCategory}**), and 20% to Savings/Debt repayment.\n3. **Trim Subscriptions:** I noticed subscription renewals. Audit recurring payments to unlock $50-$100/month instantly!`;
      } else {
        responseText = `Hello! I am your **AI Financial Advisor**. I've analyzed your **${expenses.length} transactions** representing a total spend of **$${totalSpent.toFixed(2)}**.\n\nHere are some questions you can ask me:\n* *"Am I overspending this month?"*\n* *"What is my highest spending category?"*\n* *"How can I optimize my savings strategy?"*`;
      }

      resolve(responseText);
    }, 1200); // 1.2 second response delay
  });
};
