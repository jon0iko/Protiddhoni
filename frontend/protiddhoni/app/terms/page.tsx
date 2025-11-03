'use client';

import { Scale, FileText, Shield, AlertTriangle, Users, Gavel, CheckCircle, XCircle } from 'lucide-react';

const sections = [
  {
    id: 'acceptance',
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'শর্তাবলীর গ্রহণযোগ্যতা',
    content: [
      'প্রতিধ্বনি ব্যবহার করার মাধ্যমে আপনি এই সেবার শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।',
      'আপনার বয়স কমপক্ষে ১৩ বছর হতে হবে এবং যদি ১৮ বছরের কম হন তাহলে অভিভাবকের অনুমতি প্রয়োজন।',
      'আপনি আইনগতভাবে এই চুক্তিতে অংশগ্রহণে সক্ষম হতে হবে।',
      'আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি।'
    ]
  },
  {
    id: 'services',
    icon: <FileText className="w-6 h-6" />,
    title: 'সেবার বিবরণ',
    content: [
      'প্রতিধ্বনি একটি বাংলা সাহিত্য প্ল্যাটফর্ম যেখানে আপনি:',
      '• গল্প, কবিতা এবং অন্যান্য সাহিত্যকর্ম পড়তে এবং লিখতে পারেন',
      '• অন্যদের লেখায় মন্তব্য করতে এবং রেটিং দিতে পারেন',
      '• আপনার প্রিয় লেখকদের ফলো করতে পারেন',
      '• সাহিত্য প্রতিযোগিতায় অংশগ্রহণ করতে পারেন',
      '• আপনার প্রোফাইল এবং লেখা কাস্টমাইজ করতে পারেন'
    ]
  },
  {
    id: 'user-accounts',
    icon: <Users className="w-6 h-6" />,
    title: 'ব্যবহারকারী অ্যাকাউন্ট',
    content: [
      'অ্যাকাউন্ট তৈরির সময় সঠিক এবং সম্পূর্ণ তথ্য প্রদান করতে হবে।',
      'আপনার অ্যাকাউন্টের নিরাপত্তার জন্য আপনি সম্পূর্ণ দায়বদ্ধ।',
      'একাধিক অ্যাকাউন্ট তৈরি করা নিষিদ্ধ।',
      'অ্যাকাউন্ট ভাগাভাগি বা বিক্রি করা যাবে না।',
      'সন্দেহজনক কার্যকলাপ অবিলম্বে আমাদের জানাতে হবে।'
    ]
  },
  {
    id: 'content-rules',
    icon: <Shield className="w-6 h-6" />,
    title: 'কন্টেন্ট নীতি',
    content: [
      'আপনার প্রকাশিত সব কন্টেন্টের জন্য আপনি দায়বদ্ধ।',
      'কপিরাইট লঙ্ঘনকারী কন্টেন্ট প্রকাশ করা নিষিদ্ধ।',
      'আপত্তিজনক, হুমকিমূলক বা বৈষম্যমূলক কন্টেন্ট নিষিদ্ধ।',
      'স্প্যাম, বিজ্ঞাপন বা অনুমোদনহীন প্রচারণা নিষিদ্ধ।',
      'আমরা যেকোনো কন্টেন্ট সরিয়ে ফেলার অধিকার রাখি।'
    ]
  },
  {
    id: 'intellectual-property',
    icon: <Gavel className="w-6 h-6" />,
    title: 'বুদ্ধিবৃত্তিক সম্পত্তি',
    content: [
      'আপনার তৈরি কন্টেন্টের মালিকানা আপনার থাকবে।',
      'প্রকাশের মাধ্যমে আপনি আমাদের সেই কন্টেন্ট প্রদর্শন ও বিতরণের লাইসেন্স দিচ্ছেন।',
      'প্রতিধ্বনির নাম, লোগো এবং ডিজাইন আমাদের সম্পত্তি।',
      'অন্যের কপিরাইট সম্মান করুন।',
      'DMCA নীতি অনুসরণ করি এবং লঙ্ঘনকারী কন্টেন্ট সরিয়ে দেই।'
    ]
  }
];

const prohibitedContent = [
  'হেইট স্পিচ বা বৈষম্যমূলক ভাষা',
  'যৌন নিগ্রহ বা হয়রানিমূলক কন্টেন্ট',
  'হিংসা বা ক্ষতির হুমকি',
  'মিথ্যা তথ্য বা গুজব ছড়ানো',
  'স্প্যাম বা অবাঞ্ছিত বিজ্ঞাপন',
  'অবৈধ কার্যকলাপের প্রচার',
  'ব্যক্তিগত তথ্য প্রকাশ',
  'কপিরাইট লঙ্ঘন'
];

const userRights = [
  'আপনার কন্টেন্টের উপর মালিকানা',
  'গোপনীয়তা এবং ডেটা সুরক্ষা',
  'ন্যায্য এবং সমান আচরণ',
  'প্ল্যাটফর্ম ব্যবহারে অ্যাক্সেস',
  'আপিল এবং অভিযোগের সুবিধা',
  'অ্যাকাউন্ট বন্ধ করার অধিকার'
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            সেবার শর্তাবলী
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            প্রতিধ্বনি ব্যবহারের নিয়ম ও শর্তাবলী
          </p>
          <div className="text-sm text-gray-500 mt-4 bengali-text">
            সর্বশেষ আপডেট: ১৫ জানুয়ারি, ২০২৪
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2 bengali-text">
                গুরুত্বপূর্ণ বিজ্ঞপ্তি
              </h3>
              <p className="text-amber-800 bengali-text leading-relaxed">
                এই শর্তাবলী একটি আইনি চুক্তি। প্রতিধ্বনি ব্যবহার করার আগে সম্পূর্ণ শর্তাবলী 
                মনোযোগ সহকারে পড়ুন এবং বুঝে নিন। ব্যবহার করার মাধ্যমে আপনি এই সব শর্ত মেনে নিতে সম্মত হচ্ছেন।
              </p>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 bengali-text">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-3">
                {section.content.map((item, index) => (
                  <p key={index} className="text-gray-700 bengali-text leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Prohibited Content Section */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900 bengali-text">
              নিষিদ্ধ কন্টেন্ট
            </h3>
          </div>
          <p className="text-red-800 bengali-text mb-4">
            নিম্নলিখিত ধরনের কন্টেন্ট প্রকাশ করা কঠোরভাবে নিষিদ্ধ:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {prohibitedContent.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 bengali-text text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Rights Section */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 bengali-text">
              ব্যবহারকারীর অধিকার
            </h3>
          </div>
          <p className="text-green-800 bengali-text mb-4">
            প্রতিধ্বনি ব্যবহারকারী হিসেবে আপনার রয়েছে:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {userRights.map((right, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700 bengali-text text-sm">{right}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terms Violation */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            শর্ত লঙ্ঘনের পরিণতি
          </h3>
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h4 className="font-semibold text-yellow-800 bengali-text">প্রথম সতর্কতা</h4>
              <p className="text-yellow-700 bengali-text text-sm">বার্তা পাঠানো এবং নির্দেশনা প্রদান</p>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <h4 className="font-semibold text-orange-800 bengali-text">অস্থায়ী স্থগিতাদেশ</h4>
              <p className="text-orange-700 bengali-text text-sm">১-৩০ দিনের জন্য অ্যাকাউন্ট স্থগিত</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800 bengali-text">স্থায়ী নিষেধাজ্ঞা</h4>
              <p className="text-red-700 bengali-text text-sm">চূড়ান্ত অ্যাকাউন্ট বন্ধ করা</p>
            </div>
          </div>
        </div>

        {/* Platform Changes */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            সেবা পরিবর্তন এবং সমাপ্তি
          </h3>
          <ul className="space-y-2 text-gray-700 bengali-text">
            <li>• আমরা যেকোনো সময় সেবা পরিবর্তন, স্থগিত বা বন্ধ করতে পারি</li>
            <li>• গুরুত্বপূর্ণ পরিবর্তনের ৩০ দিন আগে জানিয়ে দেব</li>
            <li>• আপনি যেকোনো সময় আপনার অ্যাকাউন্ট বন্ধ করতে পারেন</li>
            <li>• সেবা বন্ধের পর আপনার ডেটা ৯০ দিন সংরক্ষণ করা হবে</li>
          </ul>
        </div>

        {/* Liability and Disclaimers */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            দায়বদ্ধতা এবং দাবিত্যাগ
          </h3>
          <div className="space-y-3 text-gray-700 bengali-text">
            <p>• প্রতিধ্বনি "যেমন আছে" ভিত্তিতে সেবা প্রদান করে</p>
            <p>• আমরা সেবার নিরবচ্ছিন্নতা বা ত্রুটিমুক্ততার গ্যারান্টি দেই না</p>
            <p>• ব্যবহারকারীদের কন্টেন্টের জন্য আমরা দায়বদ্ধ নই</p>
            <p>• আইনত অনুমোদিত সর্বোচ্চ পরিমাণে আমাদের দায়বদ্ধতা সীমিত</p>
          </div>
        </div>

        {/* Governing Law */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            প্রযোজ্য আইন এবং বিরোধ নিষ্পত্তি
          </h3>
          <div className="space-y-3 text-gray-700 bengali-text">
            <p>• এই শর্তাবলী বাংলাদেশের আইন দ্বারা নিয়ন্ত্রিত</p>
            <p>• যেকোনো বিরোধ প্রথমে আলোচনার মাধ্যমে সমাধানের চেষ্টা করা হবে</p>
            <p>• প্রয়োজনে ঢাকার আদালতে বিচার হবে</p>
            <p>• বিকল্প বিরোধ নিষ্পত্তির ব্যবস্থাও রয়েছে</p>
          </div>
        </div>

        {/* Contact for Legal Issues */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="text-center">
            <Gavel className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4 bengali-text">
              আইনি বিষয়ে যোগাযোগ
            </h3>
            <p className="text-lg mb-6 bengali-text">
              শর্তাবলী বা আইনি বিষয়ে কোনো প্রশ্ন থাকলে আমাদের আইনি বিভাগের সাথে যোগাযোগ করুন
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text"
              >
                যোগাযোগ ফর্ম
              </a>
              <a 
                href="mailto:legal@protiddhoni.com" 
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                legal@protiddhoni.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}