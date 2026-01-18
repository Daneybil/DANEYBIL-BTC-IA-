
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  hasCode?: boolean;
  image?: string;
  needsConfirmation?: boolean;
  isConfirmed?: boolean;
}

export interface SystemStats {
  engineStatus: 'Optimal' | 'Degraded' | 'Offline';
  precisionLevel: number;
  marketSync: boolean;
  securityHash: string;
  activeDeployments: number;
  strictMode: boolean;
}
