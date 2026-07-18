
import { Shield, Eye, Lock, Users, Database, AlertTriangle, Mail, Calendar } from 'lucide-react';

const sections = [
  {
    id: 'collection',
    icon: <Database className="w-6 h-6" />,
    title: 'তথ্য সংগ্রহ',
    content: [
      'আমরা যে তথ্য সংগ্রহ করি:',
      '• ব্যক্তিগত তথ্য: নাম, ইমেইল ঠিকানা, ফোন নম্বর (ঐচ্ছিক)',
      '• অ্যাকাউন্ট তথ্য: ব্যবহারকারীর নাম, পাসওয়ার্ড, প্রোফাইল ছবি',
      '• লেখার তথ্য: আপনার প্রকাশিত গল্প, কবিতা এবং মন্তব্য',
      '• ব্যবহারের তথ্য: পেজ ভিজিট, ক্লিক, পড়ার ইতিহাস',
      '• ডিভাইস তথ্য: IP ঠিকানা, ব্রাউজার ধরন, অপারেটিং সিস্টেম'
    ]
  },
  {
    id: 'usage',
    icon: <Eye className="w-6 h-6" />,
    title: 'তথ্যের ব্যবহার',
    content: [
      'আমরা আপনার তথ্য ব্যবহার করি:',
      '• আপনার অ্যাকাউন্ট পরিচালনা এবং সেবা প্রদানের জন্য',
      '• আপনার জন্য ব্যক্তিগতকৃত কন্টেন্ট সুপারিশ করতে',
      '• প্ল্যাটফর্মের নিরাপত্তা এবং স্থিতিশীলতা নিশ্চিত করতে',
      '• গুরুত্বপূর্ণ আপডেট এবং বিজ্ঞপ্তি পাঠাতে',
      '• আমাদের সেবার মান উন্নয়নে',
      '• আইনি বাধ্যবাধকতা পূরণে'
    ]
  },
  {
    id: 'sharing',
    icon: <Users className="w-6 h-6" />,
    title: 'তথ্য ভাগাভাগি',
    content: [
      'আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের সাথে ভাগ করি না, তবে:',
      '• প্রকাশিত লেখা এবং প্রোফাইল তথ্য সবার জন্য দৃশ্যমান',
      '• আইনি কর্তৃপক্ষের দাবিতে প্রয়োজনীয় তথ্য প্রদান',
      '• আমাদের সেবা প্রদানকারী অংশীদারদের সাথে সীমিত তথ্য ভাগ',
      '• আপনার সম্মতিতে নির্দিষ্ট তৃতীয় পক্ষের সাথে',
      '• প্ল্যাটফর্মের নিরাপত্তা রক্ষায় প্রয়োজনীয় ক্ষেত্রে'
    ]
  },
  {
    id: 'security',
    icon: <Lock className="w-6 h-6" />,
    title: 'নিরাপত্তা',
    content: [
      'আপনার তথ্যের নিরাপত্তার জন্য আমরা:',
      '• SSL এনক্রিপশন ব্যবহার করি সব ডেটা ট্রান্সমিশনে',
      '• পাসওয়ার্ড হ্যাশিং এবং এনক্রিপশন প্রয়োগ করি',
      '• নিয়মিত নিরাপত্তা অডিট এবং আপডেট করি',
      '• সীমিত কর্মীদের তথ্যে অ্যাক্সেস দেই',
      '• ডেটা ব্যাকআপ এবং রিকভারি সিস্টেম বজায় রাখি',
      '• সন্দেহজনক কার্যকলাপ পর্যবেক্ষণ করি'
    ]
  },
  {
    id: 'cookies',
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'কুকিজ এবং ট্র্যাকিং',
    content: [
      'আমরা কুকিজ ব্যবহার করি:',
      '• আপনার লগইন সেশন বজায় রাখতে',
      '• আপনার পছন্দ এবং সেটিংস মনে রাখতে',
      '• সাইটের কার্যকারিতা উন্নত করতে',
      '• ব্যবহারের পরিসংখ্যান সংগ্রহ করতে (গুগল অ্যানালিটিক্স)',
      '• আপনি কুকিজ নিষ্ক্রিয় করতে পারেন তবে কিছু বৈশিষ্ট্য কাজ নাও করতে পারে'
    ]
  },
  {
    id: 'rights',
    icon: <Shield className="w-6 h-6" />,
    title: 'আপনার অধিকার',
    content: [
      'আপনার রয়েছে:',
      '• আপনার ব্যক্তিগত তথ্য দেখার এবং সংশোধন করার অধিকার',
      '• আপনার অ্যাকাউন্ট এবং তথ্য মুছে ফেলার অধিকার',
      '• ডেটা প্রসেসিং সীমিত করার অধিকার',
      '• আপনার তথ্য পোর্টেবিলিটির অধিকার',
      '• মার্কেটিং কমিউনিকেশন অপ্ট-আউট করার অধিকার',
      '• অভিযোগ জানানোর অধিকার'
    ]
  }
];

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            গোপনীয়তা নীতি
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            প্রতিধ্বনিতে আপনার ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের অগ্রাধিকার
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="bengali-text">সর্বশেষ আপডেট: {currentDate}</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2 bengali-text">
                আমাদের প্রতিশ্রুতি
              </h3>
              <p className="text-blue-800 bengali-text leading-relaxed">
                প্রতিধ্বনি আপনার গোপনীয়তা এবং ব্যক্তিগত তথ্যের নিরাপত্তাকে সর্বোচ্চ গুরুত্ব দেয়। 
                এই নীতিতে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি তা বিস্তারিতভাবে ব্যাখ্যা করেছি।
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
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
              <div className="space-y-2">
                {section.content.map((item, index) => (
                  <p key={index} className="text-gray-700 bengali-text leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Children's Privacy */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2 bengali-text">
                শিশুদের গোপনীয়তা
              </h3>
              <p className="text-yellow-800 bengali-text leading-relaxed">
                আমাদের সেবা ১৩ বছরের কম বয়সী শিশুদের জন্য নয়। আমরা জেনেশুনে ১৩ বছরের কম বয়সী কোনো শিশুর 
                ব্যক্তিগত তথ্য সংগ্রহ করি না। যদি আমরা জানতে পারি যে কোনো শিশুর তথ্য সংগ্রহ হয়েছে, 
                আমরা তা অবিলম্বে মুছে ফেলব।
              </p>
            </div>
          </div>
        </div>

        {/* Third Party Services */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            তৃতীয় পক্ষের সেবা
          </h3>
          <p className="text-gray-700 bengali-text mb-4">
            আমাদের প্ল্যাটফর্মে নিম্নলিখিত তৃতীয় পক্ষের সেবা ব্যবহৃত হয়:
          </p>
          <ul className="space-y-2 text-gray-700 bengali-text">
            <li>• <strong>গুগল অ্যানালিটিক্স:</strong> ওয়েবসাইট ব্যবহারের পরিসংখ্যানের জন্য</li>
            <li>• <strong>ক্লাউডফ্লেয়ার:</strong> নিরাপত্তা এবং কার্যকারিতার জন্য</li>
            <li>• <strong>ইমেইল সেবা:</strong> বিজ্ঞপ্তি পাঠানোর জন্য</li>
          </ul>
        </div>

        {/* International Data Transfer */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            আন্তর্জাতিক ডেটা স্থানান্তর
          </h3>
          <p className="text-gray-700 bengali-text">
            আপনার তথ্য বাংলাদেশের ভিতরে এবং বাইরে উভয় জায়গায় প্রক্রিয়াজাত হতে পারে। 
            আমরা নিশ্চিত করি যে সব ক্ষেত্রেই আপনার তথ্য একই মানের নিরাপত্তা পায়।
          </p>
        </div>

        {/* Data Retention */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            তথ্য সংরক্ষণ
          </h3>
          <p className="text-gray-700 bengali-text mb-4">
            আমরা আপনার তথ্য ততক্ষণ রাখি যতক্ষণ:
          </p>
          <ul className="space-y-2 text-gray-700 bengali-text">
            <li>• আপনার অ্যাকাউন্ট সক্রিয় থাকে</li>
            <li>• আমাদের সেবা প্রদানের জন্য প্রয়োজন হয়</li>
            <li>• আইনি বাধ্যবাধকতা পূরণের প্রয়োজন থাকে</li>
            <li>• বিরোধ নিষ্পত্তির জন্য প্রয়োজন হয়</li>
          </ul>
        </div>

        {/* Changes to Policy */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            নীতির পরিবর্তন
          </h3>
          <p className="text-gray-700 bengali-text">
            আমরা সময়ে সময়ে এই গোপনীয়তা নীতি আপডেট করতে পারি। গুরুত্বপূর্ণ পরিবর্তনের ক্ষেত্রে 
            আমরা আপনাকে ইমেইলের মাধ্যমে বা প্ল্যাটফর্মে বিজ্ঞপ্তির মাধ্যমে জানাবো।
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4 bengali-text">
              প্রশ্ন বা উদ্বেগ?
            </h3>
            <p className="text-lg mb-6 bengali-text">
              গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text"
              >
                যোগাযোগ করুন
              </a>
              <a 
                href="mailto:privacy@protiddhoni.com" 
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                privacy@protiddhoni.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}