import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { AuraReport, DailyAuraRecord } from "../types";

const HISTORY_KEY = "aura:daily:history";
const REMINDER_KEY = "aura:daily:reminder-enabled";
const REMINDER_ID = "aura-daily-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function getTodayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDailyRecord(report: AuraReport, date: string): DailyAuraRecord {
  return {
    ...report,
    is_daily: true,
    date,
  };
}

async function readHistory(): Promise<DailyAuraRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is DailyAuraRecord =>
        typeof entry === "object" &&
        entry !== null &&
        (entry as DailyAuraRecord).is_daily === true &&
        typeof (entry as DailyAuraRecord).date === "string" &&
        typeof (entry as DailyAuraRecord).subject === "string",
    );
  } catch (error) {
    console.warn("Failed to read daily aura history:", error);
    return [];
  }
}

async function writeHistory(history: DailyAuraRecord[]): Promise<void> {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(sorted));
}

export async function getDailyHistory(): Promise<DailyAuraRecord[]> {
  return readHistory();
}

export async function hasScannedToday(): Promise<boolean> {
  const today = getTodayKey();
  const history = await readHistory();
  return history.some((entry) => entry.date === today);
}

export async function getTodaysDailyAura(): Promise<DailyAuraRecord | null> {
  const today = getTodayKey();
  const history = await readHistory();
  return history.find((entry) => entry.date === today) ?? null;
}

export async function getDailyAuraForDate(
  date: string,
): Promise<DailyAuraRecord | null> {
  const history = await readHistory();
  return history.find((entry) => entry.date === date) ?? null;
}

export async function saveDailyReport(
  report: AuraReport,
  date = getTodayKey(),
): Promise<DailyAuraRecord> {
  const record = toDailyRecord(report, date);
  const history = await readHistory();
  const withoutDate = history.filter((entry) => entry.date !== date);
  await writeHistory([record, ...withoutDate]);
  return record;
}

export function computeStreak(history: DailyAuraRecord[]): number {
  const dates = new Set(history.map((entry) => entry.date));
  const today = getTodayKey();
  const cursor = new Date();

  if (!dates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (dates.has(getTodayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function isDailyReminderEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(REMINDER_KEY);
  return value === "true";
}

export async function scheduleDailyReminder(
  hour = 9,
  minute = 0,
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return false;
  }

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(
    () => undefined,
  );

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Daily aura check-in",
      body: "Your aura has not been scanned today. One reading. No rerolls.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(REMINDER_KEY, "true");
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(
    () => undefined,
  );
  await AsyncStorage.setItem(REMINDER_KEY, "false");
}
