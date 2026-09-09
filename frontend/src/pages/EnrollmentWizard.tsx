import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { enrollmentService } from '../services/enrollmentService';
import { sessionsService, levelsService, offeringsService } from '../services/academicsService';
import type { EnrollmentCreateData } from '../types/enrollment';
import type { CourseOfferingListItem } from '../types/academics';

type WizardStep = 'session' | 'level' | 'courses' | 'review';

const EnrollmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('session');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch data
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsService.getAll,
  });

  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsService.getAll,
  });

  const { data: offerings, isLoading: offeringsLoading } = useQuery({
    queryKey: ['offerings', selectedSession, selectedLevel],
    queryFn: () =>
      offeringsService.getAll({
        session: selectedSession,
        is_active: true,
      }),
    enabled: !!selectedSession,
  });

  // Filter offerings by selected level
  const availableOfferings = React.useMemo(() => {
    if (!Array.isArray(offerings) || !selectedLevel) return [];
    
    const selectedLevelObj = Array.isArray(levels) ? levels.find(l => l.id === selectedLevel) : null;
    if (!selectedLevelObj) return [];

    return offerings.filter(
      (offering: CourseOfferingListItem) => 
        offering.level_name === selectedLevelObj.name
    );
  }, [offerings, selectedLevel, levels]);

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: (data: EnrollmentCreateData) => enrollmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      navigate('/enrollments');
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create enrollment');
    },
  });

  const handleNext = () => {
    setError('');

    if (currentStep === 'session') {
      if (!selectedSession) {
        setError('Please select an academic session');
        return;
      }
      setCurrentStep('level');
    } else if (currentStep === 'level') {
      if (!selectedLevel) {
        setError('Please select a level');
        return;
      }
      setCurrentStep('courses');
    } else if (currentStep === 'courses') {
      if (selectedCourses.length === 0) {
        setError('Please select at least one course');
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
      setError('Please complete all required fields');
      return;
    }

    const enrollmentData: EnrollmentCreateData = {
      session: selectedSession,
      level: selectedLevel,
      course_offerings: selectedCourses,
      notes: notes || undefined,
    };

    createEnrollmentMutation.mutate(enrollmentData);
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

  const steps = [
    { key: 'session', label: 'Session', number: 1 },
    { key: 'level', label: 'Level', number: 2 },
    { key: 'courses', label: 'Courses', number: 3 },
    { key: 'review', label: 'Review', number: 4 },
  ];

  const currentStepNumber = steps.findIndex((s) => s.key === currentStep) + 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Enrollment</h1>
          <p className="mt-2 text-sm text-gray-600">
            Select your session, level, and courses to enroll
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm ${
                      currentStepNumber >= step.number
                        ? 'bg-primary-600 text-white border-primary-600'
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
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
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

              {sessionsLoading ? (
                <p className="text-gray-500">Loading sessions...</p>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions
                    .filter((session) => session.is_active)
                    .map((session) => (
                      <label
                        key={session.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                          selectedSession === session.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="session"
                          value={session.id}
                          checked={selectedSession === session.id}
                          onChange={(e) => setSelectedSession(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
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

              {levelsLoading ? (
                <p className="text-gray-500">Loading levels...</p>
              ) : levels && levels.length > 0 ? (
                <div className="space-y-3">
                  {levels
                    .filter((level) => level.is_active)
                    .sort((a, b) => a.order - b.order)
                    .map((level) => (
                      <label
                        key={level.id}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                          selectedLevel === level.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="level"
                          value={level.id}
                          checked={selectedLevel === level.id}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500"
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
                <p className="text-gray-500">Loading courses...</p>
              ) : availableOfferings && availableOfferings.length > 0 ? (
                <div className="space-y-3">
                  {availableOfferings.map((offering) => (
                    <label
                      key={offering.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                        selectedCourses.includes(offering.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(offering.id)}
                        onChange={() => toggleCourse(offering.id)}
                        className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {offering.course_code} - {offering.course_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Level: {offering.level_name}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No course offerings available for the selected session and level
                </p>
              )}

              <p className="mt-4 text-sm text-gray-600">
                Selected: {selectedCourses.length} course(s)
              </p>
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
                        className="text-sm text-gray-900 p-2 bg-gray-50 rounded"
                      >
                        {offering.course_code} - {offering.course_name}
                      </li>
                    ))}
                  </ul>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Info box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Your enrollment will be created as a draft. You can submit it
                    for approval once you're ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/enrollments')}
            className="btn-secondary"
            disabled={createEnrollmentMutation.isPending}
          >
            Cancel
          </button>

          <div className="flex space-x-3">
            {currentStep !== 'session' && (
              <button
                onClick={handleBack}
                className="btn-secondary"
                disabled={createEnrollmentMutation.isPending}
              >
                Back
              </button>
            )}

            {currentStep !== 'review' ? (
              <button onClick={handleNext} className="btn-primary">
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={createEnrollmentMutation.isPending}
              >
                {createEnrollmentMutation.isPending
                  ? 'Creating...'
                  : 'Create Enrollment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentWizard;
