import { ref, type Ref } from "vue";

export type AlertVariant = "success" | "error" | "info";

export type AlertItem = {
  id: number;
  message: string;
  variant: AlertVariant;
};

const items: Ref<AlertItem[]> = ref([]);
let nextId = 1;

/**
 * Global toast-style alerts (single shared queue for the app).
 */
export function useAlerts() {
  function push(
    message: string,
    variant: AlertVariant = "success",
    autoDismissMs = 4500
  ): number {
    const id = nextId++;
    items.value = [...items.value, { id, message, variant }];
    if (autoDismissMs > 0) {
      setTimeout(() => dismiss(id), autoDismissMs);
    }
    return id;
  }

  function dismiss(id: number) {
    items.value = items.value.filter((a) => a.id !== id);
  }

  function clear() {
    items.value = [];
  }

  return { items, push, dismiss, clear };
}
