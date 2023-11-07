export class ConversationNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConversationNotFoundError';
    }
}