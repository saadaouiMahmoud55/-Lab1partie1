// src/services/auth.ts
import { ID, type Models } from 'react-native-appwrite';

import { account } from '../lib/appwrite';

export type User = Models.User<Models.DefaultPreferences>;

/** Returns the logged-in user, or null when there is no valid session. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  console.log('1. signIn: deleteSession');
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch (e) {
    console.log('1b. no active session (ok)', e);
  }

  console.log('2. createEmailPasswordSession');
  await account.createEmailPasswordSession({ email, password });

  console.log('3. account.get');
  const user = await account.get();
  console.log('4. done', user.$id);
  return user;
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  console.log('0. signUp: account.create');
  await account.create({ userId: ID.unique(), email, password, name });
  console.log('0b. account created');
  return signIn(email, password);
}

export async function signOut(): Promise<void> {
  await account.deleteSession({ sessionId: 'current' });
}