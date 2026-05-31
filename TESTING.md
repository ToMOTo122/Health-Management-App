# 测试文档

## 概览

| 层级 | 框架 | 目录 | 命令 |
|------|------|------|------|
| 后端 | Jest v29 + Supertest | `backend/tests/` | `cd backend && npm test` |
| 前端 | Vitest v4 + @vue/test-utils | `frontend/src/**/__tests__/` | `cd frontend && npm test` |

### 测试哲学

- **服务层优先**：后端 service 层承载全部业务逻辑，是测试投入的重点
- **隔离外部依赖**：db、redis、Ollama、DeepSeek 全部 mock，测试不连真实服务
- **组件只测逻辑**：前端组件测试聚焦表单校验、状态切换、条件渲染，不测样式
- **不追求覆盖率数字**：追求关键路径覆盖，不为了数字写无意义测试

---

## 目录结构与命名

```
backend/
├── tests/
│   ├── user.service.test.js       # 用户服务
│   ├── auth.service.test.js       # 认证服务
│   ├── chat.service.test.js       # 聊天服务
│   ├── record.service.test.js     # 记录 CURD
│   ├── analysis.service.test.js   # 分析统计
│   ├── reminder.service.test.js   # 提醒服务
│   └── api/                       # 集成测试（可选）
│       ├── auth.test.js           # POST /api/auth/register, login
│       └── users.test.js          # GET/PUT /api/users/*
│
frontend/src/
├── views/
│   ├── __tests__/
│   │   ├── LoginView.test.js
│   │   ├── DashboardView.test.js
│   │   ├── RecordView.test.js
│   │   ├── AnalysisView.test.js
│   │   ├── ChatView.test.js
│   │   └── ProfileView.test.js    # 已有
├── stores/
│   └── __tests__/
│       ├── auth.store.test.js
│       ├── records.store.test.js
│       ├── goals.store.test.js
│       └── chat.store.test.js
```

**规则：**
- 后端：`backend/tests/<module>.service.test.js`，一个文件对一个 service
- 前端：co-located `__tests__/` 目录，文件名与源文件对应
- mock 文件放在源文件旁的 `__mocks__/` 目录，Jest/Vitest 自动发现

---

## 后端测试

### 通用模式：Mock db + redis

每个后端测试文件开头固定 mock 数据库和 Redis：

```js
// 所有后端 service 测试的标准头部
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  zrem: jest.fn(),
  zadd: jest.fn(),
  zrangebyscore: jest.fn().mockResolvedValue([]),
}));
```

`beforeEach` 中调用 `jest.clearAllMocks()` 避免用例间状态泄漏。

### 各模块测试要点

#### 1. `user.service.test.js`（已有，需补充）

现有用例覆盖了 `changePassword`、`updateProfile`、`getGoals`、`updateGoals`。
需要补充：

- `getProfile` — 返回用户信息，排除 `deepseek_api_key` 字段
- `getProfile` — 用户不存在时抛出 `USER_NOT_FOUND`
- `getGoals` — 无目标时自动创建默认目标

#### 2. `auth.service.test.js`

- `register` — 正常注册返回 token + user
- `register` — 重复邮箱抛出 `EMAIL_EXISTS`
- `register` — 自动创建 health_goals
- `login` — 正常登录返回 token + user
- `login` — 邮箱不存在 / 密码错误均抛出 `INVALID_CREDENTIALS`
- `refresh` — 有效 refresh token 返回新 access token
- `refresh` — Redis 中无记录时抛出 `REFRESH_EXPIRED`
- `refresh` — token 本身无效时抛出 `INVALID_REFRESH`
- `logout` — 将 jti 加入黑名单，删除 refresh keys

Mock 要点：`bcrypt.hash`/`bcrypt.compare` 保持真实调用（验证密码逻辑），`jwt.sign` 可 mock 或真实调用。

#### 3. `chat.service.test.js`

- `listConversations` — 返回用户对话列表，按更新时间倒序
- `createConversation` — 创建对话，默认标题"新对话"
- `renameConversation` — 重命名成功
- `deleteConversation` — 删除对话并清除 Redis 缓存
- `deleteConversation` — 对话不存在抛出 `NOT_FOUND`
- `sendMessage` — 对话不存在抛出 `NOT_FOUND`
- `sendMessage` — 首条消息自动设置标题（标题为"新对话"时截取前 30 字）
- `sendMessage` — Ollama 正常响应
- `sendMessage` — Ollama 失败时 fallback 关键词匹配回复
- `sendMessage` — Ollama 失败且无关键词匹配时返回默认提示
- `sendMessage` — DeepSeek 模式缺少 API Key 时抛出 `DEEPSEEK_KEY_MISSING`
- `sendMessage` — DeepSeek API 调用失败时抛出 `DEEPSEEK_API_ERROR`
- `getHistory` — 返回历史消息，按时间正序

Mock 要点：
- `_callOllama` / `_callDeepSeek` 应 mock 掉（它们使用 `fetch`，在 Node 环境不存在）
- `redis.get` 返回 JSON 序列化的历史消息
- `_buildHealthContext` 可 mock 掉以简化测试

#### 4. `record.service.test.js`

由于 `makeRecordService` 是工厂函数，测试需要实例化具体表来测：

```js
const { makeRecordService } = require('../src/services/record.service');
const sleepService = makeRecordService('sleep_records');
const stepsService = makeRecordService('steps_records');
// 所有表的行为一致，选取 1-2 个代表性表测试即可
```

- `create` — 插入记录并返回完整行
- `query` — 按日期筛选
- `query` — 按日期范围筛选
- `query` — 分页（limit + offset）
- `getById` — 记录存在时返回
- `getById` — 记录不存在或不属于用户时抛出 `NOT_FOUND`
- `update` — 更新字段后返回完整行
- `update` — 记录不存在时抛出 `NOT_FOUND`
- `delete` — 删除成功，清除 Redis 缓存
- `delete` — 记录不存在时抛出 `NOT_FOUND`

Mock 要点：Redis 的 `del` 和 `keys` 需 mock，`_invalidateCache` 中的 Redis 失败应被静默吞掉。

#### 5. `analysis.service.test.js`

- `getTodayStats` — 缓存命中直接返回
- `getTodayStats` — 缓存未命中重新计算
- `getSummary` — week/month/quarter 三个周期
- `getSummary` — 缓存命中
- `getTrend` — 按类型（sleep/steps/water/exercise）查趋势
- `getTrend` — 未知类型返回空 `{ labels: [], values: [] }`
- `getGoalStatus` — 各指标达标率计算
- `getWeeklyReport` — 返回文本摘要
- `getDashboard` — 聚合 today + yesterday + series + week
- `getWeekStats` — 评分和等级计算
  - 无记录时 score = 0, grade = "需努力"
  - score ≥ 85: "优秀"
  - score ≥ 70: "良好"
  - score ≥ 50: "及格"

Mock 要点：日期相关测试可用 `jest.useFakeTimers()` 固定 `new Date()` 返回值。

#### 6. `reminder.service.test.js`

- `list` — 返回提醒列表，按时间排序
- `create` — 无效类型抛出 `VALIDATION_ERROR`
- `create` — 正常创建并加入 Redis 调度
- `update` — 更新字段，重新调度
- `update` — 提醒不存在抛出 `NOT_FOUND`
- `delete` — 删除并从 Redis 移除
- `getDue` — 返回到期提醒并移除
- `scheduleAll` — 重新调度所有活跃提醒

### 错误对象约定

项目中所有自定义错误使用 `Object.assign` 模式：

```js
throw Object.assign(new Error('消息'), { code: 'ERROR_CODE', status: 400 });
```

测试断言使用 `rejects.toMatchObject`：

```js
await expect(service.someMethod()).rejects.toMatchObject({
  code: 'ERROR_CODE',
  status: 400,
});
```

---

## 前端测试

### 通用模式：Mock API + Pinia

```js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// 1. Mock 所有 API 模块
vi.mock('@/api/users.api', () => ({
  usersAPI: { getProfile: vi.fn(), updateProfile: vi.fn(), /* ... */ },
}));

// 2. 挂载组件
const wrapper = mount(MyComponent, {
  global: {
    plugins: [createPinia()],
    stubs: ['AppLayout', 'RouterLink'],
  },
});
```

### 各组件测试要点

#### `LoginView.test.js`
- 邮箱格式校验（空值、缺少 @、缺少域名）
- 密码长度校验（少于 6 位）
- 登录成功 → 调用 auth store → 路由跳转
- 登录失败 → 显示错误提示
- 注册模式切换

#### `DashboardView.test.js`
- 加载中状态（骨架屏 / spinner）
- 数据加载成功后正确渲染
- 今日数据卡片展示
- 健康评分和等级展示
- 7 天趋势图数据正确传入 Chart.js
- 加载失败时的错误状态

#### `RecordView.test.js`
- 类型切换（睡眠/步数/饮水/运动/饮食）
- 表单验证
- 提交成功后清空表单
- 记录列表渲染
- 删除确认

#### `AnalysisView.test.js`
- 周期切换（week/month/quarter）
- 趋势图数据渲染
- 无数据时的空状态
- 目标达标状态展示

#### `ChatView.test.js`
- 对话列表加载
- 创建新对话
- 发送消息 → 加载动画 → 回复渲染
- Markdown 渲染（marked 库）
- Ollama 不可用时的 fallback 提示
- DeepSeek 模式切换
- 删除对话

#### `ProfileView.test.js`（已有，需补充）
现有用例覆盖了 5 个表单校验函数。
需补充：

- 个人信息加载和渲染
- 保存个人信息
- 修改密码成功 / 失败
- API Key 配置
- 数据导出按钮

### Store 测试要点

#### `auth.store.test.js`
- `login` action 成功后 token 存入 localStorage
- `login` action 失败后 error 状态更新
- `logout` 清除 token 和用户状态
- `refreshToken` 成功 / 失败

#### `records.store.test.js`
- `fetchRecords` 加载记录列表
- `createRecord` 添加记录后列表更新
- `deleteRecord` 删除后列表更新

#### `goals.store.test.js`
- `fetchGoals` 加载目标
- `updateGoals` 更新目标

#### `chat.store.test.js`
- `fetchConversations` 加载对话列表
- `createConversation` 创建对话并加入列表
- `sendMessage` 发送消息并追加回复
- `switchModel` 切换模型

### 前端测试注意事项

1. **`<AppLayout>` 必须 stub**：每个 view 组件包裹在 `<AppLayout>` 中，测试时 stub 掉避免渲染侧边栏等无关内容
2. **Pinia 需激活**：调用 `setActivePinia(createPinia())` 或在 mount 的 global.plugins 中传入
3. **`$nextTick` 等待异步**：mount 后 `await wrapper.vm.$nextTick()` 等待初始数据加载
4. **不测 Chart.js**：图表库用 stub 代替，只验证数据 props 传入正确

---

## Mock 策略汇总

| 依赖 | 后端 (Jest) | 前端 (Vitest) |
|------|------------|---------------|
| MySQL | `jest.mock('../src/config/db')` | 不涉及 |
| Redis | `jest.mock('../src/config/redis')` | 不涉及 |
| bcrypt | 真实调用（验证密码逻辑） | 不涉及 |
| jwt | 真实调用或 mock `jsonwebtoken` | 不涉及 |
| fetch (Ollama/DeepSeek) | `jest.spyOn(global, 'fetch')` 或 mock service 内部方法 | mock API 模块 |
| API 模块 | 不涉及 | `vi.mock('@/api/xxx.api')` |
| Chart.js | 不涉及 | stub 组件 |
| AppLayout | 不涉及 | `stubs: ['AppLayout']` |

### Mock db.query 返回值格式

MySQL2 的 `pool.query` 返回 `[rows, fields]`，mock 时只关心 `rows`：

```js
// SELECT 返回 [rows]
pool.query.mockResolvedValueOnce([[{ id: 1, name: 'test' }]]);

// INSERT/UPDATE/DELETE 返回 [result]
pool.query.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
```

---

## 测试数据

局部构造，不复用全局 fixture。每个 `test()` 自己 mock 需要的数据：

```js
test('should update profile', async () => {
  // 数据就在测试里，不依赖外部文件
  pool.query
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[{ id: 1, nickname: 'new' }]]);

  const result = await userService.updateProfile(1, { nickname: 'new' });
  expect(result.nickname).toBe('new');
});
```

**不回写数据库**。所有测试都是纯单元测试，mock 掉持久层。

---

## 覆盖率目标

| 层 | 目标 | 说明 |
|----|------|------|
| Service 层 | ≥ 90% 语句覆盖 | 核心业务逻辑，最高优先级 |
| Controller 层 | ≥ 70% 语句覆盖 | 用 Supertest 做集成测试 |
| 前端组件 | 关键路径覆盖 | 不追求数字，聚焦用户操作流程 |
| Store | ≥ 80% 语句覆盖 | 状态管理逻辑简单但关键 |

---

## CI 集成（未来）

```yaml
# .github/workflows/test.yml 示例
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Backend tests
      run: |
        cd backend
        npm ci
        npm test
    - name: Frontend tests
      run: |
        cd frontend
        npm ci
        npm test
```

---

## 常见问题

### Q: 后端测试需要启动 MySQL/Redis 吗？
不需要。所有数据库和 Redis 调用通过 Jest mock 隔离，`npm test` 可以在任何环境运行。

### Q: 如何 mock 日期相关的测试？
```js
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-05-28T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

### Q: 前端测试需要启动后端吗？
不需要。所有 HTTP 请求通过 `vi.mock()` 拦截，不发送真实网络请求。

### Q: 如何运行单个测试文件？
```bash
# 后端
cd backend && npx jest tests/user.service.test.js

# 前端
cd frontend && npx vitest src/views/__tests__/ProfileView.test.js
```