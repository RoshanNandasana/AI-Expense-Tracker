import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  BrainCircuit,
  Send,
  MessageSquare,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import { getAIAdvisorResponse } from '../services/mockAi';
import { useToast } from '../components/ui/Toast';

export const Dashboard = ({ expenses, deleteExpense, profile }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  
  // Chat Advisor Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `Hi ${profile.name.split(' ')[0]}! I've audited your transactions. Ask me anything about your spending habits, budgets, or saving strategies!` }
  ]);
  const [userInput, setUserInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  // AI Smart Suggestion based on current expenses
  const [aiSuggestion, setAiSuggestion] = useState('');

  useEffect(() => {
    // Simulate loading on page mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Current month spent
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthSpent = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetRemaining = Math.max(0, profile.budget - currentMonthSpent);
  const budgetUtilization = Math.min(100, Math.round((currentMonthSpent / profile.budget) * 100));

  // Generate dynamic dashboard insight
  useEffect(() => {
    if (expenses.length === 0) {
      setAiSuggestion("Add some expenses so I can generate intelligent insights on your spending habits!");
      return;
    }

    const categories = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    let topCat = '';
    let topAmt = 0;
    Object.entries(categories).forEach(([c, a]) => {
      if (a > topAmt) {
        topAmt = a;
        topCat = c;
      }
    });

    if (budgetUtilization > 85) {
      setAiSuggestion(`🚨 Danger zone! You've used ${budgetUtilization}% of your monthly budget. Freeze all luxury spending, particularly in ${topCat} ($${topAmt.toFixed(2)} spent).`);
    } else if (topCat) {
      setAiSuggestion(`💡 AI Financial Tip: Your top spending category is **${topCat}** ($${topAmt.toFixed(2)}). Trimming this by just 15% next month will save you **${formatCurrency(topAmt * 0.15)}**!`);
    }
  }, [expenses, budgetUtilization]);

  // Aggregate Category Chart Data
  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#8b5cf6', '#64748b'];

    return Object.entries(categoryTotals).map(([name, value], i) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: COLORS[i % COLORS.length]
    }));
  };

  // Aggregate Daily Trend Data (Last 7 Days)
  const getDailyData = () => {
    const dailyTotals = {};
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTotals[dateStr] = 0;
    }

    expenses.forEach(e => {
      const dateStr = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateStr in dailyTotals) {
        dailyTotals[dateStr] += e.amount;
      }
    });

    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2))
    }));
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setAiTyping(true);

    try {
      const response = await getAIAdvisorResponse(userMsg, expenses, profile.budget);
      setChatMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I had trouble parsing that. Please try again." }]);
    } finally {
      setAiTyping(false);
    }
  };

  const categoryData = getCategoryData();
  const dailyData = getDailyData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Dynamic Header Quick Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight my-0">
            Financial Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time analytics and predictive AI insights
          </p>
        </div>
        
        {/* Quick CTA Actions */}
        <div className="flex items-center space-x-3.5">
          <Button
            onClick={() => setIsChatOpen(true)}
            variant="outline"
            className="cursor-pointer font-semibold"
            icon={MessageSquare}
          >
            Ask AI Advisor
          </Button>
          <Button
            onClick={() => navigate('/receipts')}
            variant="secondary"
            className="cursor-pointer font-semibold"
            icon={Sparkles}
          >
            Scan Receipt
          </Button>
          <Button
            onClick={() => navigate('/add-expense')}
            variant="primary"
            className="cursor-pointer font-semibold"
            icon={Plus}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Spent */}
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                All-Time Expenses
              </span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {formatCurrency(totalSpent)}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Across {expenses.length} records
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Monthly Spent */}
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Monthly Spending
              </span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {formatCurrency(currentMonthSpent)}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Limit: {formatCurrency(profile.budget)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Budget Status */}
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Budget Remaining
              </span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {formatCurrency(budgetRemaining)}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {budgetUtilization}% utilized so far
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Budget Progress Indicator */}
        <Card className="glass-card flex flex-col justify-center">
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Budget Cap Status</span>
              <span className={budgetUtilization > 85 ? 'text-red-500 font-bold' : 'text-slate-500'}>
                {budgetUtilization}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  budgetUtilization > 85
                    ? 'bg-red-500'
                    : budgetUtilization > 60
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetUtilization}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1 leading-relaxed">
              Reset billing date: June 1st
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Smart Suggestion Banner (Premium Glass Feature) */}
      <div className="glass-panel backdrop-blur-lg border border-indigo-500/20 rounded-2xl p-5 flex items-center space-x-4 bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none"></div>
        <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
          <BrainCircuit className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Smart AI Advisor Suggestion</div>
          <p className="my-0 py-0">{aiSuggestion}</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="Your Expense Register is Empty"
          description="Build visual charts, unlock smart advisor strategies, and track budgets by recording your first expense entry!"
          actionText="Add Expense Now"
          onAction={() => navigate('/add-expense')}
        />
      ) : (
        <>
          {/* Charts Integration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Daily Spending Trends */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Spending Trends (Last 7 Days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 1, fill: '#6366f1' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Category Breakdown Pie */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-center relative">
                {categoryData.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm">No category distribution</div>
                ) : (
                  <div className="h-full flex flex-col justify-between">
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`$${value}`, 'Spent']}
                            contentStyle={{
                              background: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recharts Custom Legend Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium max-h-20 overflow-y-auto px-2">
                      {categoryData.map((item, i) => (
                        <div key={i} className="flex items-center space-x-1.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                          <span className="text-slate-400">(${item.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions Registry List Grid */}
          <Card className="glass-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
              <div>
                <CardTitle>Recent Register Transactions</CardTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Detailed ledger logs of spending activity.
                </p>
              </div>
              <Button
                onClick={() => navigate('/add-expense')}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 dark:border-slate-800"
                icon={Plus}
              >
                Add Manual
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-y border-slate-200/40 dark:border-slate-800/30 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="px-6 py-3.5">Vendor</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20">
                    {expenses.slice(0, 5).map((exp) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors duration-150 text-slate-700 dark:text-slate-300 font-medium group"
                      >
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-100 font-semibold">{exp.vendor || 'Unknown Vendor'}</span>
                            {exp.notes && (
                              <span className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate max-w-xs">{exp.notes}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getCategoryColor(
                              exp.category
                            )}`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(exp.date)}
                        </td>
                        <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="px-6 py-4.5 text-right pr-8">
                          <button
                            onClick={() => {
                              deleteExpense(exp.id);
                              toast.success("Expense successfully deleted.");
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/15 rounded-lg active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                            title="Delete transaction record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {expenses.length > 5 && (
                <div className="px-6 py-4 border-t border-slate-100/50 dark:border-slate-800/20 text-center">
                  <button
                    onClick={() => navigate('/analytics')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center cursor-pointer hover:underline"
                  >
                    View All Transaction Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* AI Slide-out Financial Chatbot (Premium Experience Overlay) */}
      {isChatOpen && (
        <>
          <div
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity duration-300"
          ></div>
          
          <div className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white dark:bg-slate-950 border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl z-50 flex flex-col animate-slide-in overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md">
                  <BrainCircuit className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none">AI Advisor Assistant</h3>
                  <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase block mt-1">Online & Auditing</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Chat Messages Workspace */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-200/30 dark:border-slate-850/40 whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-2xl rounded-tl-none px-4.5 py-3 border border-slate-200/30 dark:border-slate-850/40 flex items-center space-x-1.5 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Prebaked Quick Strategy suggestions */}
            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-200/30 dark:border-slate-800/10 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setUserInput("Am I overspending this month?");
                }}
                className="text-[10px] font-semibold bg-white dark:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 py-1 px-2.5 rounded-full cursor-pointer transition-all duration-150"
              >
                Budget Cap Analysis
              </button>
              <button
                onClick={() => {
                  setUserInput("Explain my highest spending category");
                }}
                className="text-[10px] font-semibold bg-white dark:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 py-1 px-2.5 rounded-full cursor-pointer transition-all duration-150"
              >
                Top Category Audit
              </button>
              <button
                onClick={() => {
                  setUserInput("Suggest a custom savings plan");
                }}
                className="text-[10px] font-semibold bg-white dark:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 py-1 px-2.5 rounded-full cursor-pointer transition-all duration-150"
              >
                Savings Tactics
              </button>
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask financial AI advisor..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-xl px-4 py-2.5 text-sm transition-all duration-150"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || aiTyping}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl active:scale-95 shadow-md shadow-indigo-600/20 cursor-pointer transition-all duration-150 inline-flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </>
      )}

    </div>
  );
};
