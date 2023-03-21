export class FriendshipRequestAlreadyExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FriendshipRequestAlreadyExistsError';
    }
}