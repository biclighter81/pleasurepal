export interface Attributes {
  discord_username: string[];
  discord_refresh_token: string[];
  discord_uid: string[];
}

export interface Access {
  manageGroupMembership: boolean;
  view: boolean;
  mapRoles: boolean;
  impersonate: boolean;
  manage: boolean;
}

export interface KeycloakUser {
  id: string;
  createdTimestamp: number;
  username: string;
  enabled: boolean;
  totp: boolean;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  email: string;
  attributes: Attributes;
  disableableCredentialTypes: any[];
  requiredActions: any[];
  notBefore: number;
  access: Access;
}

export interface FriendlyKeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  discordUsername: string;
  discordUid: string;
}

export interface JWTKeycloakUser {
  exp: number
  iat: number
  auth_time: number
  jti: string
  iss: string
  aud: string
  sub: string
  typ: string
  azp: string
  session_state: string
  acr: string
  realm_access: RealmAccess
  resource_access: ResourceAccess
  scope: string
  sid: string
  email_verified: boolean
  name: string
  discord_username: string
  preferred_username: string
  discord_refresh_token: string
  discord_uid: string
  given_name: string
  family_name: string
  email: string
}

interface RealmAccess {
  roles: string[]
}

interface ResourceAccess {
  account: Account
}

interface Account {
  roles: string[]
}
