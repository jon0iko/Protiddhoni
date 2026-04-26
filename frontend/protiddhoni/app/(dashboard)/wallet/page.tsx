'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Wallet, CreditCard, ChevronRight, Activity, ArrowUpRight, Coins, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import TransactionHistoryModal from '@/components/wallet/TransactionHistoryModal';
import PayoutSection from '@/components/wallet/PayoutSection';
import { api } from '@/lib/api';

type CheckoutFeedback = {
  type: 'success' | 'error';
  message: string;
  transactionId?: string;
};

export default function WalletPage() {
  const { user, isLoggedIn, refreshBalance } = useAuth();
  const [, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadWallet();
    }
  }, [isLoggedIn]);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      await refreshBalance();
    } catch (error) {
      console.error('Failed to load wallet', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedPackage || isProcessing) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.payments.initiateTopUp({
        amount: selectedPackage,
        paymentMethod: 'sim',
      });

      if (res?.success) {
        await refreshBalance();
        setFeedback({
          type: 'success',
          message: `${selectedPackage} কড়ি সফলভাবে যোগ হয়েছে।`,
          transactionId: res.transactionId,
        });
        setSelectedPackage(null);
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'পেমেন্ট সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
          transactionId: res?.transactionId,
        });
      }
    } catch (error) {
      console.error('Checkout failed', error);
      const message = error instanceof Error ? error.message : 'পেমেন্ট সিমুলেশনে সমস্যা হয়েছে।';
      setFeedback({ type: 'error', message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="bengali-text text-gray-600">অনুগ্রহ করে লগইন করুন।</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 bengali-text flex items-center gap-3">
        <Wallet className="w-8 h-8 text-primary-600" />
        আমার ওয়ালেট
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet className="w-32 h-32" />
          </div>
          <div>
            <p className="text-blue-100 mb-1 bengali-text font-medium border-b border-blue-400/30 pb-2 inline-block">বর্তমান ব্যালেন্স</p>
            <div className="flex items-baseline mt-4">
              <span className="text-5xl font-black">{user?.kori_balance || 0}</span>
              <span className="ml-2 text-xl text-blue-200 bengali-text">কড়ি</span>
            </div>
          </div>
          <div className="mt-8 flex gap-3 z-10">
             <button 
               onClick={() => setShowTransactionHistory(true)}
               className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bengali-text border border-white/10">
               <Activity className="w-4 h-4" />
               লেনদেনের ইতিহাস
             </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                <ArrowUpRight className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 bengali-text mb-2 text-lg">কড়ি কী?</h3>
            <p className="text-gray-500 text-sm bengali-text leading-relaxed">
             কড়ি হলো প্রতিধ্বনির নিজস্ব ডিজিটাল কারেন্সি। এটি ব্যবহার করে আপনি আপনার প্রিয় লেখকদের টিপ দিতে পারবেন এবং প্রিমিয়াম কনটেন্ট পড়তে পারবেন।
            </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 bengali-text">কড়ি রিচার্জ করুন</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[50, 100, 500, 1000].map(amount => (
          <button
            key={amount}
            onClick={() => setSelectedPackage(amount)}
            className={`p-6 rounded-xl border-2 text-center transition-all relative ${
              selectedPackage === amount 
                ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/20' 
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            {amount === 500 && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full bengali-text shadow-sm">
                জনপ্রিয়
              </span>
            )}
            <div className="flex justify-center mb-3">
              <Coins className="w-12 h-12 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{amount}</div>
            <div className="text-gray-500 bengali-text text-sm">কড়ি</div>
            <div className="mt-4 pt-4 border-t border-gray-200/60 font-medium text-gray-700">
               ৳ {amount}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-50 border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1 bengali-text text-lg">পেমেন্ট মেথড</h3>
          <p className="text-sm text-gray-500 bengali-text">সিমুলেটেড পেমেন্ট গেটওয়ে — কোনো প্রকৃত প্রদানকারী ছাড়াই কড়ি যোগ হবে।</p>
          <div className="flex gap-2 mt-3">
             <span className="text-xs font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded">bKash</span>
             <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">Card</span>
             <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Sim</span>
          </div>
        </div>
        <button
          onClick={handleTopUp}
          disabled={!selectedPackage || isProcessing}
          className="w-full sm:w-auto mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bengali-text shadow-sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>প্রসেস হচ্ছে...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>পেমেন্ট করুন {selectedPackage ? `(৳${selectedPackage})` : ''}</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium bengali-text">{feedback.message}</p>
            {feedback.transactionId && (
              <p className="mt-1 text-xs opacity-80 font-mono break-all">Txn: {feedback.transactionId}</p>
            )}
          </div>
        </div>
      )}

      {/* Payout Section */}
      <div className="my-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 bengali-text">লেখক পেআউট</h2>
        <PayoutSection />
      </div>

      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
    </div>
  );
}
