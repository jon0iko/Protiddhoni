'use client';

import { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  metadata: any;
  created_at: string;
  completed_at: string | null;
  isIncoming: boolean;
  displayAmount: string;
  displayType: string;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIMIT = 10;

export default function TransactionHistoryModal({ isOpen, onClose }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadTransactions(0);
    }
  }, [isOpen]);

  const loadTransactions = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const offset = page * LIMIT;
      const response = await api.payments.getTransactions(LIMIT, offset);

      if (response.success) {
        setTransactions(response.data || []);
        setTotalCount(response.pagination?.total || 0);
        setCurrentPage(page);
      } else {
        setError('লেনদেনের ইতিহাস লোড করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('লেনদেনের ইতিহাস লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * LIMIT < totalCount) {
      loadTransactions(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      loadTransactions(currentPage - 1);
    }
  };

  const formatDate = (dateString: string) => {
    // Ensure UTC timestamps are parsed correctly
    const date = /Z|[+-]\d{2}:\d{2}$/.test(dateString) ? new Date(dateString) : new Date(dateString + 'Z');
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'reversed':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'completed': 'সম্পন্ন',
      'pending': 'সম্পন্নাধীন',
      'failed': 'ব্যর্থ',
      'reversed': 'বাতিল'
    };
    return statusMap[status] || status;
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(totalCount / LIMIT);
  const startIndex = currentPage * LIMIT + 1;
  const endIndex = Math.min((currentPage + 1) * LIMIT, totalCount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold bengali-text">লেনদেনের ইতিহাস</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-gray-500 bengali-text">লোড হচ্ছে...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 bengali-text">{error}</p>
            </div>
          )}

          {!isLoading && transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 bengali-text">কোনো লেনদেন নেই</p>
            </div>
          )}

          {!isLoading && transactions.length > 0 && (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          txn.isIncoming
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {txn.isIncoming ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 bengali-text truncate">
                          {txn.displayType}
                        </p>
                        <p className="text-sm text-gray-500 bengali-text">
                          {formatDate(txn.created_at)}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-2 bengali-text ${getStatusColor(
                            txn.status
                          )}`}
                        >
                          {getStatusLabel(txn.status)}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p
                        className={`text-lg font-bold ${
                          txn.isIncoming ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {txn.displayAmount}
                      </p>
                      <p className="text-sm text-gray-500 bengali-text">কড়ি</p>
                    </div>
                  </div>

                  {/* Metadata if present */}
                  {txn.metadata && (
                    <div className="mt-3 text-xs text-gray-600 bengali-text bg-gray-50 p-2 rounded">
                      {txn.metadata.contentTitle && (
                        <p>কনটেন্ট: {txn.metadata.contentTitle}</p>
                      )}
                      {txn.metadata.chapterTitle && (
                        <p>পর্ব: {txn.metadata.chapterTitle}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pagination */}
        {!isLoading && transactions.length > 0 && (
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 bengali-text">
                {startIndex}-{endIndex} এর মধ্যে {totalCount}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <span className="text-sm text-gray-600 bengali-text px-3">
                  পৃষ্ঠা {currentPage + 1} / {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
