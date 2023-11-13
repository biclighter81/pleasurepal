import { Request, Response } from "express";
import { inject } from "inversify";
import { PARAMETER_TYPE, controller, httpGet, httpPost, interfaces, params, request, requestBody, response } from "inversify-express-utils";
import { JWTKeycloakUser } from "@/lib/interfaces/keycloak";
import TYPES from "@/lib/symbols";
import { ChatService } from "../services/ChatService";
import { ConversationNotFoundError } from "@/lib/errors/chat";
import { FriendshipNotExists } from "@/lib/errors/friend";

@controller("/chat")
export class ChatController implements interfaces.Controller {

    constructor(
        @inject(TYPES.ChatService) private readonly chatService: ChatService,
    ) { }

    @httpGet('/conversation/direct/:uid', TYPES.AuthMiddleware)
    async getDirectConversation(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            return await this.chatService.getDirectConversation(user.sub, uid);
        } catch (e: any) {
            if (e instanceof ConversationNotFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e)
            res.status(500).send({
                message: e.message,
                name: e.name,
            })
        }
    }

    @httpGet('/messages/:conversationId', TYPES.AuthMiddleware)
    async getMessages(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'conversationId') conversationId: string,
        @params(PARAMETER_TYPE.QUERY, 'offset') offset?: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            return await this.chatService.getMessages(conversationId, user.sub, parseInt(offset));
        } catch (e: any) {
            if (e instanceof ConversationNotFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e)
            res.status(500).send({
                message: e.message,
                name: e.name,
            })
        }
    }

    @httpPost('/conversation/direct/:uid', TYPES.AuthMiddleware)
    async createDirectConversation(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            return await this.chatService.createDirectConversation(user.sub, uid);
        } catch (e: any) {
            if (e instanceof FriendshipNotExists) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e)
            res.status(500).send({
                message: e.message,
                name: e.name,
            })
        }
    }

    @httpPost('/message/:conversationId', TYPES.AuthMiddleware)
    async sendMessage(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'conversationId') conversationId: string,
        @requestBody() body: {
            content: string,
        }
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            return await this.chatService.sendMessage(user.sub, conversationId, body.content);
        } catch (e: any) {
            if (e instanceof ConversationNotFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e)
            res.status(500).send({
                message: e.message,
                name: e.name,
            })
        }
    }
}