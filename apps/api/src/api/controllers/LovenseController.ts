import { inject } from "inversify";
import { PARAMETER_TYPE, controller, httpPost, interfaces, params, request, requestBody, response } from "inversify-express-utils";
import TYPES from "@/lib/symbols";
import { LovenseService } from "../services/LovenseService";
import { DiscordService } from "../services/DiscordService";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import { Request, Response } from "express";

@controller("/lovense")
export class LovenseController implements interfaces.Controller {

    constructor(
        @inject(TYPES.LovenseService) private readonly lovenseSrv: LovenseService,
        @inject(TYPES.DiscordService) private readonly discordSrv: DiscordService,
    ) { }

    @httpPost('/callback')
    async callback(@requestBody() body: /*LovenseCallback*/any) {
        return this.lovenseSrv.callback(body);
    }

    @httpPost('/qr/discord/:uid', TYPES.AuthMiddleware)
    async sendLovenseQr(
        @request() req: Request,
        @response() res: Response,
        @params(PARAMETER_TYPE.PARAMS, 'uid') uid: string
    ) {
        const kcUser = await getKCUserByDiscordId(uid);
        if (!kcUser) {
            res.status(404).send({
                message: 'Discord user is not linked to pleasurepal!',
            })
        }
        const qr = await this.lovenseSrv.getLinkQrCode(kcUser.id, kcUser.username);
        return this.discordSrv.sendLovenseQRCode(uid, qr);
    }

}