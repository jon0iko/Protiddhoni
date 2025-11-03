'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Book, Edit3, User, Search, Bell, LogOut, ChevronDown, PlusCircle, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWriteMenu, setShowWriteMenu] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  const toggleWriteMenu = () => setShowWriteMenu(!showWriteMenu);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 bengali-text">প্রতিধ্বনি</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium bengali-text transition-colors">
              মূলপাতা
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium bengali-text transition-colors">
              বিভাগ
            </Link>
            <Link href="/write/new" className="text-gray-700 hover:text-blue-600 font-medium bengali-text transition-colors">
              লেখালেখি
            </Link>
            <Link href="/authors" className="text-gray-700 hover:text-blue-600 font-medium bengali-text transition-colors">
              লেখক
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="গল্প, কবিতা, লেখক খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Write Menu */}
                <div className="relative">
                  <button 
                    onClick={toggleWriteMenu}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>লিখুন</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showWriteMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <Link 
                        href="/write/new" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors bengali-text"
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
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors bengali-text"
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
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
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
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bengali-text"
                        onClick={() => setShowUserMenu(false)}
                      >
                        প্রোফাইল দেখুন
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
                      <hr className="border-gray-200 my-1" />
                      <button 
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
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
                  className="text-gray-700 hover:text-blue-600 font-medium bengali-text transition-colors"
                >
                  লগইন
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text"
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
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="খুঁজুন..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  />
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
                      <Link href="/write/new" className="flex items-center space-x-3 px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-md font-medium bengali-text">
                        <PlusCircle className="w-4 h-4" />
                        <span>নতুন গল্প</span>
                      </Link>
                      <Link href="/write/continue" className="flex items-center space-x-3 px-2 py-2 text-green-600 hover:bg-green-50 rounded-md font-medium bengali-text">
                        <BookOpen className="w-4 h-4" />
                        <span>গল্প চালিয়ে যান</span>
                      </Link>
                      <Link href="/drafts" className="flex items-center space-x-3 px-2 py-2 text-purple-600 hover:bg-purple-50 rounded-md font-medium bengali-text">
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
                  <Link href="/register" className="block px-3 py-2 bg-blue-600 text-white rounded-md font-medium bengali-text">
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