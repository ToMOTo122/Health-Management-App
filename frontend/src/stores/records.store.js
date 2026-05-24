import { defineStore } from 'pinia';
import { ref } from 'vue';
import { recordsAPI } from '../api/records.api';

export const useRecordsStore = defineStore('records', () => {
  const records = ref([]);
  const loading = ref(false);
  const activeTab = ref('sleep');
  const filterDate = ref('');

  async function fetchRecords(type, params = {}) {
    loading.value = true;
    try {
      const { data } = await recordsAPI[type].query(params);
      if (data.success) records.value = data.data;
    } finally {
      loading.value = false;
    }
  }

  async function createRecord(type, formData) {
    const { data } = await recordsAPI[type].create(formData);
    return data;
  }

  async function updateRecord(type, id, formData) {
    const { data } = await recordsAPI[type].update(id, formData);
    return data;
  }

  async function deleteRecord(type, id) {
    const { data } = await recordsAPI[type].delete(id);
    return data;
  }

  return { records, loading, activeTab, filterDate, fetchRecords, createRecord, updateRecord, deleteRecord };
});
