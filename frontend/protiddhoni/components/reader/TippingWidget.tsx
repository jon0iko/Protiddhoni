'use client';

import React, { useState } from 'react';
import { Coffee, Heart, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface TippingWidgetProps {
  authorId: string;
  authorName: string;
}

export default function TippingWidget({ authorId, authorName }: TippingWidgetProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, user, updateKoriBalance, refreshBalance } = useAuth();
  const router = useRouter();

  // Hide widget if user is the author
  if (user?.id === authorId) {
    return null;
  }

  const handleTip = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const tipAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!tipAmount || tipAmount <= 0) return;

    if ((user?.kori_balance || 0) < tipAmount) {
      alert('আপনার পর্যাপ্ত কড়ি নেই। অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।');
      router.push('/wallet');
      return;
    }
    
    try {
      setIsLoading(true);
      await api.payments.tipAuthor(authorId, tipAmount);
      updateKoriBalance(-tipAmount);
      // Refresh balance from server to ensure accuracy
      await refreshBalance();
      alert(`ধন্যবাদ! আপনি ${authorName}-কে ৳${tipAmount} টিপ দিয়েছেন।`);
      setAmount(null);
      setCustomAmount('');
    } catch (error) {
      console.error('Tipping failed:', error);
      alert('টিপ প্রদান ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="rounded-lg p-6 mb-8 border flex flex-col items-center text-center mt-12 shadow-sm" 
      style={{ backgroundColor: 'var(--reader-card-bg)', borderColor: 'var(--reader-border)' }}
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
        <Coffee className="w-6 h-6" />
      </div>
      
      <h3 className="text-xl font-bold mb-2 bengali-text" style={{ color: 'var(--reader-text)' }}>
        লেখককে উৎসাহ দিন
      </h3>
      <p className="mb-6 text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
        আপনার ভালো লাগা প্রকাশ করুন এবং {authorName}-কে আরও লিখতে উৎসাহিত করুন।
      </p>

      {/* Preset Amounts */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {[10, 20, 50, 100].map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setAmount(preset);
              setCustomAmount('');
            }}
            className={`px-5 py-2 rounded-full border transition-colors font-medium flex items-center gap-2 ${
              amount === preset && !customAmount
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent hover:border-blue-400'
            }`}
            style={amount !== preset || customAmount ? { color: 'var(--reader-text)', borderColor: 'var(--reader-border)' } : {}}
          >
            <Coins className="w-4 h-4" />
            {preset}
          </button>
        ))}
      </div>

      {/* Custom Amount Input */}
      <div className="w-full max-w-xs mb-6">
        <label className="block text-sm font-medium bengali-text mb-2" style={{ color: 'var(--reader-text)' }}>
        পরিমাণ (কড়ি) প্রবেশ করুন:
        </label>
        <input
          type="number"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setAmount(null);
          }}
          placeholder="যেকোনো পরিমাণ লিখুন"
          min="1"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
          style={{ borderColor: 'var(--reader-border)', backgroundColor: 'var(--reader-card-bg)', color: 'var(--reader-text)' }}
        />
      </div>

      <button
        onClick={handleTip}
        disabled={(!amount && !customAmount) || isLoading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
      >
        <Heart className="w-5 h-5" />
        <span className="bengali-text">{isLoading ? 'প্রক্রিয়াধীন...' : 'টিপ দিন'}</span>
      </button>
    </div>
  );
}
