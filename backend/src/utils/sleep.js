const pool = require('./recordDb');
const { toDateOnlyString } = require('./recordDates');

function assignError(message, code = 'INVALID_SLEEP', status = 400) {
  return Object.assign(new Error(message), { code, status });
}

/** 规范为 HH:mm:ss */
function normalizeTime(value) {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  const parts = str.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function parseTimeToMinutes(value) {
  const t = normalizeTime(value);
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 根据入睡/起床时间计算睡眠时长（小时）。
 * 支持跨天：入睡晚于起床时刻表盘读数时按次日起床计算。
 */
function calcSleepDurationHours(sleepTime, wakeTime) {
  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);

  if (sleepMin == null || wakeMin == null) {
    throw assignError('请填写有效的入睡时间和起床时间');
  }

  if (sleepMin === wakeMin) {
    throw assignError('入睡时间与起床时间相同，请修改后再保存');
  }

  let durationMinutes;
  if (wakeMin > sleepMin) {
    // 同一天内起床晚于入睡
    durationMinutes = wakeMin - sleepMin;
  } else {
    // 跨天睡眠（入睡时刻晚于起床时刻的表盘读数）
    durationMinutes = 24 * 60 - sleepMin + wakeMin;
  }

  const hours = Math.round((durationMinutes / 60) * 10) / 10;
  if (hours <= 0 || hours > 24) {
    throw assignError('睡眠时长不合理（应在 0 至 24 小时之间），请检查入睡与起床时间');
  }

  return hours;
}

/**
 * 入睡/起床先后顺序校验。
 * - 同日（起床晚于入睡）：合法。
 * - 跨夜（入睡表盘读数晚于起床，且间隔≥12小时）：合法，如 23:00—07:00。
 * - 表盘读数入睡仅略晚于起床（间隔<12小时）：视为同日误填，入睡不能晚于起床。
 */
function assertSleepWakeOrder(sleepTime, wakeTime) {
  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);
  if (sleepMin == null || wakeMin == null) {
    throw assignError('请填写有效的入睡时间和起床时间');
  }
  if (sleepMin === wakeMin) {
    throw assignError('入睡时间与起床时间相同，请修改后再保存');
  }
  if (wakeMin > sleepMin) {
    return;
  }
  if (sleepMin - wakeMin < 12 * 60) {
    throw assignError('入睡时间不能晚于起床时间');
  }
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateOnlyString(new Date(y, m - 1, d + days));
}

/** 将睡眠记录转为本地时间区间 [start, end) */
function sleepIntervalBounds(recordDate, sleepTime, wakeTime) {
  const dateStr = toDateOnlyString(recordDate);
  if (!dateStr) {
    throw assignError('请填写有效的记录日期');
  }
  const sleepMin = parseTimeToMinutes(sleepTime);
  const wakeMin = parseTimeToMinutes(wakeTime);
  const sleepHm = normalizeTime(sleepTime).slice(0, 5);
  const wakeHm = normalizeTime(wakeTime).slice(0, 5);

  const start = new Date(`${dateStr}T${sleepHm}:00`);
  let end;
  if (wakeMin > sleepMin) {
    end = new Date(`${dateStr}T${wakeHm}:00`);
  } else {
    end = new Date(`${addDays(dateStr, 1)}T${wakeHm}:00`);
  }
  return { start, end };
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

async function assertNoOverlappingSleep(userId, recordDate, sleepTime, wakeTime, excludeId = null) {
  const dateStr = toDateOnlyString(recordDate);
  const { start: newStart, end: newEnd } = sleepIntervalBounds(recordDate, sleepTime, wakeTime);

  const [rows] = await pool.query(
    `SELECT id, record_date, sleep_time, wake_time FROM sleep_records WHERE user_id = ?`,
    [userId]
  );

  for (const row of rows) {
    if (excludeId != null && String(row.id) === String(excludeId)) continue;
    if (!row.sleep_time || !row.wake_time) continue;
    try {
      const { start, end } = sleepIntervalBounds(row.record_date, row.sleep_time, row.wake_time);
      if (intervalsOverlap(newStart, newEnd, start, end)) {
        throw assignError(
          '与已有睡眠记录在时间上重叠，请勿重复添加',
          'OVERLAPPING_SLEEP',
          409
        );
      }
    } catch (err) {
      if (err.code === 'OVERLAPPING_SLEEP') throw err;
      // 跳过无法解析的历史脏数据，避免影响新记录校验
    }
  }
}

/**
 * 校验并规范化睡眠记录写入数据
 */
async function prepareSleepRecord(userId, body, excludeId = null) {
  const recordDate = body.record_date;
  const sleepTime = body.sleep_time;
  const wakeTime = body.wake_time;
  const quality = body.quality;

  if (!recordDate) throw assignError('请填写记录日期');
  if (!sleepTime) throw assignError('请填写入睡时间');
  if (!wakeTime) throw assignError('请填写起床时间');
  if (!quality || !['good', 'fair', 'poor'].includes(quality)) {
    throw assignError('请选择有效的睡眠质量');
  }

  assertSleepWakeOrder(sleepTime, wakeTime);
  const duration_h = calcSleepDurationHours(sleepTime, wakeTime);

  await assertNoOverlappingSleep(userId, recordDate, sleepTime, wakeTime, excludeId);

  return {
    record_date: toDateOnlyString(recordDate),
    sleep_time: normalizeTime(sleepTime),
    wake_time: normalizeTime(wakeTime),
    duration_h,
    quality,
  };
}

module.exports = {
  normalizeTime,
  calcSleepDurationHours,
  assertSleepWakeOrder,
  prepareSleepRecord,
};
