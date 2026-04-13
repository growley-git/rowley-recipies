<script setup lang="ts">
import { useAlerts } from "../composables/useAlerts";

const { items, dismiss } = useAlerts();
</script>

<template>
  <div class="alert-stack" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="alert">
      <div
        v-for="a in items"
        :key="a.id"
        :class="['alert-toast', `alert-toast--${a.variant}`]"
        role="status"
      >
        <span class="alert-msg">{{ a.message }}</span>
        <button
          type="button"
          class="alert-dismiss"
          aria-label="Dismiss"
          @click="dismiss(a.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.alert-stack {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  pointer-events: none;
}
.alert-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: min(420px, calc(100vw - 2rem));
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--border, #e7e5e4);
  background: var(--surface, #fff);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.12);
  font-size: 0.92rem;
  line-height: 1.4;
}
.alert-toast--success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #14532d;
}
.alert-toast--error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}
.alert-toast--info {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1e3a8a;
}
.alert-msg {
  flex: 1;
  min-width: 0;
}
.alert-dismiss {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.65;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  border-radius: 4px;
}
.alert-dismiss:hover {
  opacity: 1;
  background: rgb(0 0 0 / 0.06);
}

.alert-enter-active,
.alert-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.alert-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}
.alert-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
.alert-move {
  transition: transform 0.2s ease;
}
</style>
