import { useRecordsStore } from '../stores/records.store';
import { useToast } from './useToast';
import { getApiErrorMessage } from '../utils/apiError';

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
      showToast(getApiErrorMessage(err, '保存失败'), 'error');
    }
  }

  return { save };
}
