
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Tag, ShieldAlert, ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const AddExpense = ({ addExpense }) => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'Food', label: 'Food & Dining' },
    { value: 'Bills', label: 'Bills & Utilities' },
    { value: 'Transport', label: 'Transport & Travel' },
    { value: 'Shopping', label: 'Shopping' },
    { value: 'Entertainment', label: 'Entertainment & Leisure' },
    { value: 'Health', label: 'Health & Fitness' },
    { value: 'Others', label: 'Others' }
  ];

  const paymentMethods = [
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Digital Wallet', label: 'Apple / Google Pay' }
  ];

  const validate = () => {
    const newErrors = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than zero";
    }
    if (!vendor.trim()) {
      newErrors.vendor = "Please specify the merchant or vendor";
    }
    if (!date) {
      newErrors.date = "Please select a date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        vendor: vendor.trim(),
        category,
        date,
        paymentMethod,
        notes: notes.trim(),
      });
      toast.success('Expense recorded successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header back navigate controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight my-0">
            Record New Expense
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manually ledger structured transaction logs.
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Primary input amount - Styled extra large */}
            <div className="flex flex-col items-center justify-center space-y-2 border-b border-slate-150/50 dark:border-slate-800/40 pb-6 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Amount</span>
              <div className="relative flex items-center justify-center max-w-xs">
                <span className="absolute left-3 text-3xl font-extrabold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full bg-transparent text-slate-900 dark:text-white text-center text-4xl font-extrabold focus:outline-none placeholder-slate-300 dark:placeholder-slate-700 pl-8 ${
                    errors.amount ? 'text-red-500' : 'text-slate-900'
                  }`}
                  required
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 font-semibold">{errors.amount}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Vendor */}
              <Input
                label="Merchant / Vendor"
                id="vendor"
                placeholder="e.g. Whole Foods"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                error={errors.vendor}
                required
              />

              {/* Date */}
              <Input
                label="Transaction Date"
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
                required
                icon={Calendar}
              />

              {/* Category */}
              <Select
                label="Expense Category"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories}
                icon={Tag}
              />

              {/* Payment Method */}
              <Select
                label="Payment Method"
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={paymentMethods}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col space-y-1.5 w-full">
              <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Additional Notes
              </label>
              <textarea
                id="notes"
                placeholder="Add shopping items, context, or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm p-4"
              />
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-end space-x-3.5 pt-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="cursor-pointer font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="cursor-pointer font-semibold"
                icon={Send}
              >
                {loading ? "Recording..." : "Record Transaction"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};
