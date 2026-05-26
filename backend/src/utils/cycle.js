const pool = require('./recordDb');
const { toDateOnlyString } = require('./recordDates');

function assignError(message, code = 'INVALID_CYCLE', status = 400) {
  return Object.assign(new Error(message), { code, status });
}

function cycleRange(startDate, endDate) {
  const start = toDateOnlyString(startDate);
  if (!start) return null;
  const end = toDateOnlyString(endDate) || start;
  return { start, end };
}

function rangesOverlap(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

function assertCycleDateOrder(startDate, endDate) {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);
  if (!start) throw assignError('请填写开始日期');
  if (!end) throw assignError('请填写结束日期');
  if (start > end) throw assignError('开始日期不能晚于结束日期');
  return { start, end };
}

async function assertNoOverlappingCycle(userId, startDate, endDate, excludeId = null) {
  const newRange = cycleRange(startDate, endDate);
  if (!newRange) return;

  const [rows] = await pool.query(
    'SELECT id, start_date, end_date FROM cycle_records WHERE user_id = ?',
    [userId]
  );

  for (const row of rows) {
    if (excludeId != null && String(row.id) === String(excludeId)) continue;
    const existing = cycleRange(row.start_date, row.end_date);
    if (!existing) continue;
    if (rangesOverlap(newRange, existing)) {
      throw assignError(
        '与已有生理周期记录在时间上重叠，请勿重复添加',
        'OVERLAPPING_CYCLE',
        409
      );
    }
  }
}

async function prepareCycleRecord(userId, body, excludeId = null) {
  const { start, end } = assertCycleDateOrder(body.start_date, body.end_date);
  await assertNoOverlappingCycle(userId, start, end, excludeId);

  let cycle_length = body.cycle_length;
  if (cycle_length != null && cycle_length !== '') {
    cycle_length = parseInt(cycle_length, 10);
    if (Number.isNaN(cycle_length) || cycle_length < 1) {
      throw assignError('周期长度应为正整数');
    }
  } else {
    cycle_length = null;
  }

  const notes = body.notes != null && String(body.notes).trim() !== '' ? String(body.notes).trim() : null;

  return {
    start_date: start,
    end_date: end,
    cycle_length,
    notes,
  };
}

module.exports = {
  assertCycleDateOrder,
  prepareCycleRecord,
};
