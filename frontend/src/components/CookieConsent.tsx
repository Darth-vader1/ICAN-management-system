import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_choice');
    if (!consent) {
      // Show banner after short delay for smoother page entrance
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'essential_only') => {
    localStorage.setItem('cookie_consent_choice', choice);
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 transition-all duration-300">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🍪</span>
            <h4 className="text-sm font-bold text-white font-serif">Cookie & Privacy Preferences</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            We use essential cookies to maintain your authenticated portal session and security. With your permission, we also store basic preference data.{' '}
            <Link to="/privacy" className="text-[#C49A45] hover:underline font-medium">
              Read Privacy Policy
            </Link>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <button
            onClick={() => handleChoice('essential_only')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleChoice('accepted')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#C49A45] hover:bg-[#b0883b] text-slate-950 text-xs font-bold transition-colors shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
