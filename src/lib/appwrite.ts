// src/lib/appwrite.ts
import { Platform } from 'react-native';
import { Account, Client, TablesDB } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Variable manquante : ${name}. Vérifie ton fichier .env et relance Expo.`);
  }
  return value;
}

export const config = {
  endpoint: required(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT, 'EXPO_PUBLIC_APPWRITE_ENDPOINT'),
  projectId: required(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID, 'EXPO_PUBLIC_APPWRITE_PROJECT_ID'),
  platform: required(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM, 'EXPO_PUBLIC_APPWRITE_PLATFORM'),
  databaseId: required(process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID, 'EXPO_PUBLIC_APPWRITE_DATABASE_ID'),
  tableId: required(process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID, 'EXPO_PUBLIC_APPWRITE_TABLE_ID'),
};

export const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId);

// setPlatform lel Android/iOS bark. 3al web el browser yb3ath el origin (localhost) wa7do.
if (Platform.OS !== 'web') {
  client.setPlatform(config.platform);
}

export const tablesDB = new TablesDB(client);
export const account = new Account(client);