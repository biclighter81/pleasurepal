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
