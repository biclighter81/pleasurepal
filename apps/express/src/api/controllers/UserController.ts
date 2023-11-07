import { Request, Response } from "express";
import { PARAMETER_TYPE, controller, httpGet, interfaces, params, request, response } from "inversify-express-utils";
import TYPES from "../../lib/symbols";
import { searchKCUser } from "../../lib/keycloak";

@controller("/user")
export class UserController implements interfaces.Controller {
    @httpGet('/search', TYPES.AuthMiddleware)
    async search(
        @params(PARAMETER_TYPE.QUERY, 'q') q: string,
        @request() req: Request,
        @response() res: Response
    ) {
        if (!q) res.status(400).send({
            message: 'Missing query parameter!',
        })
        try {
            return await searchKCUser(q);
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: 'Error while search for users!',
            })
        }
    }

    @httpGet('/me', TYPES.AuthMiddleware)
    async me() {
        throw new Error('test');
    }
}