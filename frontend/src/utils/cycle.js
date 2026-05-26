import { toDateOnlyString } from './date';

export const OVERLAPPING_CYCLE_MSG = '与已有生理周期记录在时间上重叠，请勿重复添加';

function cycleRange(startDate, endDate) {
  const start = toDateOnlyString(startDate);
  if (!start) return null;
  const end = toDateOnlyString(endDate) || start;
  return { start, end };
}

function rangesOverlap(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

export function assertCycleDateOrder(startDate, endDate) {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);
  if (!start) return '请填写开始日期';
  if (!end) return '请填写结束日期';
  if (start > end) return '开始日期不能晚于结束日期';
  return null;
}

export function hasOverlappingCycle(records, payload, excludeId = null) {
  const newRange = cycleRange(payload.start_date, payload.end_date);
  if (!newRange) return false;

  return records.some((r) => {
    if (excludeId != null && String(r.id) === String(excludeId)) return false;
    const existing = cycleRange(r.start_date, r.end_date);
    if (!existing) return false;
    return rangesOverlap(newRange, existing);
  });
}

export function buildCyclePayload(form) {
  const orderErr = assertCycleDateOrder(form.start_date, form.end_date);
  if (orderErr) return { error: orderErr };

  const payload = {
    start_date: toDateOnlyString(form.start_date),
    end_date: toDateOnlyString(form.end_date),
    cycle_length: form.cycle_length !== '' && form.cycle_length != null
      ? parseInt(form.cycle_length, 10)
      : null,
    notes: form.notes != null && String(form.notes).trim() !== '' ? String(form.notes).trim() : null,
  };

  if (payload.cycle_length != null && (Number.isNaN(payload.cycle_length) || payload.cycle_length < 1)) {
    return { error: '周期长度应为正整数' };
  }

  return { payload };
}
