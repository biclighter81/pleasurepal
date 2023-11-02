export class NoSessionFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSessionFoundError';
  }
}

export class UserNotInSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotInSessionError';
  }
}
