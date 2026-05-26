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

/**
 * 转为本地日历 YYYY-MM-DD。
 * 禁止对 ISO 字符串使用 split('T')[0]（会得到 UTC 日期，东八区会少一天）。
 */
export function toDateOnlyString(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : localDateString(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return localDateString(d);
    return trimmed.slice(0, 10);
  }
  return '';
}

function toValidDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** 列表展示用 */
export function formatDisplayDate(value) {
  const s = toDateOnlyString(value);
  return s || '-';
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
    out.record_date = toDateOnlyString(out.record_date);
  }
  if ('start_date' in out && out.start_date != null) {
    out.start_date = toDateOnlyString(out.start_date);
  }
  if ('end_date' in out && out.end_date != null && out.end_date !== '') {
    out.end_date = toDateOnlyString(out.end_date);
  }
  if ('sleep_time' in out) out.sleep_time = formatTimeValue(out.sleep_time);
  if ('wake_time' in out) out.wake_time = formatTimeValue(out.wake_time);
  if ('meal_time' in out) out.meal_time = formatTimeValue(out.meal_time);
  return out;
}

/** 编辑表单回填，保证 date/time 控件可绑定 */
export function normalizeRecordForForm(record) {
  const out = normalizeRecordRow({ ...record });
  if (!out.record_date) out.record_date = localDateString();
  if (!out.start_date) out.start_date = localDateString();
  if (out.end_date === '-') out.end_date = '';
  return out;
}
