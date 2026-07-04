import { format } from 'date-fns';
import { db } from '../db/database';
import { gatherMetrics } from '../hooks/useMetrics';

export interface CsvDay {
  date: string;
  actionsCompleted: number;
  /** 'Meditation ✓; Walk ✓' */
  habitsCompleted: string;
  timeline: string;
  /** rapid-log bodies joined with ' | ' */
  rapidLogNotes: string;
}

export function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function gatherCsvData(startDate: string, endDate: string): Promise<CsvDay[]> {
  const { days, habits } = await gatherMetrics(startDate, endDate);
  const habitsByUuid = new Map(habits.map((h) => [h.uuid, h.name]));

  const rapidLogs = await db.rapid_logs
    .filter((l) => l.deleted_at === null)
    .toArray();
  const logsByDate = new Map<string, string[]>();
  for (const log of rapidLogs.sort((a, b) => a.created_at - b.created_at)) {
    const date = format(log.created_at, 'yyyy-MM-dd');
    if (date < startDate || date > endDate) continue;
    const bodies = logsByDate.get(date) ?? [];
    bodies.push(log.body);
    logsByDate.set(date, bodies);
  }

  return days.map((day) => ({
    date: day.date,
    actionsCompleted: day.actionsCompleted,
    habitsCompleted: Object.entries(day.habitDone)
      .filter(([, done]) => done)
      .map(([uuid]) => `${habitsByUuid.get(uuid)} ✓`)
      .join('; '),
    timeline: day.timelineNote,
    rapidLogNotes: (logsByDate.get(day.date) ?? []).join(' | '),
  }));
}

export function buildCsv(days: CsvDay[]): string {
  const header = 'date,actions_completed,habits_completed,timeline,rapid_log_notes';
  const rows = days.map((d) =>
    [
      d.date,
      String(d.actionsCompleted),
      csvEscape(d.habitsCompleted),
      csvEscape(d.timeline),
      csvEscape(d.rapidLogNotes),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
