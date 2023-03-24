export class FriendshipRequestAlreadyExists extends Error {
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

export class FriendshipRequestBlocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendshipRequestBlocked';
  }
}

export class FriendshipAlreadyExists extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrindshipAlreadyExists';
  }
}


export class FriendshipNotExists extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendshipNotExists';
  }
}