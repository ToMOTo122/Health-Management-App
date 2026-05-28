<template>
  <div :class="['conv-sidebar', { collapsed }]">
    <div class="conv-header">
      <button class="new-chat-btn" @click="$emit('new')">
        <i class="fa-solid fa-plus"></i> 新对话
      </button>
      <button class="conv-toggle-btn" title="收起对话列表" @click="$emit('toggle')">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
    <div class="conv-list">
      <div v-if="conversations.length === 0" class="conv-empty">
        暂无对话记录
      </div>
      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="['conv-item', { active: conv.id === currentId }]"
        @click="$emit('select', conv.id)"
      >
        <div class="conv-title">{{ conv.title }}</div>
        <div class="conv-preview">{{ conv.last_message || '暂无消息' }}</div>
        <div class="conv-meta">
          <div class="conv-actions" @click.stop>
            <button class="conv-action-btn" title="重命名" @click="renameClicked(conv)">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="conv-action-btn conv-action-danger" title="删除" @click="confirmDelete(conv.id)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: { type: Array, default: () => [] },
  currentId: { type: Number, default: null },
  collapsed: { type: Boolean, default: false },
});

const emit = defineEmits(['select', 'new', 'rename', 'delete', 'toggle']);
function renameClicked(conv) {
  const newTitle = prompt('请输入新标题', conv.title);
  if (newTitle && newTitle.trim() && newTitle.trim() !== conv.title) {
    emit('rename', conv.id, newTitle.trim());
  }
}

function confirmDelete(id) {
  if (confirm('确定要删除这个对话吗？删除后无法恢复。')) {
    emit('delete', id);
  }
}
</script>

<style scoped>
.conv-sidebar {
  width: 260px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  height: 100%;
  transition: width var(--transition);
}
.conv-sidebar.collapsed {
  width: 0;
  border-right: none;
  overflow: hidden;
  padding: 0;
}
.conv-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.conv-toggle-btn {
  width: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.conv-toggle-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}
.new-chat-btn {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  font-family: inherit;
  color: var(--text);
}
.new-chat-btn:hover {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
}
.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.conv-empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-light);
  font-size: 13px;
}
.conv-item {
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: var(--transition);
}
.conv-item:hover {
  background: var(--sidebar-hvr);
}
.conv-item.active {
  background: var(--primary-light);
}
.conv-item.active .conv-title {
  color: var(--primary-dark);
  font-weight: 700;
}
.conv-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.conv-preview {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.conv-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.conv-actions {
  display: flex;
  gap: 4px;
}
.conv-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  color: var(--text-light);
  opacity: 0;
  transition: var(--transition);
}
.conv-item:hover .conv-action-btn {
  opacity: 0.7;
}
.conv-action-btn:hover {
  opacity: 1 !important;
  background: var(--border);
}
.conv-action-danger:hover {
  color: var(--danger);
}
</style>
