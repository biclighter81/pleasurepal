import { inject } from "inversify";
import { PARAMETER_TYPE, controller, httpGet, httpPost, interfaces, params, request, requestBody, response } from "inversify-express-utils";
import TYPES from "../../lib/symbols";
import { SessionService } from "../services/SessionService";
import { Request, Response } from "express";
import { JWTKeycloakUser } from "../../lib/interfaces/keycloak";
import { NoSessionFoundError } from "../../lib/errors/session";
import { DiscordSessionService } from "../services/DiscordSessionService";

@controller("/session")
export class SessionController implements interfaces.Controller {

    constructor(
        @inject(TYPES.SessionService) private readonly sessionSrv: SessionService,
        @inject(TYPES.DiscordSessionService) private readonly discordSessionSrv: DiscordSessionService,
    ) { }

    @httpGet('/invites', TYPES.AuthMiddleware)
    async getInvites(@request() req: Request) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        return this.sessionSrv.getInvites(user.sub);
    }

    @httpPost('/invite/accept/:sessionId', TYPES.AuthMiddleware)
    async acceptInvite(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'sessionId') sessionId: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            await this.sessionSrv.acceptInvite(sessionId, user.sub);
            return { sessionId };
        } catch (e) {
            if (e instanceof NoSessionFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e);
            res.status(500).send({
                message: 'Error accepting invite!',
            })
        }
    }

    @httpPost('/invite/decline/:sessionId', TYPES.AuthMiddleware)
    async declineInvite(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'sessionId') sessionId: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        try {
            await this.sessionSrv.declineInvite(sessionId, user.sub);
            return { sessionId };
        } catch (e) {
            if (e instanceof NoSessionFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                })
            }
            console.log(e);
            res.status(500).send({
                message: 'Error declining invite!',
            })
        }
    }

    @httpGet('/current', TYPES.AuthMiddleware)
    async getCurrentSession() { }

    @httpGet('/', TYPES.AuthMiddleware)
    async getSessions(
        @request() req: Request,
        @params(PARAMETER_TYPE.QUERY) query: any,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        const { offset = 0, q } = query;
        if (q) return this.sessionSrv.searchSessions(user.sub, q, parseInt(offset));
        return this.sessionSrv.getSessions(user.sub, parseInt(offset));
    }

    @httpPost('/', TYPES.AuthMiddleware)
    async createSession(
        @requestBody() body: any,
        @request() req: Request,
        @response() res: Response,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser;
        const uids: string[] = body.uids;
        const name = body.name;
        if (!uids || !uids.length)
            res.status(400).send({
                message: 'No uids provided!',
            })
        try {
            const session = await this.sessionSrv.create(user.sub, uids, name);
            await Promise.all(
                uids.map((uid) =>
                    this.sessionSrv.sendInvite(session.id, uid, user.sub),
                ),
            );
            await Promise.all(
                uids.map((uid) =>
                    this.discordSessionSrv.sendInvite(session.id, uid, user.sub),
                ),
            );
            return session;
        } catch (e) {
            console.log(e);
            res.status(500).send({
                message: 'Error creating session!',
            })
        }
    }

    @httpGet('/:sessionId', TYPES.AuthMiddleware)
    async getSession(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'sessionId') sessionId: string,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser;
        try {
            return await this.sessionSrv.getSession(sessionId, user.sub);
        } catch (e) {
            if (e instanceof NoSessionFoundError) {
                res.status(404).send({
                    message: e.message,
                    name: e.name,
                });
            }
            console.log(e);
            res.status(500).send({
                message: 'Error getting session!',
            });
        }
    }


}