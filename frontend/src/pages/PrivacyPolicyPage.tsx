import { Building2, Shield, Mail, Phone } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-slate-300 text-lg">
            ICAN Tutorial Centre is committed to protecting your privacy and personal information.
          </p>
          <p className="text-slate-400 text-sm mt-4">
            Last Updated: September 9, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains how ICAN Tutorial Centre ("we", "us", or "our") collects, uses, 
              discloses, and protects your personal information when you use our student management system 
              and educational services. By using our services, you consent to the data practices described 
              in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-3">We collect the following personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Identity Information:</strong> Full name, date of birth, gender, nationality</li>
              <li><strong>Contact Information:</strong> Email address, phone number, residential address</li>
              <li><strong>Educational Information:</strong> Academic level, courses enrolled, examination results, attendance records</li>
              <li><strong>Financial Information:</strong> Payment history, invoice records, tuition fees</li>
              <li><strong>Account Information:</strong> Username, password (encrypted), student ID number</li>
              <li><strong>Guardian Information:</strong> Parent/guardian name and contact details (where applicable)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Login timestamps and access logs</li>
              <li>Usage patterns and navigation history within the portal</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use your personal information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Educational Services:</strong> Manage course enrollments, track attendance, record grades, and facilitate learning</li>
              <li><strong>Communication:</strong> Send important notifications about classes, exams, fees, and institutional updates</li>
              <li><strong>Financial Management:</strong> Process tuition payments, generate invoices, and maintain billing records</li>
              <li><strong>Account Management:</strong> Authenticate users, maintain account security, and provide technical support</li>
              <li><strong>Compliance:</strong> Meet legal and regulatory requirements for educational institutions</li>
              <li><strong>Improvement:</strong> Analyze usage patterns to improve our services and user experience</li>
              <li><strong>Safety:</strong> Maintain campus security and ensure student welfare</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 We Do Not Sell Your Information</h3>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Limited Sharing</h3>
            <p className="text-gray-700 mb-3">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Educational Partners:</strong> ICAN (Institute of Chartered Accountants of Nigeria) for examination registration and certification</li>
              <li><strong>Payment Processors:</strong> Paystack and other payment gateways for secure transaction processing</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (hosting, email delivery, analytics)</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or governmental regulation</li>
              <li><strong>Parents/Guardians:</strong> Academic progress and financial information for students under 18</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-3">We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Encryption:</strong> All data transmitted over the internet is encrypted using SSL/TLS protocols</li>
              <li><strong>Password Security:</strong> Passwords are hashed and salted using secure algorithms</li>
              <li><strong>Access Controls:</strong> Role-based access ensures only authorized personnel can view sensitive data</li>
              <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
              <li><strong>Secure Servers:</strong> Data is stored on secure servers with firewall protection</li>
              <li><strong>Audit Trails:</strong> All data access and modifications are logged for accountability</li>
            </ul>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> While we implement robust security measures, no system is 100% secure. 
                We cannot guarantee absolute security but are committed to protecting your data to the best of our ability.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-3">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal information we hold</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Restriction:</strong> Request limitation on how we process your data</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise any of these rights, please contact our Data Protection Officer using the contact 
              information provided below.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-3">We retain your personal information for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Active Students:</strong> Duration of enrollment plus 7 years for academic records</li>
              <li><strong>Financial Records:</strong> 7 years as required by Nigerian tax and accounting laws</li>
              <li><strong>Alumni Records:</strong> Indefinitely for transcripts and certification verification</li>
              <li><strong>Account Data:</strong> Until account deletion is requested (subject to legal requirements)</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-3">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns and improve our services</li>
              <li>Provide personalized content</li>
            </ul>
            <p className="text-gray-700 mt-3">
              You can control cookie settings through your browser preferences. Note that disabling cookies 
              may affect the functionality of our services.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services</h2>
            <p className="text-gray-700 mb-3">Our platform integrates with third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Paystack:</strong> Payment processing (governed by Paystack's privacy policy)</li>
              <li><strong>Email Service:</strong> Transactional emails for notifications</li>
              <li><strong>Cloud Hosting:</strong> Secure data storage and platform hosting</li>
            </ul>
            <p className="text-gray-700 mt-3">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are intended for students aged 16 and above. For students under 18, we require 
              parental/guardian consent for enrollment. Parents and guardians have the right to access, 
              review, and request deletion of their child's information.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700">
              Your data is primarily stored and processed in Nigeria. Some service providers may process 
              data in other countries. We ensure that adequate safeguards are in place to protect your 
              information during any international transfers.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              legal requirements. We will notify you of significant changes via email or through a prominent 
              notice on our platform. The "Last Updated" date at the top indicates when changes were last made.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <Building2 className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">ICAN Tutorial Centre</p>
                  <p className="text-gray-600">Data Protection Officer</p>
                  <p className="text-gray-600">Lagos, Nigeria</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Mail className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href="mailto:privacy@icantutorial.edu" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    privacy@icantutorial.edu
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Phone className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href="tel:+2341234567890" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    +234 123 456 7890
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Regulatory Compliance</h2>
            <p className="text-gray-700">
              This Privacy Policy complies with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
              <li>Nigeria Data Protection Regulation (NDPR) 2019</li>
              <li>Educational institution data protection requirements</li>
              <li>International best practices for data protection</li>
            </ul>
          </section>

          {/* Consent */}
          <section className="border-t pt-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Your Consent</h3>
              <p className="text-emerald-800">
                By using our services, you acknowledge that you have read and understood this Privacy Policy 
                and consent to the collection, use, and disclosure of your information as described herein.
              </p>
            </div>
          </section>

        </div>

        {/* Back to Portal Link */}
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Portal
          </a>
        </div>
      </div>
    </div>
  );
}
