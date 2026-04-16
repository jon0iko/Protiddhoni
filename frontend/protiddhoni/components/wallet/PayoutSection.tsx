'use client';

import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface PayoutData {
  payoutable: number;
  earned: number;
  spent: number;
  withdrawn: number;
}

export default function PayoutSection() {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.payments.getPayoutable();

      if (response.success && response.data) {
        setPayoutData(response.data);
      } else {
        setError('পেআউট তথ্য লোড করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Error loading payout data:', err);
      setError('পেআউট তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!payoutData || payoutData.payoutable <= 0) return;

    try {
      setIsProcessing(true);
      setError(null);
      const response = await api.payments.processPayout();

      if (response.success) {
        setSuccess(response.message || 'উত্তোলন সফল হয়েছে!');
        // Reload data
        setTimeout(loadPayoutData, 1500);
      } else {
        setError(response.error || 'উত্তোলন ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      console.error('Error processing payout:', err);
      setError(err.message || 'উত্তোলন প্রক্রিয়া ব্যর্থ হয়েছে');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Payout Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-emerald-100 mb-2 bengali-text font-medium">উত্তোলনযোগ্য কড়ি</p>
            <h3 className="text-5xl font-black">{payoutData?.payoutable || 0}</h3>
            <p className="text-emerald-100 text-sm bengali-text mt-2">সরাসরি উত্তোলন করতে পারবেন</p>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
            <TrendingUp className="w-8 h-8 text-emerald-100" />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-emerald-100 text-xs bengali-text mb-1">মোট অর্জন</p>
            <p className="text-lg font-bold">{payoutData?.earned || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-emerald-100 text-xs bengali-text mb-1">অন্যদের দেওয়া</p>
            <p className="text-lg font-bold">-{payoutData?.spent || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-emerald-100 text-xs bengali-text mb-1">উত্তোলিত</p>
            <p className="text-lg font-bold">-{payoutData?.withdrawn || 0}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePayout}
          disabled={isProcessing || (payoutData?.payoutable || 0) <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bengali-text transition-all duration-200 ${
            (payoutData?.payoutable || 0) > 0
              ? 'bg-white text-emerald-600 hover:shadow-lg'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          title={(payoutData?.payoutable || 0) <= 0 ? 'উত্তোলনের জন্য কোনো কড়ি নেই' : ''}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              প্রক্রিয়াকরণ হচ্ছে...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              এখনই উত্তোলন করুন
            </>
          )}
        </button>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 gap-4">

        {/* Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 mb-3 bengali-text flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            তথ্য
          </h4>
          <div className="bengali-text text-sm text-gray-600 space-y-2">
            <p>• শুধুমাত্র অর্জিত কড়ি উত্তোলনযোগ্য</p>
            <p>• ক্রয়কৃত কড়ি অন্তর্ভুক্ত নয়</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 bengali-text flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 bengali-text flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </p>
        </div>
      )}
    </div>
  );
}
