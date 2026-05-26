/** 本地日历日期 YYYY-MM-DD（避免 toISOString 的 UTC 偏移） */
export function localDateString(date = new Date()) {
  const d = toValidDate(date);
  if (!d) {
    const now = new Date();
    return formatYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  return formatYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function formatYmd(y, m, day) {
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toValidDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const s = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    const d = new Date(`${s}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** 列表展示用，安全格式化日期，避免对 Date 调用 split */
export function formatDisplayDate(value) {
  if (value == null || value === '') return '-';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '-' : localDateString(value);
  }
  if (typeof value === 'string') {
    const s = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    return s || '-';
  }
  return '-';
}

/** 表单 time 输入用 HH:mm */
export function formatTimeValue(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toTimeString().slice(0, 5);
  }
  if (typeof value === 'string') return value.slice(0, 5);
  return '';
}

/** 规范化 API 行数据中的日期/时间字段 */
export function normalizeRecordRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  if ('record_date' in out && out.record_date != null) {
    out.record_date = formatDisplayDate(out.record_date);
  }
  if ('start_date' in out && out.start_date != null) {
    out.start_date = formatDisplayDate(out.start_date);
  }
  if ('end_date' in out && out.end_date != null && out.end_date !== '') {
    out.end_date = formatDisplayDate(out.end_date);
  }
  if ('sleep_time' in out) out.sleep_time = formatTimeValue(out.sleep_time);
  if ('wake_time' in out) out.wake_time = formatTimeValue(out.wake_time);
  if ('meal_time' in out) out.meal_time = formatTimeValue(out.meal_time);
  return out;
}

/** 编辑表单回填，保证 date/time 控件可绑定 */
export function normalizeRecordForForm(record) {
  const out = normalizeRecordRow({ ...record });
  if (out.record_date === '-') out.record_date = localDateString();
  if (out.start_date === '-') out.start_date = localDateString();
  if (out.end_date === '-') out.end_date = '';
  return out;
}
