import { ref, watch, type MaybeRefOrGetter, toValue } from "vue";
import { useRoute } from "vue-router";

/** Last segment label for routes that load a title asynchronously (recipe, admin edit). */
export const breadcrumbDetailLabel = ref<string | null>(null);

export function useRegisterBreadcrumbDetail(
  label: MaybeRefOrGetter<string | null | undefined>
) {
  const route = useRoute();
  watch(
    [() => toValue(label), () => route.fullPath],
    () => {
      breadcrumbDetailLabel.value = toValue(label)?.trim() || null;
    },
    { immediate: true }
  );
}
