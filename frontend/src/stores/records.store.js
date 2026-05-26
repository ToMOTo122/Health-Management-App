import { defineStore } from 'pinia';
import { ref } from 'vue';
import { toRaw } from 'vue';
import { recordsAPI } from '../api/records.api';
import { normalizeRecordRow } from '../utils/date';

const SYSTEM_FIELDS = new Set(['id', 'user_id', 'created_at', 'updated_at']);

function stripSystemFields(data) {
  const raw = toRaw(data);
  const payload = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!SYSTEM_FIELDS.has(key) && value !== undefined && value !== '') {
      payload[key] = value;
    }
  }
  return payload;
}

function parseListResponse(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function apiError(message, responseData) {
  const err = new Error(message);
  if (responseData) err.response = { data: responseData };
  return err;
}

export const useRecordsStore = defineStore('records', () => {
  const records = ref([]);
  const loading = ref(false);

  async function fetchRecords(type, params = {}) {
    loading.value = true;
    try {
      const { data } = await recordsAPI[type].query(params);
      if (data?.success === false) {
        throw apiError(data.error?.message || '加载失败', data);
      }
      records.value = parseListResponse(data).map(normalizeRecordRow);
    } catch (err) {
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createRecord(type, formData) {
    const { data } = await recordsAPI[type].create(stripSystemFields(formData));
    if (data?.success === false) {
      throw apiError(data.error?.message || '保存失败', data);
    }
    return data;
  }

  async function updateRecord(type, id, formData) {
    const { data } = await recordsAPI[type].update(id, stripSystemFields(formData));
    if (data?.success === false) {
      throw apiError(data.error?.message || '保存失败', data);
    }
    return data;
  }

  async function deleteRecord(type, id) {
    const { data } = await recordsAPI[type].delete(id);
    if (data?.success === false) {
      throw apiError(data.error?.message || '删除失败', data);
    }
    return data;
  }

  function removeRecordLocally(id) {
    const sid = String(id);
    records.value = records.value.filter((r) => String(r.id) !== sid);
  }

  return { records, loading, fetchRecords, createRecord, updateRecord, deleteRecord, removeRecordLocally };
});
