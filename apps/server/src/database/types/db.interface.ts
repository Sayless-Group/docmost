import {
  // ApiKeys, // DISABLED: API keys feature removed
  Attachments,
  // AuthAccounts, // DISABLED: Security & SSO feature removed
  // AuthProviders, // DISABLED: Security & SSO feature removed
  Backlinks,
  Billing,
  Comments,
  FileTasks,
  Groups,
  GroupUsers,
  PageHistory,
  Pages,
  // Shares, // DISABLED: Public sharing feature removed
  SpaceMembers,
  Spaces,
  UserMfa,
  Users,
  UserTokens,
  WorkspaceInvitations,
  Workspaces,
} from '@docmost/db/types/db';
import { PageEmbeddings } from '@docmost/db/types/embeddings.types';

export interface DbInterface {
  attachments: Attachments;
  // authAccounts: AuthAccounts; // DISABLED: Security & SSO feature removed
  // authProviders: AuthProviders; // DISABLED: Security & SSO feature removed
  backlinks: Backlinks;
  billing: Billing;
  comments: Comments;
  fileTasks: FileTasks;
  groups: Groups;
  groupUsers: GroupUsers;
  pageEmbeddings: PageEmbeddings;
  pageHistory: PageHistory;
  pages: Pages;
  // shares: Shares; // DISABLED: Public sharing feature removed
  spaceMembers: SpaceMembers;
  spaces: Spaces;
  userMfa: UserMfa;
  users: Users;
  userTokens: UserTokens;
  workspaceInvitations: WorkspaceInvitations;
  workspaces: Workspaces;
  // apiKeys: ApiKeys; // DISABLED: API keys feature removed
}
