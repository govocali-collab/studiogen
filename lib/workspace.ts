import { createAdminClient } from './supabase/admin';

export interface WorkspaceContext {
  workspaceId: string;  // owner's user_id — use for all content queries
  userId: string;       // the authenticated user's own id
  role: 'owner' | 'collaborator';
  isOwner: boolean;
}

export async function getWorkspaceContext(userId: string): Promise<WorkspaceContext> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('workspace_id, role')
    .eq('id', userId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any;
  const workspaceId: string = p?.workspace_id ?? userId;
  const role = (p?.role ?? 'owner') as 'owner' | 'collaborator';

  return { workspaceId, userId, role, isOwner: role === 'owner' };
}
