import { useRecordsStore } from '../stores/records.store';
import { useToast } from './useToast';

export function useRecordSubmit(type, emit) {
  const store = useRecordsStore();
  const { showToast } = useToast();

  async function save(form, editing) {
    try {
      if (editing?.id) {
        await store.updateRecord(type, editing.id, form);
      } else {
        await store.createRecord(type, form);
      }
      emit('saved');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || '保存失败';
      showToast(msg, 'error');
    }
  }

  return { save };
}
