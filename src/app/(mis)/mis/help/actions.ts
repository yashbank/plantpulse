'use server';

import { askHelp } from '@/server/mis/help';
import type { HelpAskResult } from '@/lib/mis/help/types';

/** Thin wrapper for the Ask Me Anything box. All checks live in askHelp. */
export async function askHelpAction(question: string): Promise<HelpAskResult> {
  return askHelp(question);
}
