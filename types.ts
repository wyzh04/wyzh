
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
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  loginType: 'google' | 'wechat' | 'phone' | 'guest' | null;
  isLoggedIn: boolean;
  registeredAt: number;
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: PromptResult | null;
}
