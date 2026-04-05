/**
 * WizardProvider — State management for wizards
 */
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface WizardState {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  data: Record<string, unknown>;
}

type WizardAction =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GO_TO'; step: number }
  | { type: 'SET_DATA'; key: string; value: unknown }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'NEXT': return { ...state, currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1), completedSteps: new Set([...state.completedSteps, state.currentStep]) };
    case 'PREVIOUS': return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'GO_TO': return { ...state, currentStep: action.step };
    case 'SET_DATA': return { ...state, data: { ...state.data, [action.key]: action.value } };
    case 'RESET': return { currentStep: 0, totalSteps: state.totalSteps, completedSteps: new Set(), data: {} };
    default: return state;
  }
}

const WizardContext = createContext<{ state: WizardState; dispatch: React.Dispatch<WizardAction> } | null>(null);

export const WizardProvider: React.FC<{ totalSteps: number; children: ReactNode }> = ({ totalSteps, children }) => {
  const [state, dispatch] = useReducer(wizardReducer, { currentStep: 0, totalSteps, completedSteps: new Set<number>(), data: {} });
  return <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>;
};

export const useWizard = () => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
};
