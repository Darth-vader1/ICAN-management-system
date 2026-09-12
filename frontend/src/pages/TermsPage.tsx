import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-xs font-bold text-[#C49A45] uppercase tracking-widest hover:underline">
              ICAN Tutorial Centre
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 font-bold tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: September 12, 2026 · Effective Immediately
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using the ICAN Tutorial Centre Management Platform, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, you must not access or use the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">2. Student Registration & Account Security</h2>
            <p>
              Students must provide accurate, current, and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Promptly notify administration of any unauthorized access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">3. Course Enrollment & Academic Levels</h2>
            <p>
              Enrollments are structured around ICAN examination levels (Foundation, Skills, Professional). Students may only enroll in courses for which they meet prerequisite requirements set by ICAN and the Tutorial Centre.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">4. Fees, Payments & Refunds</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Tuition fees are generated upon enrollment and billed per session.</li>
              <li>Payments made via online channels (Paystack) or manual bank transfers must be verified prior to course access confirmation.</li>
              <li>Fees are non-refundable once classes for the enrolled session have commenced, unless explicitly approved by management.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">5. Code of Conduct & Attendance</h2>
            <p>
              Students are expected to maintain professional conduct during tutorials, attendance tracking, and portal interactions. Disruptive behavior, academic dishonesty, or misuse of study materials may result in suspension or account termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">6. Intellectual Property</h2>
            <p>
              All lecture materials, timetables, software interfaces, and content provided through this platform remain the intellectual property of ICAN Tutorial Centre. Distribution or commercial exploitation of course materials is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">7. Limitation of Liability</h2>
            <p>
              While we strive for 100% platform availability and accurate academic records, ICAN Tutorial Centre is not liable for indirect, incidental, or consequential damages resulting from technical downtime, third-party gateway delays, or internet disruptions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 font-serif">8. Amendments & Contact</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms. For inquiries regarding these terms, contact us at{' '}
              <a href="mailto:support@icantutorial.edu.ng" className="text-blue-600 font-medium hover:underline">
                support@icantutorial.edu.ng
              </a>.
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 ICAN Tutorial Centre. All rights reserved.</p>
          <div className="flex gap-4 font-medium text-slate-700">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/help" className="hover:underline">Help & Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
