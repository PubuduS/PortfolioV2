import { environment } from '@portfolio-v2/environment/emulator';
import {
  assertEmulatorTarget,
  emulatorTarget,
} from '@portfolio-v2/tools/db/guards';
import { resetBaseline } from '@portfolio-v2/tools/db/reset';

/**
 * Aborts the run when the app or emulators point at anything other than the demo target.
 */
export default async function globalSetup(): Promise<void> {
  assertEmulatorTarget(emulatorTarget());
  if (!environment.firebase.projectId.startsWith('demo-')) {
    throw new Error(`refusing e2e run against ${environment.firebase.projectId}`);
  }
  await resetBaseline();
}
