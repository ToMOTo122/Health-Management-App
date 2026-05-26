<template>
  <div class="modal-overlay record-modal-overlay" @click.self="emit('close')">
    <div class="modal record-modal" role="dialog" aria-modal="true" aria-labelledby="record-edit-title">
      <button type="button" class="modal-close" aria-label="关闭" @click="emit('close')">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close']);
</script>

<style scoped>
.record-modal {
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg, #f5f5f5);
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary, #666);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #e0e0e0;
  color: var(--text, #333);
}
</style>
