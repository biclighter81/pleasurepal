import { inject } from "inversify";
import { controller, httpPost, interfaces, request, requestBody } from "inversify-express-utils";
import TYPES from "@/lib/symbols";
import { DeviceService } from "../services/DeviceService";
import { Request } from "express";
import { JWTKeycloakUser } from "@/lib/interfaces/keycloak";

@controller("/device")
export class DeviceController implements interfaces.Controller {

    constructor(
        @inject(TYPES.DeviceService) private readonly deviceService: DeviceService,
    ) { }

    @httpPost('/self-command', TYPES.AuthMiddleware)
    async selfCommand(
        @request() req: Request,
        @requestBody() body: any,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        return await this.deviceService.selfCommand(user.sub, body);
    }

    @httpPost('/self-random', TYPES.AuthMiddleware)
    async selfRandom(
        @request() req: Request,
        @requestBody() body: any,
    ) {
        const user = req.auth.payload as unknown as JWTKeycloakUser
        let _running: boolean = false;
        const sessionDuration = body.duration || 100;
        const interval = setInterval(async () => {
            if (_running) return;
            _running = true;
            const duration = Math.floor(Math.random() * 5);
            const intensity = parseFloat(Math.random().toFixed(2));
            console.log('duration', duration, 'intensity', intensity);
            await this.deviceService.selfCommand(user.sub, { duration, intensity });
            await new Promise((resolve) => setTimeout(resolve, duration * 1000));
            _running = false;
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
        }, sessionDuration * 1000);
    }

}