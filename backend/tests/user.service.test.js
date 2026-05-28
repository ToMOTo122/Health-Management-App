const bcrypt = require('bcrypt');
const userService = require('../src/services/user.service');
const pool = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

describe('User Service - changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw error if user not found', async () => {
    pool.query.mockResolvedValueOnce([[]]); // 没有用户
    await expect(userService.changePassword(999, 'old', 'new')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT password FROM users WHERE id = ?',
      [999]
    );
  });

  test('should throw error if old password wrong', async () => {
    const hashed = await bcrypt.hash('correct', 10);
    pool.query.mockResolvedValueOnce([[{ password: hashed }]]);
    await expect(userService.changePassword(1, 'wrong', 'new')).rejects.toMatchObject({
      code: 'WRONG_PASSWORD',
    });
  });

  test('should update password if old password correct', async () => {
    const oldHashed = await bcrypt.hash('oldPass', 10);
    pool.query
      .mockResolvedValueOnce([[{ password: oldHashed }]]) // select
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // update

    await userService.changePassword(1, 'oldPass', 'newPass123');

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE users SET password = \? WHERE id = \?/);
    expect(updateCall[1][1]).toBe(1);
    const newHash = updateCall[1][0];
    expect(newHash).not.toBe('newPass123');
    const match = await bcrypt.compare('newPass123', newHash);
    expect(match).toBe(true);
  });
});

describe('User Service - updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update allowed fields only', async () => {
    const userId = 1;
    const updates = {
      nickname: 'newNick',
      gender: 'female',
      age: 25,
      height_cm: 165.5,
      weight_kg: 55,
      email: 'shouldNotUpdate@example.com',
    };
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update
      .mockResolvedValueOnce([[{ id: userId, nickname: 'newNick', email: 'old@example.com' }]]); // select after update

    const result = await userService.updateProfile(userId, updates);
    expect(result.nickname).toBe('newNick');
    expect(result.email).toBe('old@example.com');
    const updateCall = pool.query.mock.calls[0];
    expect(updateCall[0]).toMatch(/UPDATE users SET nickname = \?, gender = \?, age = \?, height_cm = \?, weight_kg = \? WHERE id = \?/);
    expect(updateCall[1]).toEqual(['newNick', 'female', 25, 165.5, 55, userId]);
  });

  test('should return current profile if no allowed fields provided', async () => {
    const userId = 1;
    const existingProfile = { id: userId, nickname: 'old', email: 'test@example.com' };
    pool.query.mockResolvedValueOnce([[existingProfile]]);
    const result = await userService.updateProfile(userId, {});
    expect(result).toEqual(existingProfile);
    expect(pool.query).toHaveBeenCalledTimes(1); // 只调用了 select
  });
});

describe('User Service - getGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return existing goals', async () => {
    const goalsRow = { user_id: 1, sleep_hours: 7, steps_daily: 8000 };
    pool.query.mockResolvedValueOnce([[goalsRow]]);
    const result = await userService.getGoals(1);
    expect(result).toEqual(goalsRow);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM health_goals WHERE user_id = ?', [1]);
  });

  test('should create default goals if not exist', async () => {
    // 第一次 SELECT 为空
    pool.query.mockResolvedValueOnce([[]]);
    // INSERT 成功
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // 第二次 SELECT 返回默认值
    const defaultGoals = {
      user_id: 1,
      sleep_hours: 8,
      steps_daily: 10000,
      water_ml: 2000,
      exercise_min: 30,
      calories_kcal: 2000,
    };
    pool.query.mockResolvedValueOnce([[defaultGoals]]);

    const result = await userService.getGoals(1);
    expect(result.sleep_hours).toBe(8);
    // 验证第二个调用（索引1）是 INSERT
    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[0]).toMatch(/INSERT INTO health_goals \(user_id\) VALUES \(\?\)/);
    expect(insertCall[1][0]).toBe(1);
  });
});

describe('User Service - updateGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update allowed goal fields', async () => {
    const userId = 1;
    const updates = { sleep_hours: 7.5, steps_daily: 12000, invalid_field: 999 };
    
    // 第一次调用 UPDATE
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // 第二次调用来自 getGoals 内部的 SELECT（返回更新后的值）
    const updatedGoals = {
      user_id: userId,
      sleep_hours: 7.5,
      steps_daily: 12000,
      water_ml: 2000,
      exercise_min: 30,
      calories_kcal: 2000,
    };
    pool.query.mockResolvedValueOnce([[updatedGoals]]);

    const result = await userService.updateGoals(userId, updates);
    expect(result.sleep_hours).toBe(7.5);
    expect(result.steps_daily).toBe(12000);
    
    // 验证 UPDATE 语句
    const updateCall = pool.query.mock.calls[0];
    expect(updateCall[0]).toMatch(/UPDATE health_goals SET sleep_hours = \?, steps_daily = \? WHERE user_id = \?/);
    expect(updateCall[1]).toEqual([7.5, 12000, userId]);
  });
});