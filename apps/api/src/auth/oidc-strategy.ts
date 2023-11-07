import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-openidconnect'
@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
    
    authorizationParams(): any  {
        /*return [{
            authorizationURL: 'https://keycloak.rimraf.de',
            callbackURL: 'https://localhost:3000',
            clientID: 'pleasurepal',
            clientSecret: 'zuPoEISCBkoTeM2Kncw3DFJxYMAyY0LT',
            issuer: 'pleasurepal',
            tokenURL: 'https://keycloak.rimraf.de',
            userInfoURL: 'https://keycloak.rimraf.de',
        }, () => {console.log('test')}]*/
    }

    
}