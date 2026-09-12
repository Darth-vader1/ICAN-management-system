import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAcademicSessions, useLevels, useOfferings, useCreateEnrollment } from '../hooks/queries';
import { levelTierService } from '../services/billingService';
import { useNavigate } from 'react-router-dom';
import type { EnrollmentCreateData } from '../types/enrollment';
import type { CourseOfferingListItem } from '../types/academics';
import { FormSkeleton } from '../components/LoadingSkeleton';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { showToast } from '../lib/toast';

type WizardStep = 'session' | 'level' | 'courses' | 'review';

const EnrollmentWizard: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('session');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch data
  const { data: sessions, isLoading: sessionsLoading } = useAcademicSessions();
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: offerings, isLoading: offeringsLoading } = useOfferings({
    session: selectedSession,
    is_active: true,
  });

  // Filter offerings by selected level
  const availableOfferings = React.useMemo(() => {
    if (!Array.isArray(offerings) || !selectedLevel) return [];
    
    const selectedLevelObj = Array.isArray(levels) ? levels.find(l => l.id === selectedLevel) : null;

    return offerings.filter((offering: any) => {
      if (offering.level_id && offering.level_id === selectedLevel) return true;
      if (selectedLevelObj) {
        if (offering.level_name && offering.level_name.toLowerCase() === selectedLevelObj.name.toLowerCase()) return true;
        if (offering.level_code && offering.level_code.toLowerCase() === selectedLevelObj.code.toLowerCase()) return true;
      }
      return false;
    });
  }, [offerings, selectedLevel, levels]);

  // Create enrollment mutation
  const createEnrollmentMutation = useCreateEnrollment();

  const handleNext = () => {
    setError('');

    if (currentStep === 'session') {
      if (!selectedSession) {
        const msg = 'Please select an academic session';
        setError(msg);
        showToast.error(msg);
        return;
      }
      setCurrentStep('level');
    } else if (currentStep === 'level') {
      if (!selectedLevel) {
        const msg = 'Please select a level';
        setError(msg);
        showToast.error(msg);
        return;
      }
      setCurrentStep('courses');
    } else if (currentStep === 'courses') {
      if (selectedCourses.length === 0) {
        const msg = 'Please select at least one course';
        setError(msg);
        showToast.error(msg);
        return;
      }
      if (totalSelectedFee === 0) {
        const msg = `Tuition fee rate for ${selectedLevelData?.name || 'this'} Level (${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''}) has not been set in the database by administration.`;
        setError(msg);
        showToast.error(msg);
        return;
      }
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setError('');

    if (currentStep === 'level') {
      setCurrentStep('session');
    } else if (currentStep === 'courses') {
      setCurrentStep('level');
    } else if (currentStep === 'review') {
      setCurrentStep('courses');
    }
  };

  const handleSubmit = () => {
    setError('');

    if (!selectedSession || !selectedLevel || selectedCourses.length === 0) {
      const msg = 'Please complete all required fields';
      setError(msg);
      showToast.error(msg);
      return;
    }

    const enrollmentData: EnrollmentCreateData = {
      session: selectedSession,
      level: selectedLevel,
      course_offerings: selectedCourses,
      notes: notes || undefined,
    };

    createEnrollmentMutation.mutate(
      { data: enrollmentData },
      {
        onSuccess: (res: any) => {
          showToast.success('Enrollment created & tuition invoice generated! Please complete payment.');
          if (res?.invoice_id) {
            navigate(`/billing/invoice/${res.invoice_id}`);
          } else {
            navigate('/billing');
          }
        },
        onError: (err: any) => {
          const errorMsg = err.response?.data?.detail || 'Failed to create enrollment';
          setError(errorMsg);
        },
      }
    );
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const selectedSessionData = Array.isArray(sessions) ? sessions.find((s) => s.id === selectedSession) : null;
  const selectedLevelData = Array.isArray(levels) ? levels.find((l) => l.id === selectedLevel) : null;
  const selectedCoursesData = availableOfferings.filter((o) =>
    selectedCourses.includes(o.id)
  );

  const { data: levelTiersRes = [] } = useQuery({
    queryKey: ['levelTiers', selectedLevel],
    queryFn: () => levelTierService.getAll({ level: selectedLevel }),
    enabled: Boolean(selectedLevel),
  });

  const totalSelectedFee = React.useMemo(() => {
    const count = selectedCourses.length;
    if (count === 0) return 0;

    // Check dynamic level tier pricing in database
    if (Array.isArray(levelTiersRes) && levelTiersRes.length > 0) {
      const levelMatches = levelTiersRes.filter((t: any) => {
        const isCountMatch = Number(t.course_count) === count;
        const isActive = t.is_active !== false;
        if (!isCountMatch || !isActive) return false;

        if (!t.level || t.level === selectedLevel || t.level_id === selectedLevel) return true;
        if (typeof t.level === 'object' && (t.level.id === selectedLevel || t.level.code === selectedLevelData?.code)) return true;
        return true;
      });

      const exactSessionMatch = levelMatches.find((t: any) => t.session === selectedSession);
      const globalSessionMatch = levelMatches.find((t: any) => !t.session);
      const match = exactSessionMatch || globalSessionMatch || levelMatches[0];

      if (match && match.amount !== undefined) {
        return parseFloat(String(match.amount));
      }
    }

    return 0;
  }, [selectedCourses.length, selectedLevel, selectedLevelData, levelTiersRes, selectedSession]);

  const steps = [
    { key: 'session', label: 'Session', number: 1 },
    { key: 'level', label: 'Level', number: 2 },
    { key: 'courses', label: 'Courses', number: 3 },
    { key: 'review', label: 'Review', number: 4 },
  ];

  const currentStepNumber = steps.findIndex((s) => s.key === currentStep) + 1;

  // Show loading skeleton while data loads
  if (sessionsLoading || levelsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">New Enrollment</h1>
          </div>
          <FormSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Professional, clean */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Enrollment</h1>
          <p className="mt-2 text-sm text-gray-600">
            Select your session, level, and courses to enroll
          </p>
        </div>

        {/* Progress Steps - Simple, NO gradients or fancy effects */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[450px]">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm ${
                      currentStepNumber >= step.number
                        ? 'bg-[#0f172a] text-white border-[#0f172a]'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStepNumber >= step.number
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStepNumber > step.number
                        ? 'bg-[#0f172a]'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message - Clean, simple */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Wizard Content */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {/* Step 1: Select Session */}
          {currentStep === 'session' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Academic Session
              </h2>

              {sessions && sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions
                    .filter((session) => session.is_active)
                    .map((session) => (
                      <label
                        key={session.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSession === session.id
                            ? 'border-[#0f172a] bg-slate-50/80 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="session"
                          value={session.id}
                          checked={selectedSession === session.id}
                          onChange={(e) => setSelectedSession(e.target.value)}
                          className="h-4 w-4 text-[#0f172a] focus:ring-[#0f172a]"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {session.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.start_date).toLocaleDateString()} -{' '}
                            {new Date(session.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        {session.is_active && (
                          <span className="ml-3 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </label>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No active sessions available. Please contact administration.
                </p>
              )}
            </div>
          )}

          {/* Step 2: Select Level */}
          {currentStep === 'level' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select ICAN Level
              </h2>

              {levels && levels.length > 0 ? (
                <div className="space-y-3">
                  {levels
                    .filter((level) => level.is_active)
                    .sort((a, b) => a.order - b.order)
                    .map((level) => (
                      <label
                        key={level.id}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedLevel === level.id
                            ? 'border-[#0f172a] bg-slate-50/80 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="level"
                          value={level.id}
                          checked={selectedLevel === level.id}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="h-4 w-4 mt-1 text-[#0f172a] focus:ring-[#0f172a]"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {level.name} Level
                          </p>
                          {level.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {level.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No levels available</p>
              )}
            </div>
          )}

          {/* Step 3: Select Courses */}
          {currentStep === 'courses' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Courses
              </h2>

              {offeringsLoading ? (
                <div className="space-y-3">
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ) : availableOfferings && availableOfferings.length > 0 ? (
                <div className="space-y-3">
                  {availableOfferings.map((offering) => (
                    <label
                      key={offering.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCourses.includes(offering.id)
                          ? 'border-[#0f172a] bg-slate-50/80 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(offering.id)}
                        onChange={() => toggleCourse(offering.id)}
                        className="h-4 w-4 mt-1 text-[#0f172a] focus:ring-[#0f172a] rounded"
                      />
                      <div className="ml-3 flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {offering.course_code} - {offering.course_name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Level: {offering.level_name}
                          </p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full border border-slate-200">
                          {offering.level_name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No course offerings available for the selected session and level
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                <span>
                  {selectedCourses.length === 0 ? (
                    'No courses selected'
                  ) : (
                    <span className="font-medium text-blue-600">
                      {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </span>
                {totalSelectedFee > 0 && (
                  <span className="font-bold text-slate-900 text-sm">
                    Level Tuition Fee: <span className="text-emerald-600">₦{totalSelectedFee.toLocaleString('en-NG')}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Review & Confirm
              </h2>

              <div className="space-y-6">
                {/* Session */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Academic Session
                  </h3>
                  <p className="text-base text-gray-900">
                    {selectedSessionData?.label}
                  </p>
                </div>

                {/* Level */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    ICAN Level
                  </h3>
                  <p className="text-base text-gray-900">
                    {selectedLevelData?.name} Level
                  </p>
                </div>

                {/* Courses */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Selected Courses ({selectedCoursesData.length})
                  </h3>
                  <ul className="space-y-2">
                    {selectedCoursesData.map((offering) => (
                      <li
                        key={offering.id}
                        className="text-sm text-gray-900 p-3 bg-gray-50 rounded flex justify-between items-center"
                      >
                        <span className="font-medium">{offering.course_code} - {offering.course_name}</span>
                        <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">
                          {offering.level_name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 p-3 bg-slate-100 rounded-lg flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Total Level Tuition Fee ({selectedLevelData?.name} - {selectedCoursesData.length} Course{selectedCoursesData.length !== 1 ? 's' : ''}):</span>
                    <span className="text-emerald-600 text-base">₦{totalSelectedFee.toLocaleString('en-NG')}</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-500 mb-2"
                  >
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a]"
                  />
                </div>

                {/* Info box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-slate-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-700">
                      Confirming will generate your tuition invoice for <strong className="text-slate-900">₦{totalSelectedFee.toLocaleString('en-NG')}</strong>. You will be redirected to complete payment immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <button
            onClick={() => navigate('/enrollments')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            disabled={createEnrollmentMutation.isPending}
          >
            Cancel
          </button>

          <div className="flex space-x-3">
            {currentStep !== 'session' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                disabled={createEnrollmentMutation.isPending}
              >
                Back
              </button>
            )}

            {currentStep !== 'review' ? (
              <button 
                onClick={handleNext} 
                className="px-5 py-2 bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm"
              >
                Next
              </button>
            ) : (
              <ButtonWithLoading
                onClick={handleSubmit}
                isLoading={createEnrollmentMutation.isPending}
                className="px-5 py-2 bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm"
              >
                Create Enrollment
              </ButtonWithLoading>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentWizard;
