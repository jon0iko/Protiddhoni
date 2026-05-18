/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Instagram,
  CheckCircle
} from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
}

const contactTypes = [
  { value: 'general', label: 'সাধারণ প্রশ্ন' },
  { value: 'technical', label: 'প্রযুক্তিগত সহায়তা' },
  { value: 'report', label: 'রিপোর্ট/অভিযোগ' },
  { value: 'suggestion', label: 'পরামর্শ' },
  { value: 'partnership', label: 'অংশীদারিত্ব' },
  { value: 'other', label: 'অন্যান্য' }
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would typically send to your backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      console.log('Contact form submitted:', form);
    } catch (error) {
      alert('বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-text">
            বার্তা পাঠানো হয়েছে!
          </h2>
          <p className="text-gray-600 mb-6 bengali-text">
            আপনার বার্তা আমাদের কাছে পৌঁছেছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setForm({
                name: '',
                email: '',
                subject: '',
                message: '',
                type: 'general'
              });
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors bengali-text"
          >
            আরেকটি বার্তা পাঠান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            যোগাযোগ
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            আমাদের সাথে যোগাযোগ করুন - আমরা আপনার সেবায় নিয়োজিত
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 bengali-text">
                যোগাযোগের তথ্য
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">ইমেইল</p>
                    <p className="text-gray-600">support@protiddhoni.com</p>
                    <p className="text-gray-600">info@protiddhoni.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 bengali-text">ফোন</p>
                    <p className="text-gray-600">+৮৮০ ১৭১২-৩৪৫৬৭৮</p>
                    <p className="text-gray-600 text-sm bengali-text">(সকাল ৯টা - সন্ধ্যা ৬টা)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 bengali-text">ঠিকানা</p>
                    <p className="text-gray-600 bengali-text">
                      ১২/এ, রোড নং ৫<br />
                      ধানমন্ডি, ঢাকা - ১২০৫<br />
                      বাংলাদেশ
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 bengali-text">কার্যসময়</p>
                    <p className="text-gray-600 bengali-text">রবিবার - বৃহস্পতিবার</p>
                    <p className="text-gray-600 bengali-text">সকাল ৯:০০ - সন্ধ্যা ৬:০০</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 bengali-text">
                সোশ্যাল মিডিয়া
              </h3>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
              <p className="text-sm text-gray-600 mt-3 bengali-text">
                আমাদের ফলো করুন সর্বশেষ আপডেট পেতে
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900 bengali-text">
                  আমাদের বার্তা পাঠান
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                      placeholder="আপনার নাম লিখুন"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                      ইমেইল ঠিকানা *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    বিষয়ের ধরন
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    {contactTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    বিষয় *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                    placeholder="বার্তার বিষয় লিখুন"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    বার্তা *
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bengali-text"
                    placeholder="আপনার বার্তা বিস্তারিতভাবে লিখুন..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bengali-text"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>বার্তা পাঠান</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quick Help */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 bengali-text">
              দ্রুত সাহায্য প্রয়োজন?
            </h3>
            <p className="text-lg mb-6 bengali-text">
              সাধারণ প্রশ্নের উত্তর পেতে আমাদের FAQ সেকশন দেখুন
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/faq" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text"
              >
                FAQ দেখুন
              </a>
              <a 
                href="/guidelines" 
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors bengali-text"
              >
                নিয়মাবলী পড়ুন
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}