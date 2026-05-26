/** 健康记录 API：DATE 字段序列化为本地日历 YYYY-MM-DD 字符串 */

function formatYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function toDateOnlyString(value) {
  if (value == null || value === '') return value;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return value;
    return formatYmd(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      return formatYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    return trimmed.slice(0, 10);
  }
  return value;
}

const DATE_FIELDS = ['record_date', 'start_date', 'end_date'];

function serializeRowDates(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const field of DATE_FIELDS) {
    if (field in out && out[field] != null && out[field] !== '') {
      out[field] = toDateOnlyString(out[field]);
    }
  }
  return out;
}

function serializeRows(rows) {
  return rows.map(serializeRowDates);
}

module.exports = { toDateOnlyString, serializeRowDates, serializeRows };
