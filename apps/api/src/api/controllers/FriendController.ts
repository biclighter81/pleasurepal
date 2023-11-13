import { inject } from "inversify";
import { PARAMETER_TYPE, controller, httpGet, httpPost, interfaces, params, request, response } from "inversify-express-utils";
import TYPES from "@/lib/symbols";
import { FriendService } from "../services/FriendService";
import { Request, Response } from "express";
import { JWTKeycloakUser } from "@/lib/interfaces/keycloak";
import { FriendshipAlreadyExists, FriendshipRequestAlreadyExists, FriendshipRequestBlocked, FriendshipRequestNotFound } from "@/lib/errors/friend";

@controller("/friends")
export class FriendController implements interfaces.Controller {

    constructor(
        @inject(TYPES.FriendService) private friendSrv: FriendService,
    ) { }

    @httpPost('/request', TYPES.AuthMiddleware)
    async requestFriendship(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.BODY, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            return await this.friendSrv.requestFriendship(user.sub, uid);
        } catch (e) {
            if (
                e instanceof FriendshipAlreadyExists ||
                e instanceof FriendshipRequestAlreadyExists ||
                e instanceof FriendshipRequestBlocked ||
                e instanceof FriendshipAlreadyExists
            ) {
                res.status(400).send({
                    message: e.message,
                    name: e.name,
                })
            }
            res.status(500).send({
                message: 'Something went wrong',
            })
        }
    }

    @httpGet('/', TYPES.AuthMiddleware)
    async getFriends(@request() req: Request) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        return this.friendSrv.getFriends(user.sub);
    }

    @httpGet('/friend/:uid', TYPES.AuthMiddleware)
    async getFriend(
        @request() req: Request,
        @params(PARAMETER_TYPE.PARAMS, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        return this.friendSrv.getFriend(user.sub, uid);
    }

    @httpGet('/requests', TYPES.AuthMiddleware)
    async getFriendshipRequests(
        @request() req: Request,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        return this.friendSrv.getPending(user.sub);
    }

    @httpPost('/accept', TYPES.AuthMiddleware)
    async acceptFriendshipRequest(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.BODY, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        if (!uid) {
            res.status(400).send({
                message: 'Missing uid in body',
            })
        }
        try {
            return await this.friendSrv.accept(uid, user.sub);
        } catch (e) {
            if (e instanceof FriendshipRequestNotFound) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })

            }
            res.status(500).send({
                message: 'Something went wrong',
            })
        }
    }

    @httpPost('/reject', TYPES.AuthMiddleware)
    async rejectFriendshipRequest(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.BODY, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        if (!uid) {
            res.status(400).send({
                message: 'Missing uid in body',
            })
        }
        try {
            return await this.friendSrv.reject(uid, user.sub);
        } catch (e) {
            if (e instanceof FriendshipRequestNotFound) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            res.status(500).send({
                message: 'Something went wrong',
            })
        }
    }

    @httpPost('/block', TYPES.AuthMiddleware)
    async blockUser(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.BODY, 'uid') uid: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        if (!uid) {
            res.status(400).send({
                message: 'Missing uid in body',
            })
        }
        try {
            return await this.friendSrv.block(uid, user.sub);
        } catch (e) {
            if (e instanceof FriendshipRequestNotFound) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            res.status(500).send({
                message: 'Something went wrong',
            })
        }
    }

}