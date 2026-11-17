import { AskScreen } from '@/components/mis/help/ask-screen';
import { HELP_TOPICS } from '@/lib/mis/help/help-content';
import { suggestedTopics } from '@/lib/mis/help/suggestions';
import { requireMisAccess } from '@/server/mis/guard';
import { getMisRole } from '@/server/mis/roles';

/** Ask Me Anything: open to every signed-in MIS role; the answer itself is role-aware. */
export default async function MisHelpPage() {
  const user = await requireMisAccess();
  const role = await getMisRole(user.id);
  return <AskScreen role={role} suggestions={suggestedTopics(role, 6, HELP_TOPICS)} />;
}
