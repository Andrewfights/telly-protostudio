import React from 'react';
import { Brain, Lightbulb, Code, CheckCircle, Loader2, HelpCircle } from 'lucide-react';
import type { GenerationProgress, PromptAnalysis } from '../services/aiService';

interface ThinkingPanelProps {
  isVisible: boolean;
  progress: GenerationProgress | null;
  analysis: PromptAnalysis | null;
  onAnswerQuestions?: (answers: Record<string, string>) => void;
  pendingQuestions?: string[];
}

const PhaseIcon: React.FC<{ phase: GenerationProgress['phase'] }> = ({ phase }) => {
  switch (phase) {
    case 'analyzing':
      return <Brain className="w-5 h-5 text-purple-400 animate-pulse" />;
    case 'planning':
      return <Lightbulb className="w-5 h-5 text-yellow-400 animate-pulse" />;
    case 'generating':
      return <Code className="w-5 h-5 text-cyan-400 animate-pulse" />;
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    default:
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
  }
};

const PhaseLabel: React.FC<{ phase: GenerationProgress['phase'] }> = ({ phase }) => {
  const labels: Record<GenerationProgress['phase'], string> = {
    analyzing: 'Analyzing Request',
    planning: 'Planning Implementation',
    generating: 'Generating Code',
    complete: 'Complete'
  };
  return <span>{labels[phase]}</span>;
};

const ThinkingPanel: React.FC<ThinkingPanelProps> = ({
  isVisible,
  progress,
  analysis,
  onAnswerQuestions,
  pendingQuestions
}) => {
  const [questionAnswers, setQuestionAnswers] = React.useState<Record<string, string>>({});

  if (!isVisible) return null;

  // Show clarification questions
  if (pendingQuestions && pendingQuestions.length > 0 && onAnswerQuestions) {
    return (
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <HelpCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Clarification Needed</h3>
            <p className="text-sm text-gray-500">Please answer these questions to help me build exactly what you want:</p>
          </div>
        </div>

        <div className="space-y-4">
          {pendingQuestions.map((question, idx) => (
            <div key={idx} className="space-y-2">
              <label className="text-base text-gray-300 font-medium">
                {idx + 1}. {question}
              </label>
              <input
                type="text"
                value={questionAnswers[question] || ''}
                onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [question]: e.target.value }))}
                placeholder="Your answer..."
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => onAnswerQuestions(questionAnswers)}
          disabled={Object.keys(questionAnswers).length < pendingQuestions.length}
          className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
        >
          Continue with Answers
        </button>
      </div>
    );
  }

  // Show thinking/progress
  if (!progress) return null;

  return (
    <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
      {/* Header with phase */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-3">
          <PhaseIcon phase={progress.phase} />
          <span className="text-white font-medium">
            <PhaseLabel phase={progress.phase} />
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{progress.progress}%</span>
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thinking content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        <div className="space-y-2 font-mono text-sm">
          {progress.thinking.map((thought, idx) => {
            // Handle separator
            if (thought === '---') {
              return <hr key={idx} className="border-white/10 my-3" />;
            }
            // Handle headers
            if (thought.endsWith(':')) {
              return (
                <p key={idx} className="text-purple-400 font-semibold mt-2">
                  {thought}
                </p>
              );
            }
            // Regular thought
            return (
              <p key={idx} className="text-gray-400 flex items-start space-x-2">
                <span className="text-cyan-500 mt-0.5">→</span>
                <span>{thought}</span>
              </p>
            );
          })}

          {/* Current step indicator */}
          {progress.phase !== 'complete' && (
            <p className="text-cyan-400 flex items-center space-x-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress.currentStep}...</span>
            </p>
          )}
        </div>
      </div>

      {/* Confidence indicator */}
      {analysis && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500">Confidence</span>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-0.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-4 rounded-sm transition-colors ${
                    analysis.confidence >= level * 20
                      ? 'bg-green-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">{analysis.confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingPanel;
