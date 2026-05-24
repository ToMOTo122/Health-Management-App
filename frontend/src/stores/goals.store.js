import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usersAPI } from '../api/users.api';

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref({ sleep_hours: 8, steps_daily: 10000, water_ml: 2000, exercise_min: 30, calories_kcal: 2000 });

  async function fetchGoals() {
    const { data } = await usersAPI.getGoals();
    if (data.success) goals.value = data.data;
    return data;
  }

  async function updateGoals(updates) {
    const { data } = await usersAPI.updateGoals(updates);
    if (data.success) goals.value = data.data;
    return data;
  }

  return { goals, fetchGoals, updateGoals };
});
