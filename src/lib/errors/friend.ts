export class FriendshipRequestAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendshipRequestAlreadyExistsError';
  }
}

export class FriendshipRequestNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendshipRequestNotFound';
  }
}
