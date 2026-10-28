import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { test } from '@playwright/test';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getBytes,
  ref,
  uploadString,
} from 'firebase/storage';

import {
  EMULATOR_BUCKET,
  EMULATOR_PORTS,
  EMULATOR_TARGET,
} from '@portfolio-v2/tools/db/constants';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const PROBE_PATH = 'e2e-rules-probe/doc';
const STORAGE_PROBE = 'e2e-rules-probe/file.txt';

test.describe('emulator security rules', () => {
  let testEnv: RulesTestEnvironment;

  test.beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: EMULATOR_TARGET.projectId,
      firestore: {
        host: EMULATOR_TARGET.hosts.firestore,
        port: EMULATOR_PORTS.firestore,
        rules: readFileSync(path.join(REPO_ROOT, 'firestore.rules'), 'utf8'),
      },
      storage: {
        host: EMULATOR_TARGET.hosts.storage,
        port: EMULATOR_PORTS.storage,
        rules: readFileSync(path.join(REPO_ROOT, 'storage.rules'), 'utf8'),
      },
    });
  });

  test.afterAll(async () => {
    await testEnv.cleanup();
  });

  test('should allow anonymous reads and deny anonymous writes', async () => {
    const firestore = testEnv.unauthenticatedContext().firestore();
    const storage = testEnv.unauthenticatedContext().storage(EMULATOR_BUCKET);
    await assertSucceeds(getDoc(doc(firestore, 'skills-section/latest')));
    await assertSucceeds(getBytes(ref(storage, 'portfolio/portfolio-tiles/ID-01-Icon.webp')));
    await assertFails(setDoc(doc(firestore, PROBE_PATH), { id: 1 }));
    await assertFails(updateDoc(doc(firestore, 'skills-section/latest'), { intro: 'nope' }));
    await assertFails(deleteDoc(doc(firestore, 'skills-section/latest')));
    await assertFails(uploadString(ref(storage, STORAGE_PROBE), 'nope'));
    await assertFails(deleteObject(ref(storage, 'portfolio/portfolio-tiles/ID-01-Icon.webp')));
  });

  test('should allow only signed-in writes to certificate documents', async () => {
    const certificatePath = 'certification-section/certification-99';
    const certificate = {
      id: 99,
      title: 'Rules probe',
      completedDate: 'In progress',
      organization: 'Probe',
      credentialID: 'None',
      certification: 'In Progress',
      certificateURL: '',
      description: 'Rules probe',
    };
    const anonymous = testEnv.unauthenticatedContext().firestore();
    const admin = testEnv.authenticatedContext('e2e-admin').firestore();

    await assertSucceeds(getDoc(doc(anonymous, 'certification-section/certification-01')));
    await assertFails(setDoc(doc(anonymous, certificatePath), certificate));
    await assertSucceeds(setDoc(doc(admin, certificatePath), certificate));
    await assertFails(deleteDoc(doc(anonymous, certificatePath)));
    await assertSucceeds(deleteDoc(doc(admin, certificatePath)));
  });

  test('should allow only signed-in writes to education documents', async () => {
    const educationPath = 'education-section/institute-99';
    const education = {
      id: 99,
      title: 'Rules probe',
      period: '2000 - 2001',
      degree: 'Probe',
      gpa: '4.0',
      awards: 'Probe',
      credits: '1/1',
      graduated: 'Never',
      extra: '',
    };
    const anonymous = testEnv.unauthenticatedContext().firestore();
    const admin = testEnv.authenticatedContext('e2e-admin').firestore();

    await assertSucceeds(getDoc(doc(anonymous, 'education-section/institute-01')));
    await assertFails(setDoc(doc(anonymous, educationPath), education));
    await assertSucceeds(setDoc(doc(admin, educationPath), education));
    await assertFails(deleteDoc(doc(anonymous, educationPath)));
    await assertSucceeds(deleteDoc(doc(admin, educationPath)));
  });

  test('should allow authenticated writes', async () => {
    const firestore = testEnv.authenticatedContext('e2e-admin').firestore();
    const storage = testEnv.authenticatedContext('e2e-admin').storage(EMULATOR_BUCKET);
    await assertSucceeds(setDoc(doc(firestore, PROBE_PATH), { id: 1 }));
    await assertSucceeds(updateDoc(doc(firestore, PROBE_PATH), { id: 2 }));
    await assertSucceeds(uploadString(ref(storage, STORAGE_PROBE), 'ok'));
    await assertSucceeds(deleteDoc(doc(firestore, PROBE_PATH)));
    await assertSucceeds(deleteObject(ref(storage, STORAGE_PROBE)));
  });
});
