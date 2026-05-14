'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Book, Edit3, User, Search, LogOut, ChevronDown, PlusCircle, BookOpen, FileText, Shield, ArrowRight, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { api } from '@/lib/api';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWriteMenu, setShowWriteMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, logout, refreshBalance } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  const toggleWriteMenu = () => setShowWriteMenu(!showWriteMenu);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  // Handle manual balance refresh with loading state
  const handleManualRefresh = async () => {
    setIsRefreshingBalance(true);
    try {
      await refreshBalance();
    } catch (err) {
      console.warn('Failed to refresh balance:', err);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Search functionality — debounced typeahead for the navbar suggestion list.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setShowSearchResults(true);
    const delaySearch = setTimeout(async () => {
      try {
        const response = await api.content.search({ q: trimmed, limit: 5 });
        if (cancelled) return;
        setSearchResults(response.data || []);
      } catch (error) {
        if (cancelled) return;
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(delaySearch);
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (slug: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    router.push(`/read/${slug}`);
  };


  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div> */}
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-gray-900 bengali-text">প্রতিধ্বনি</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium bengali-text transition-colors">
              মূলপাতা
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary-600 font-medium bengali-text transition-colors">
              বিভাগ
            </Link>
            <Link href="/write" className="text-gray-700 hover:text-primary-600 font-medium bengali-text transition-colors">
              লেখালেখি
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                  placeholder="গল্প, কবিতা, লেখক খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                />
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div 
                  role="listbox" 
                  aria-label="অনুসন্ধান ফলাফল"
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <p className="text-sm text-gray-500 mt-2 bengali-text">খুঁজছি...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          role="option"
                          onClick={() => handleResultClick(result.slug)}
                          className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <h4 className="font-medium text-gray-900 bengali-text line-clamp-1">
                            {result.title}
                          </h4>
                          {result.author && (
                            <p className="text-xs text-gray-500 mt-1 bengali-text">
                              লেখক: {result.author.full_name}
                            </p>
                          )}
                          {result.excerpt && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 bengali-text">
                              {result.excerpt}
                            </p>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 text-center text-primary-600 hover:bg-primary-50 font-medium flex items-center justify-center gap-2 bengali-text"
                      >
                        সব ফলাফল দেখুন
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500 bengali-text">কোনো ফলাফল পাওয়া যায়নি</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2">
                  <Link href="/wallet" className="flex items-center space-x-1 text-yellow-700 hover:text-yellow-800 bg-yellow-100 px-3 py-1.5 rounded-full transition-colors" title="আমার ওয়ালেট" aria-label="আমার ওয়ালেট">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold text-sm bengali-text">{user?.kori_balance || 0}</span>
                  </Link>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshingBalance}
                    aria-label="ব্যালেন্স রিফ্রেশ করুন"
                    className="p-1.5 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="ব্যালেন্স রিফ্রেশ করুন"
                  >
                    <svg className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <NotificationDropdown />
                
                {/* Write Menu */}
                <div className="relative">
                  {/* <button 
                    onClick={toggleWriteMenu}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>লিখুন</span>
                    <ChevronDown className="w-4 h-4" />
                  </button> */}
                  
                  {showWriteMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <Link 
                        href="/write/new" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors bengali-text"
                        onClick={() => setShowWriteMenu(false)}
                      >
                        <PlusCircle className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">নতুন গল্প</div>
                          <div className="text-xs text-gray-500">নতুন গল্প লিখুন</div>
                        </div>
                      </Link>
                      <Link 
                        href="/write/continue" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors bengali-text"
                        onClick={() => setShowWriteMenu(false)}
                      >
                        <BookOpen className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">গল্প চালিয়ে যান</div>
                          <div className="text-xs text-gray-500">পূর্বের গল্প সম্পাদনা করুন</div>
                        </div>
                      </Link>
                      <Link 
                        href="/drafts" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-olive-50 hover:text-olive-600 transition-colors bengali-text"
                        onClick={() => setShowWriteMenu(false)}
                      >
                        <FileText className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="font-medium">খসড়া</div>
                          <div className="text-xs text-gray-500">অসম্পূর্ণ গল্প দেখুন</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button 
                    onClick={toggleUserMenu}
                    aria-label="ব্যবহারকারী মেনু খুলুন"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="bengali-text">{user?.name || 'প্রোফাইল'}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      {user?.is_admin && (
                        <>
                          <Link 
                            href="/admin/review" 
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-accent-600 hover:bg-accent-50 bengali-text font-medium"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield className="w-4 h-4" />
                            <span>পর্যালোচনা</span>
                          </Link>
                          <hr className="border-gray-200 my-1" />
                        </>
                      )}
                      <Link 
                        href="/wallet" 
                        className="block px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 bengali-text font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4" />
                          <span>আমার ওয়ালেট</span>
                        </div>
                      </Link>
                      <Link 
                        href="/my-stories" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bengali-text"
                        onClick={() => setShowUserMenu(false)}
                      >
                        আমার গল্প
                      </Link>
                      <Link 
                        href="/bookmarks" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bengali-text"
                        onClick={() => setShowUserMenu(false)}
                      >
                        বুকমার্ক
                      </Link>
                      <Link 
                        href="/drafts" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bengali-text"
                        onClick={() => setShowUserMenu(false)}
                      >
                        খসড়া
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bengali-text"
                        onClick={() => setShowUserMenu(false)}
                      >
                        সেটিংস
                      </Link>
                      <hr className="border-gray-200 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="bengali-text">লগআউট</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-primary-600 font-medium bengali-text transition-colors"
                >
                  লগইন
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text"
                >
                  যোগদান
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
              aria-expanded={isMenuOpen}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative" ref={mobileSearchRef}>
                  <form onSubmit={handleSearchSubmit}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                      placeholder="খুঁজুন..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                    />
                  </form>

                  {/* Mobile Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          <p className="text-sm text-gray-500 mt-2 bengali-text">খুঁজছি...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                handleResultClick(result.slug);
                                setIsMenuOpen(false);
                              }}
                              className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 bengali-text line-clamp-1">
                                {result.title}
                              </h4>
                              {result.author && (
                                <p className="text-xs text-gray-500 mt-1 bengali-text">
                                  লেখক: {result.author.full_name}
                                </p>
                              )}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                              setShowSearchResults(false);
                              setSearchQuery('');
                              setIsMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 text-center text-primary-600 hover:bg-primary-50 font-medium flex items-center justify-center gap-2 bengali-text"
                          >
                            সব ফলাফল দেখুন
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 bengali-text">কোনো ফলাফল পাওয়া যায়নি</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Navigation Links */}
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                মূলপাতা
              </Link>
              <Link href="/categories" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                বিভাগ
              </Link>
              <Link href="/write/new" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                লেখালেখি
              </Link>
              <Link href="/authors" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                লেখক
              </Link>
              
              {/* User Actions */}
              {isLoggedIn ? (
                <>
                  {/* Write Options */}
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 bengali-text">লেখালেখি</div>
                    <div className="space-y-1">
                      <Link href="/write/new" className="flex items-center space-x-3 px-2 py-2 text-primary-600 hover:bg-primary-50 rounded-md font-medium bengali-text">
                        <PlusCircle className="w-4 h-4" />
                        <span>নতুন গল্প</span>
                      </Link>
                      <Link href="/write/continue" className="flex items-center space-x-3 px-2 py-2 text-green-600 hover:bg-green-50 rounded-md font-medium bengali-text">
                        <BookOpen className="w-4 h-4" />
                        <span>গল্প চালিয়ে যান</span>
                      </Link>
                      <Link href="/drafts" className="flex items-center space-x-3 px-2 py-2 text-olive-600 hover:bg-olive-50 rounded-md font-medium bengali-text">
                        <FileText className="w-4 h-4" />
                        <span>খসড়া</span>
                      </Link>
                    </div>
                  </div>
                  <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                    প্রোফাইল
                  </Link>
                  <Link href="/notifications" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                    বিজ্ঞপ্তি
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md bengali-text">
                    লগইন
                  </Link>
                  <Link href="/register" className="block px-3 py-2 bg-primary-600 text-white rounded-md font-medium bengali-text">
                    যোগদান
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}