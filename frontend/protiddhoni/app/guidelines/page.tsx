'use client';

import { 
  BookOpen, 
  Shield, 
  Users, 
  Heart, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Award,
  FileText
} from 'lucide-react';

const guidelines = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "বিষয়বস্তু নির্দেশনা",
    color: "blue",
    rules: [
      "মৌলিক এবং নিজস্ব সৃজনশীল লেখা প্রকাশ করুন",
      "কপিরাইট আইন মেনে চলুন, অন্যের লেখা চুরি করবেন না",
      "বাংলা অথবা ইংরেজি ভাষায় লিখুন",
      "গঠনমূলক এবং ইতিবাচক বিষয়বস্তু প্রাধান্য দিন"
    ]
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "নিরাপত্তা এবং শালীনতা",
    color: "green",
    rules: [
      "অশ্লীল, অভদ্র বা আপত্তিজনক ভাষা ব্যবহার করবেন না",
      "ধর্মীয়, জাতিগত বা রাজনৈতিক বিদ্বেষমূলক লেখা নিষিদ্ধ",
      "হিংসাত্মক বা ক্ষতিকর বিষয়বস্তু এড়িয়ে চলুন",
      "ব্যক্তিগত তথ্য বা ঠিকানা প্রকাশ করবেন না"
    ]
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "সম্প্রদায়ের নিয়মাবলী",
    color: "purple",
    rules: [
      "অন্য লেখকদের সাথে সম্মানজনক আচরণ করুন",
      "গঠনমূলক মতামত এবং পরামর্শ দিন",
      "স্প্যাম বা অপ্রাসঙ্গিক বিজ্ঞাপন পোস্ট করবেন না",
      "নকল অ্যাকাউন্ট বা পরিচয় তৈরি করবেন না"
    ]
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "মান এবং গুণগত মানদণ্ড",
    color: "red",
    rules: [
      "বানান এবং ব্যাকরণের দিকে খেয়াল রাখুন",
      "পরিচ্ছন্ন এবং সুসংগঠিত লেখা উপস্থাপন করুন",
      "উপযুক্ত শিরোনাম এবং বিবরণ দিন",
      "প্রাসঙ্গিক ট্যাগ এবং ক্যাটাগরি ব্যবহার করুন"
    ]
  }
];

const doAndDont = {
  dos: [
    "নিয়মিত লিখুন এবং অনুশীলন চালিয়ে যান",
    "অন্যদের লেখা পড়ুন এবং পরামর্শ দিন",
    "আপনার প্রোফাইল আপডেট রাখুন",
    "নতুন লেখকদের উৎসাহ দিন",
    "আপনার লেখায় সততা বজায় রাখুন"
  ],
  donts: [
    "অন্যের লেখা কপি করবেন না",
    "মিথ্যা তথ্য বা গুজব ছড়াবেন না",
    "অশোভন ভাষা ব্যবহার করবেন না",
    "স্প্যাম বা অবাঞ্ছিত বিজ্ঞাপন দেবেন না",
    "অন্যদের ব্যক্তিগত আক্রমণ করবেন না"
  ]
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            লেখালেখির নিয়মাবলী
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            প্রতিধ্বনিতে একটি স্বাস্থ্যকর এবং সৃজনশীল পরিবেশ বজায় রাখতে এই নিয়মগুলো মেনে চলুন
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2 bengali-text">
                গুরুত্বপূর্ণ বিজ্ঞপ্তি
              </h3>
              <p className="text-blue-800 bengali-text">
                এই নিয়মাবলী লঙ্ঘন করলে আপনার অ্যাকাউন্ট সাময়িক বা স্থায়ীভাবে বন্ধ হতে পারে। 
                প্রতিধ্বনি একটি সৃজনশীল এবং নিরাপদ প্ল্যাটফর্ম হিসেবে রাখতে সবার সহযোগিতা প্রয়োজন।
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines Sections */}
        <div className="space-y-8 mb-12">
          {guidelines.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  section.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  section.color === 'green' ? 'bg-green-100 text-green-600' :
                  section.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 bengali-text">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.rules.map((rule, ruleIndex) => (
                  <li key={ruleIndex} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 bengali-text">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Do's */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-green-900 bengali-text">
                যা করবেন
              </h3>
            </div>
            <ul className="space-y-3">
              {doAndDont.dos.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-green-800 bengali-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-900 bengali-text">
                যা করবেন না
              </h3>
            </div>
            <ul className="space-y-3">
              {doAndDont.donts.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-red-800 bengali-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Violation Consequences */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-3 bengali-text">
                নিয়ম লঙ্ঘনের পরিণতি
              </h3>
              <div className="space-y-2 text-yellow-800 bengali-text">
                <p><strong>প্রথম সতর্কতা:</strong> ইমেইলের মাধ্যমে সতর্কতা এবং নিয়ম সম্পর্কে অবহিতকরণ</p>
                <p><strong>দ্বিতীয় লঙ্ঘন:</strong> ৭ দিনের জন্য অ্যাকাউন্ট সাময়িক বন্ধ</p>
                <p><strong>তৃতীয় লঙ্ঘন:</strong> ৩০ দিনের জন্য অ্যাকাউন্ট বন্ধ</p>
                <p><strong>গুরুতর লঙ্ঘন:</strong> অ্যাকাউন্ট স্থায়ীভাবে বন্ধ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 bengali-text">
              অভিযোগ এবং রিপোর্ট
            </h3>
          </div>
          <p className="text-gray-700 bengali-text mb-4">
            যদি আপনি কোনো নিয়ম লঙ্ঘন বা অনুপযুক্ত বিষয়বস্তু দেখেন, অনুগ্রহ করে তা রিপোর্ট করুন। 
            আমরা ২৪ ঘন্টার মধ্যে সব রিপোর্ট পর্যালোচনা করি।
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="/contact" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors bengali-text text-center"
            >
              অভিযোগ জানান
            </a>
            <a 
              href="/faq" 
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors bengali-text text-center"
            >
              আরো জানুন
            </a>
          </div>
        </div>

        {/* Quality Standards */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900 bengali-text">
              গুণগত মানের জন্য পরামর্শ
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 bengali-text">
            <div>
              <h4 className="font-semibold mb-2">লেখার মান বৃদ্ধির জন্য:</h4>
              <ul className="space-y-1 text-sm">
                <li>• নিয়মিত অনুশীলন করুন</li>
                <li>• ভালো বই পড়ুন এবং শিখুন</li>
                <li>• প্রুফরিডিং করুন প্রকাশের আগে</li>
                <li>• অন্যদের মতামত গ্রহণ করুন</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">প্রযুক্তিগত সহায়তা:</h4>
              <ul className="space-y-1 text-sm">
                <li>• আমাদের উন্নত এডিটর ব্যবহার করুন</li>
                <li>• ফরম্যাটিং টুলস ব্যবহার করুন</li>
                <li>• ইমেজ এবং মিডিয়া যোগ করুন</li>
                <li>• সোশ্যাল শেয়ারিং অপশন ব্যবহার করুন</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}