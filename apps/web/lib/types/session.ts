interface User {
  uid: string;
  pleasureSessionId: string;
  inviteAccepted: boolean;
  active: boolean;
  hasControl: boolean;
  lastActive: string;
  updatedAt: string;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  initiatorId: string;
  active: boolean;
  isDiscord: boolean;
  inviteToken: string;
  updatedAt: string;
  createdAt: string;
  user: User[];
}

export interface SessionResponse {
  sessions: Session[];
  total: number;
  offset: number;
  nextOffset?: any;
}
