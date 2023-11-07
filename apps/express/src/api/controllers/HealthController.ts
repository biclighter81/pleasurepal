import { controller, httpGet, interfaces } from 'inversify-express-utils';

@controller("/health")
export class TestController implements interfaces.Controller {
    //constructor(@inject(TYPES.ExampleInjectedService) private exampleSrv: ExampleInjectedService) {}


    @httpGet('')
    healthz() {
        return 'ok'
    }
}