
export interface PromptResult {
  positivePrompt: string;
  positivePromptZh: string;
  negativePrompt: string;
  negativePromptZh: string;
  description: string;
  descriptionZh: string;
}

export interface PromptRecord extends PromptResult {
  id: string;
  timestamp: number;
  mediaType: string;
}

export interface User {
  name: string;
  isLoggedIn: boolean;
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: PromptResult | null;
}
