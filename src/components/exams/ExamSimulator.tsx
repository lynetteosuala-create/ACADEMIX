import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Download,
  Share2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { DepartmentId, ExamResult, ExamSession, UserProfile } from '../../types';
import { sound } from '../../utils/audio';
import { MOCK_EXAM_SESSIONS } from '../../utils/mockData';

interface ExamSimulatorProps {
  user: UserProfile;
  departmentId?: DepartmentId;
  onExamComplete?: (result: ExamResult) => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  user,
  departmentId = 'science',
  onExamComplete,
}) => {
  const [selectedExam, setSelectedExam] = useState<ExamSession>(MOCK_EXAM_SESSIONS[0]);
  const [status, setStatus] = useState<'intro' | 'in_progress' | 'grading' | 'results'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Switch exam based on department
    const match = MOCK_EXAM_SESSIONS.find((e) => e.department === departmentId);
    if (match) setSelectedExam(match);
  }, [departmentId]);

  useEffect(() => {
    if (status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [status]);

  const startExam = () => {
    sound.playTerminalBeep();
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setCurrentQIndex(0);
    setSecondsRemaining(selectedExam.totalTimeMinutes * 60);
    setStatus('in_progress');
  };

  const handleSelectAnswer = (optionIdx: number) => {
    sound.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optionIdx,
    }));
  };

  const toggleFlag = (qIdx: number) => {
    sound.playClick();
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qIdx)) next.delete(qIdx);
      else next.add(qIdx);
      return next;
    });
  };

  const handleAutoSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('grading');
    sound.playTerminalBeep();

    setTimeout(() => {
      evaluateExam();
    }, 1500);
  };

  const evaluateExam = () => {
    let correctCount = 0;
    const questions = selectedExam.questions;
    const answersBreakdown = questions.map((q, idx) => {
      const selected = userAnswers[idx] !== undefined ? userAnswers[idx] : -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionIndex: idx,
        selectedIndex: selected,
        isCorrect,
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= selectedExam.passingScore;

    const result: ExamResult = {
      examId: selectedExam.id,
      title: selectedExam.title,
      department: selectedExam.department,
      score: percentage,
      totalQuestions: questions.length,
      correctCount,
      percentage,
      passed,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      feedback: passed
        ? `Exemplary performance. Candidate demonstrated high command of formal principles and analytical precision.`
        : `Minimum competency threshold not attained. Recommended remediation in theoretical fundamentals.`,
      answers: answersBreakdown,
    };

    setExamResult(result);
    setStatus('results');

    if (passed) {
      sound.playSuccess();
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
    } else {
      sound.playError();
    }

    if (onExamComplete) {
      onExamComplete(result);
    }
  };

  const currentQ = selectedExam.questions[currentQIndex];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Intro Stage */}
      {status === 'intro' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold">
                Official Certification Protocol
              </span>
              <h1 className="text-2xl font-bold text-white font-display mt-0.5">{selectedExam.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase block text-[10px]">Time Allowed</span>
              <span className="text-sm font-bold text-white">{selectedExam.totalTimeMinutes} Minutes</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase block text-[10px]">Total Items</span>
              <span className="text-sm font-bold text-white">{selectedExam.questions.length} Questions</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase block text-[10px]">Passing Score</span>
              <span className="text-sm font-bold text-emerald-400">{selectedExam.passingScore}% Requirement</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <p className="font-bold text-white mb-1">Standard Academy Examination Guidelines:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Once initiated, the examination timer runs continuously until final submission.</li>
              <li>Questions can be flagged for review and navigated in non-linear sequence.</li>
              <li>Official certificates and diploma credentials are generated upon passing.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={startExam}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>COMMENCE PROCTORED EXAMINATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* In Progress Stage */}
      {status === 'in_progress' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          {/* Header Bar with Countdown & Question Progress */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Item {currentQIndex + 1} of {selectedExam.questions.length}
              </span>
              <span className="text-xs text-slate-400">• {currentQ.category}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFlag(currentQIndex)}
                className={`px-3 py-1 text-xs rounded-lg font-mono border transition-all cursor-pointer ${
                  flaggedQuestions.has(currentQIndex)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {flaggedQuestions.has(currentQIndex) ? '⚑ Flagged for Review' : '⚐ Flag Question'}
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                <Clock className={`w-3.5 h-3.5 ${secondsRemaining < 120 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className={`font-bold ${secondsRemaining < 120 ? 'text-red-400' : 'text-white'}`}>
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-sm md:text-base font-medium text-slate-100 leading-relaxed">
            {currentQ.question}
          </div>

          {/* Multiple Choice Answers */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = userAnswers[currentQIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`p-4 rounded-xl border text-left text-xs md:text-sm transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-100 font-medium'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Question Navigator Grid */}
          <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
              {selectedExam.questions.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = currentQIndex === idx;
                const isFlagged = flaggedQuestions.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.playClick();
                      setCurrentQIndex(idx);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all relative cursor-pointer ${
                      isCurrent
                        ? 'border border-cyan-400 text-white bg-cyan-500/30'
                        : isAnswered
                        ? 'bg-slate-800 text-cyan-300'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-0.5 right-0.5" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={currentQIndex === 0}
                onClick={() => {
                  sound.playClick();
                  setCurrentQIndex((p) => p - 1);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {currentQIndex < selectedExam.questions.length - 1 ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    setCurrentQIndex((p) => p + 1);
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleAutoSubmit}
                  className="px-5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                >
                  FINALIZE & SUBMIT
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Stage */}
      {status === 'grading' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[380px] shadow-2xl">
          <Sparkles className="w-12 h-12 text-cyan-400 animate-spin" />
          <h2 className="text-xl font-bold text-white font-display">ACADEMIX AUTO-MARKING ARBITER ACTIVE</h2>
          <p className="text-xs font-mono text-slate-400 max-w-sm">
            Verifying candidate answers against formal rubric keys, compiling statistical distribution, and preparing certification credentials...
          </p>
        </div>
      )}

      {/* Results & Holographic Diploma Stage */}
      {status === 'results' && examResult && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400">Exam Results Summary</span>
                <h2 className="text-xl font-bold text-white font-display">{examResult.title}</h2>
              </div>

              <div className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                examResult.passed
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {examResult.passed ? 'STATUS: CERTIFIED PASS' : 'STATUS: REMEDIATION REQUIRED'}
              </div>
            </div>

            {/* Score Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Score Achieved</span>
                <div className={`text-2xl font-extrabold ${examResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {examResult.percentage}%
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Correct Answers</span>
                <div className="text-2xl font-extrabold text-white">
                  {examResult.correctCount} / {examResult.totalQuestions}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Passing Threshold</span>
                <div className="text-2xl font-extrabold text-slate-300">{selectedExam.passingScore}%</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Verification Date</span>
                <div className="text-sm font-bold text-cyan-400 mt-1">{examResult.timestamp}</div>
              </div>
            </div>

            {/* Holographic Academy Certificate (if passed) */}
            {examResult.passed && (
              <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-500/50 shadow-2xl flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 mb-1">
                  <Award className="w-8 h-8" />
                </div>
                <div className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                  ACADEMIX CENTRAL SENATE OF SCHOLARS
                </div>
                <h3 className="text-2xl font-extrabold text-white font-display">
                  CERTIFICATE OF ACADEMIC MASTERY
                </h3>
                <p className="text-xs text-slate-300 max-w-lg">
                  This certifies that Scholar <span className="text-white font-bold">{user.name}</span> ({user.callsign})
                  has completed all rigorous examination requirements in {examResult.title} with distinction.
                </p>
                <div className="flex items-center gap-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Authorized by: Provost Vance</span>
                  <span>•</span>
                  <span>Protocol ID: ACMX-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Question by Question Review */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase">Detailed Item Key Review</h3>
              {selectedExam.questions.map((q, idx) => {
                const userChoice = userAnswers[idx];
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
                      isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Item {idx + 1}: {q.question}</span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-slate-300">
                      Your answer: <span className="font-mono text-white">{q.options[userChoice] || 'No selection'}</span>
                    </div>
                    {!isCorrect && (
                      <div className="text-emerald-300">
                        Correct answer: <span className="font-mono font-bold">{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                    <div className="text-slate-400 font-mono text-[11px] mt-1 border-t border-slate-800/80 pt-1">
                      Explanation: {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStatus('intro')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Certification Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
