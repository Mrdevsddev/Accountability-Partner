// D:/Accountiblity partner/shared/types.ts

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface User {
  email: string;
  createdAt: FirestoreTimestamp;
  checkinTimeLocal: string; // "HH:mm" format
  timezone: string;
}

export interface Task {
  title: string;
  plannedForDate: string; // "YYYY-MM-DD" format
  status: "pending" | "done" | "missed";
  createdAt: FirestoreTimestamp;
  completedAt: FirestoreTimestamp | null;
}

export interface Checkin {
  reviewedYesterday: boolean;
  plannedTomorrow: boolean;
  snoozesUsed: number;
  unlockedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
}

export interface Settings {
  blockEnabled: boolean;
  checkinTimeLocal: string; // "HH:mm" format
  maxSnoozes: number; // default 2
  snoozeDurationMinutes: number; // default 5
}
