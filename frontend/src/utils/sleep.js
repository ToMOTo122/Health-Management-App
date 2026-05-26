import { toDateOnlyString, localDateString } from './date';

/** 规范为 HH:mm */
export function normalizeTimeInput(value) {
  if (value == null || value === '') return '';
  const str = String(value).trim();
  const parts = str.split(':');
  if (parts.length < 2) return str;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return str;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTimeToMinutes(value) {
  const t = normalizeTimeInput(value);
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function calcSleepDurationHours(sleepTime, wakeTime) {
  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);

  if (sleepMin == null || wakeMin == null) {
    return { error: '请填写有效的入睡时间和起床时间' };
  }

  if (sleepMin === wakeMin) {
    return { error: '入睡时间与起床时间相同，请修改后再保存' };
  }

  let durationMinutes;
  if (wakeMin > sleepMin) {
    durationMinutes = wakeMin - sleepMin;
  } else {
    durationMinutes = 24 * 60 - sleepMin + wakeMin;
  }

  const hours = Math.round((durationMinutes / 60) * 10) / 10;
  if (hours <= 0 || hours > 24) {
    return { error: '睡眠时长不合理（应在 0 至 24 小时之间），请检查入睡与起床时间' };
  }

  return { duration_h: hours };
}

export function assertSleepWakeOrder(sleepTime, wakeTime) {
  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);

  if (sleepMin == null || wakeMin == null) {
    return '请填写有效的入睡时间和起床时间';
  }
  if (sleepMin === wakeMin) {
    return '入睡时间与起床时间相同，请修改后再保存';
  }
  if (wakeMin > sleepMin) return null;
  if (sleepMin - wakeMin < 12 * 60) {
    return '入睡时间不能晚于起床时间';
  }
  return null;
}

export const OVERLAPPING_SLEEP_MSG = '与已有睡眠记录在时间上重叠，请勿重复添加';

export { toDateOnlyString };

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDateString(new Date(y, m - 1, d + days));
}

export function sleepIntervalBounds(recordDate, sleepTime, wakeTime) {
  const dateStr = toDateOnlyString(recordDate);
  if (!dateStr) return null;

  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);
  if (sleepMin == null || wakeMin == null) return null;

  const sleepHm = normalizeTimeInput(sleepTime);
  const wakeHm = normalizeTimeInput(wakeTime);

  const start = new Date(`${dateStr}T${sleepHm}:00`);
  let end;
  if (wakeMin > sleepMin) {
    end = new Date(`${dateStr}T${wakeHm}:00`);
  } else {
    end = new Date(`${addDays(dateStr, 1)}T${wakeHm}:00`);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/** 在当前列表中检测时间区间重叠（保存前即时提示） */
export function hasOverlappingSleep(records, payload, excludeId = null) {
  const dateStr = toDateOnlyString(payload.record_date);
  if (!dateStr) return false;

  const prev = addDays(dateStr, -1);
  const next = addDays(dateStr, 1);
  const newBounds = sleepIntervalBounds(payload.record_date, payload.sleep_time, payload.wake_time);
  if (!newBounds) return false;

  const { start: newStart, end: newEnd } = newBounds;

  return records.some((r) => {
    if (excludeId != null && String(r.id) === String(excludeId)) return false;
    if (!r.sleep_time || !r.wake_time) return false;
    const rd = toDateOnlyString(r.record_date);
    if (rd !== dateStr && rd !== prev && rd !== next) return false;
    const bounds = sleepIntervalBounds(r.record_date, r.sleep_time, r.wake_time);
    if (!bounds) return false;
    return intervalsOverlap(newStart, newEnd, bounds.start, bounds.end);
  });
}

/** 构建提交 payload（含自动计算的 duration_h） */
export function buildSleepPayload(form) {
  const orderErr = assertSleepWakeOrder(form.sleep_time, form.wake_time);
  if (orderErr) return { error: orderErr };

  const duration = calcSleepDurationHours(form.sleep_time, form.wake_time);
  if (duration.error) return { error: duration.error };

  return {
    payload: {
      record_date: toDateOnlyString(form.record_date),
      sleep_time: normalizeTimeInput(form.sleep_time),
      wake_time: normalizeTimeInput(form.wake_time),
      duration_h: duration.duration_h,
      quality: form.quality,
    },
  };
}
