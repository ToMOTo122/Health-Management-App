import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProfileView from '../ProfileView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../stores/auth.store';

// Mock API 模块
vi.mock('../../api/users.api', () => ({
  usersAPI: {
    getProfile: vi.fn(() => Promise.resolve({ data: { success: true, data: { nickname: 'test', email: 'test@example.com' } } })),
    updateProfile: vi.fn(() => Promise.resolve({ data: { success: true } })),
    getGoals: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    updateGoals: vi.fn(() => Promise.resolve({ data: { success: true } })),
    changePassword: vi.fn(() => Promise.resolve({ data: { success: true, message: 'ok' } })),
  },
}));

vi.mock('../../api/reminders.api', () => ({
  remindersAPI: {
    list: vi.fn(() => Promise.resolve({ data: { success: true, data: [] } })),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/export.api', () => ({
  exportAPI: {
    json: vi.fn(),
    csv: vi.fn(),
  },
}));

describe('ProfileView Validation', () => {
  it('should validate nickname correctly', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [createPinia()],
        stubs: ['AppLayout'],
      },
    });
    // 等待组件挂载完成
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm;
    vm.profile.nickname = '';
    vm.validateNickname();
    expect(vm.errors.nickname).toBe('昵称不能为空');

    vm.profile.nickname = 'a'.repeat(51);
    vm.validateNickname();
    expect(vm.errors.nickname).toContain('1-50');

    vm.profile.nickname = 'validName';
    vm.validateNickname();
    expect(vm.errors.nickname).toBe('');
  });

  it('should validate age range', async () => {
    const wrapper = mount(ProfileView, { global: { plugins: [createPinia()], stubs: ['AppLayout'] } });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm;
    vm.profile.age = 150;
    vm.validateAge();
    expect(vm.errors.age).toContain('0-120');

    vm.profile.age = 25;
    vm.validateAge();
    expect(vm.errors.age).toBe('');
  });

    it('should validate height range', async () => {
    const wrapper = mount(ProfileView, { global: { plugins: [createPinia()], stubs: ['AppLayout'] } });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm;
    vm.profile.height_cm = 260;
    vm.validateHeight();
    expect(vm.errors.height).toContain('50-250');

    vm.profile.height_cm = 170;
    vm.validateHeight();
    expect(vm.errors.height).toBe('');
  });

  it('should validate weight range', async () => {
    const wrapper = mount(ProfileView, { global: { plugins: [createPinia()], stubs: ['AppLayout'] } });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm;
    vm.profile.weight_kg = 5;
    vm.validateWeight();
    expect(vm.errors.weight).toContain('10-300');

    vm.profile.weight_kg = 70;
    vm.validateWeight();
    expect(vm.errors.weight).toBe('');
  });

  it('should validate password confirmation', async () => {
    const wrapper = mount(ProfileView, { global: { plugins: [createPinia()], stubs: ['AppLayout'] } });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm;
    vm.pwForm.newPassword = '123456';
    vm.pwForm.confirmPassword = '12345';
    vm.validatePassword();
    expect(vm.errors.password).toBe('两次输入的新密码不一致');

    vm.pwForm.confirmPassword = '123456';
    vm.validatePassword();
    expect(vm.errors.password).toBe('');

    vm.pwForm.newPassword = '123';
    vm.validatePassword();
    expect(vm.errors.password).toBe('新密码至少 6 位');
  });
});