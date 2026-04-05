/**
 * WizardDialogLayout — Multi-step wizard container
 * Portiert aus sin-claude/claude-code-main/src/components/WizardDialogLayout.tsx
 */
import React from 'react';

interface WizardDialogLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  canNext?: boolean;
  canPrevious?: boolean;
}

export const WizardDialogLayout: React.FC<WizardDialogLayoutProps> = ({
  title, currentStep, totalSteps, children, onNext, onPrevious, onComplete, canNext = true, canPrevious = true
}) => (
  <div className="wizard-dialog">
    <div className="wizard-header">
      <h2>{title}</h2>
      <div className="wizard-progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`wizard-step-indicator ${i < currentStep ? 'completed' : ''} ${i === currentStep ? 'active' : ''}`} />
        ))}
      </div>
    </div>
    <div className="wizard-content">{children}</div>
    <div className="wizard-footer">
      <button disabled={!canPrevious} onClick={onPrevious}>Previous</button>
      <button disabled={!canNext} onClick={currentStep === totalSteps - 1 ? onComplete : onNext}>
        {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
      </button>
    </div>
  </div>
);
