import { Module } from '@nestjs/common';
import { OidcStrategy } from './oidc-strategy';

@Module({
    providers: [OidcStrategy]
})
export class AuthModule {}
