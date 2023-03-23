import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {

    constructor() { }

    async getDirectConversation(requesterUid: string, uid: string) { }

}
