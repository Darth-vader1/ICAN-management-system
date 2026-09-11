/**
 * Help & Support Page
 * Documentation and support resources using lucide-react vector icons.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileEdit,
  CreditCard,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Clock,
  Home,
  Settings,
  Search,
  ChevronDown
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'enrollment', name: 'Enrollment', icon: FileEdit },
    { id: 'billing', name: 'Billing & Payments', icon: CreditCard },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle2 },
    { id: 'account', name: 'Account', icon: User },
  ];

  const faqs: FAQItem[] = [
    {
      category: 'enrollment',
      question: 'How do I enroll in a course?',
      answer: 'Go to the Enrollment page and click "New Enrollment". Select your level, academic session, and courses. Submit the form and wait for approval from the academic office.',
    },
    {
      category: 'enrollment',
      question: 'Can I change my courses after enrollment?',
      answer: 'Yes, you can modify your enrollment during the add/drop period. Contact the academic office or use the enrollment dashboard to make changes.',
    },
    {
      category: 'enrollment',
      question: 'What is the enrollment deadline?',
      answer: 'Enrollment deadlines vary by session. Check the academic calendar or contact the admin office for specific dates.',
    },
    {
      category: 'billing',
      question: 'How do I pay my fees?',
      answer: 'Go to the Billing page to view your invoices. Click "Pay Now" on any unpaid invoice to proceed with online payment via Paystack. You can pay with debit card, bank transfer, or USSD.',
    },
    {
      category: 'billing',
      question: 'What payment methods are accepted?',
      answer: 'We accept payments via Paystack: Debit/Credit cards (Visa, Mastercard, Verve), Bank Transfer, and USSD payment.',
    },
    {
      category: 'billing',
      question: 'Can I pay in installments?',
      answer: 'Installment payment plans may be available. Please contact the finance office to discuss payment arrangements.',
    },
    {
      category: 'billing',
      question: 'I made a payment but it\'s not reflecting',
      answer: 'Payments usually reflect within 5-10 minutes. If your payment hasn\'t reflected after 30 minutes, contact support with your payment reference number.',
    },
    {
      category: 'attendance',
      question: 'How is attendance tracked?',
      answer: 'Attendance is marked during each class session. You can view your attendance record in the Attendance dashboard.',
    },
    {
      category: 'attendance',
      question: 'What is the minimum attendance requirement?',
      answer: 'Students must maintain at least 75% attendance to be eligible for examinations. Check your attendance dashboard regularly.',
    },
    {
      category: 'attendance',
      question: 'How do I report an attendance error?',
      answer: 'If you believe your attendance was marked incorrectly, contact your course instructor or the academic office within 48 hours of the class.',
    },
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page. Enter your email address and follow the instructions sent to your email.',
    },
    {
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to Settings > Profile to update your name and other information. Note that email addresses cannot be changed.',
    },
    {
      category: 'account',
      question: 'Can I change my notification preferences?',
      answer: 'Yes, go to Settings > Notifications to customize which notifications you receive via email or SMS.',
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">How can we help you?</h1>
        <p className="text-gray-600">Find answers to common questions or contact support</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pl-12 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        
        {filteredFAQs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No questions found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedFAQ === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="mb-6">Our support team is here to assist you</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex flex-col items-center">
              <Mail className="w-8 h-8 mb-2" />
              <div className="font-medium">Email Support</div>
              <a href="mailto:support@ican.edu" className="text-sm hover:underline">
                support@ican.edu
              </a>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex flex-col items-center">
              <Phone className="w-8 h-8 mb-2" />
              <div className="font-medium">Phone Support</div>
              <a href="tel:+2341234567890" className="text-sm hover:underline">
                +234 123 456 7890
              </a>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex flex-col items-center">
              <Clock className="w-8 h-8 mb-2" />
              <div className="font-medium">Office Hours</div>
              <div className="text-sm">Mon-Fri: 8AM - 5PM</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <a
              href="mailto:support@ican.edu"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100"
            >
              Send Email
            </a>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Dashboard</h3>
              <p className="text-sm text-gray-600">View your account overview</p>
            </div>
          </Link>

          <Link
            to="/billing"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Billing</h3>
              <p className="text-sm text-gray-600">Manage payments and invoices</p>
            </div>
          </Link>

          <Link
            to="/enrollment"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Enrollment</h3>
              <p className="text-sm text-gray-600">Register for courses</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-600">Update your preferences</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
