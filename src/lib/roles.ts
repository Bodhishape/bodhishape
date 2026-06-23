export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
  LEADER = "leader",
  DISTRICT_LEADER = "district_leader",
  REGIONAL_LEADER = "regional_leader",
  COMMUNITY_ADMIN = "community_admin",
  DEVELOPER = "developer",
}

export interface UserWithRoles {
  roles?: string[];
  [key: string]: any;
}

/**
 * Checks if a user has any of the specified roles.
 * @param user The user object which should contain a `roles` array.
 * @param roleOrRoles A single role string or an array of roles.
 * @returns true if the user has at least one of the roles.
 */
export function hasRole(user: UserWithRoles | null | undefined, roleOrRoles: string | string[]): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  const acceptedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return user.roles.some((r) => acceptedRoles.includes(r));
}
