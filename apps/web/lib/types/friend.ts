export interface FriendRequest {
  from: string;
  to: string;
}

export interface Friend {
  uid: string;
  from: string;
  to: string;
  rejectedAt?: any;
  acceptedAt: string;
  blockedAt?: any;
  updatedAt: string;
  createdAt: string;
  username: string;
  email: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}
