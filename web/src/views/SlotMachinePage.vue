<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useQuery } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  MEAL_SLOTS,
  PROTEINS,
  pickRecipeForSpin,
  type ArchiveRecipe,
  type ProteinOption,
} from "../lib/slotMachine";

const ARCHIVE = gql`
  query SlotMachineArchive {
    recipes(
      filter: { publishedOnly: true }
      pagination: { first: 100 }
    ) {
      edges {
        node {
          id
          title
          slug
          tags {
            slug
          }
          ingredients {
            foodName
          }
        }
      }
    }
  }
`;

const { result, loading } = useQuery(ARCHIVE);

const archive = computed<ArchiveRecipe[]>(() =>
  (result.value?.recipes?.edges ?? []).map(
    (e: {
      node: {
        id: string;
        title: string;
        slug: string;
        tags: { slug: string }[];
        ingredients: { foodName: string }[];
      };
    }) => e.node
  )
);

const spinning = ref(false);
const reelMeal = ref("—");
const reelProtein = ref("—");
const reelRecipe = ref("—");

const pickedMeal = ref<(typeof MEAL_SLOTS)[number] | null>(null);
const pickedProtein = ref<ProteinOption | null>(null);
const pickedRecipe = ref<ArchiveRecipe | null>(null);
const improvised = ref(false);

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function animateReel<T>(
  durationMs: number,
  tickMs: number,
  pool: readonly T[],
  getLabel: (item: T) => string,
  onFrame: (label: string) => void,
  final: T
) {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    onFrame(getLabel(randomItem(pool)));
    await sleep(tickMs);
  }
  onFrame(getLabel(final));
}

async function pullLever() {
  if (spinning.value || loading.value) return;
  if (archive.value.length === 0) return;

  spinning.value = true;
  improvised.value = false;
  pickedMeal.value = null;
  pickedProtein.value = null;
  pickedRecipe.value = null;
  reelRecipe.value = "…";

  const meal = randomItem(MEAL_SLOTS);
  const protein = randomItem(PROTEINS);
  const { recipe, improvised: imp } = pickRecipeForSpin(
    archive.value,
    meal.slug,
    protein
  );

  await animateReel(
    1600,
    70,
    MEAL_SLOTS,
    (m) => m.label,
    (s) => {
      reelMeal.value = s;
    },
    meal
  );
  pickedMeal.value = meal;
  await sleep(350);

  await animateReel(
    1600,
    70,
    PROTEINS,
    (p) => p.label,
    (s) => {
      reelProtein.value = s;
    },
    protein
  );
  pickedProtein.value = protein;
  await sleep(350);

  const titlePool =
    archive.value.length > 0
      ? archive.value.map((r) => r.title)
      : ["Nothing yet"];
  await animateReel(
    2000,
    55,
    titlePool,
    (t) => t,
    (s) => {
      reelRecipe.value = s;
    },
    recipe.title
  );

  pickedRecipe.value = recipe;
  improvised.value = imp;
  spinning.value = false;
}
</script>

<template>
  <div class="slot-page">
    <p class="kicker">Official Rowley Indecision Protocol™</p>
    <h1 class="title">Meal slot machine</h1>
    <p class="blurb">
      For picky eaters, decision fatigue, and anyone who opens the fridge sixteen
      times. Pull the lever: we’ll pick a mealtime, a protein vibe, then a real
      recipe from the archive (when the stars align).
    </p>

    <div v-if="loading" class="card machine">Loading the pantry…</div>

    <div v-else-if="archive.length === 0" class="card machine empty">
      <p>No published recipes yet — add some in Admin, then come back and gamble.</p>
      <RouterLink to="/" class="btn">Back to archive</RouterLink>
    </div>

    <div v-else class="machine-wrap">
      <div class="card machine">
        <div class="reels">
          <div class="reel">
            <span class="reel-label">Meal</span>
            <div class="reel-window" :class="{ glow: !spinning && pickedMeal }">
              <span class="reel-text">{{ reelMeal }}</span>
            </div>
          </div>
          <div class="reel">
            <span class="reel-label">Protein</span>
            <div
              class="reel-window"
              :class="{ glow: !spinning && pickedProtein }"
            >
              <span class="reel-text">{{ reelProtein }}</span>
            </div>
          </div>
          <div class="reel">
            <span class="reel-label">Recipe</span>
            <div
              class="reel-window reel-wide"
              :class="{ glow: !spinning && pickedRecipe }"
            >
              <span class="reel-text">{{ reelRecipe }}</span>
            </div>
          </div>
        </div>

        <div class="lever-row">
          <button
            type="button"
            class="lever"
            :disabled="spinning"
            :aria-busy="spinning"
            @click="pullLever"
          >
            <span class="lever-knob" />
            <span class="lever-arm" />
            <span class="lever-hint">{{ spinning ? "Spinning…" : "Pull" }}</span>
          </button>
        </div>
      </div>

      <p v-if="improvised && pickedRecipe" class="fine-print gag">
        The machine demanded
        <strong>{{ pickedProtein?.label }}</strong>
        for
        <strong>{{ pickedMeal?.label }}</strong
        >, but the archive rebelled. Here’s a solid
        <strong>{{ pickedMeal?.label }}</strong>
        option anyway.
      </p>

      <div
        v-if="pickedRecipe && !spinning"
        class="result card"
      >
        <p class="result-label">Your fate:</p>
        <RouterLink
          class="result-link"
          :to="`/recipe/${pickedRecipe.slug}`"
        >
          {{ pickedRecipe.title }}
        </RouterLink>
        <p class="result-sub">
          Open the recipe — or pull again if you’re still “not hungry.”
        </p>
      </div>
    </div>

    <p class="footer-note">
      <RouterLink to="/">← Return to sensible browsing</RouterLink>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.slot-page {
  max-width: 640px;
  margin: 0 auto;
  padding-bottom: 2rem;
}
.kicker {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 0.25rem;
}
.title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}
.blurb {
  color: var(--muted);
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}
.machine-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.machine {
  padding: 1.5rem;
  background: linear-gradient(165deg, #1c1917 0%, #292524 55%, #1c1917 100%);
  color: #fafaf9;
  border: 3px solid #44403c;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 12px 32px rgb(0 0 0 / 0.2);
}
.machine.empty {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}
.reels {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.reel {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  align-items: center;
  gap: 0.75rem;
}
.reel-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a8a29e;
}
.reel-window {
  background: #0c0a09;
  border: 2px inset #57534e;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  min-height: 3rem;
  display: flex;
  align-items: center;
  box-shadow: inset 0 2px 8px rgb(0 0 0 / 0.45);
  transition:
    box-shadow 0.25s,
    border-color 0.25s;
}
.reel-window.glow {
  border-color: #ea580c;
  box-shadow:
    inset 0 2px 8px rgb(0 0 0 / 0.45),
    0 0 0 1px rgb(234 88 12 / 0.35);
}
.reel-wide .reel-text {
  font-size: 0.95rem;
  line-height: 1.35;
}
.reel-text {
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}
.lever-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #44403c;
}
.lever {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0.5rem;
  color: #fafaf9;
}
.lever:disabled {
  opacity: 0.65;
  cursor: wait;
}
.lever-knob {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #f97316, #9a3412);
  border: 3px solid #431407;
  box-shadow:
    0 4px 0 #431407,
    inset 0 -2px 4px rgb(0 0 0 / 0.25);
}
.lever:active:not(:disabled) .lever-knob {
  transform: translateY(3px);
  box-shadow:
    0 1px 0 #431407,
    inset 0 -2px 4px rgb(0 0 0 / 0.25);
}
.lever-arm {
  width: 10px;
  height: 2.5rem;
  background: linear-gradient(90deg, #78716c, #a8a29e);
  border-radius: 2px;
  margin-top: -2px;
}
.lever-hint {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a8a29e;
}
.fine-print {
  font-size: 0.88rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.45;
}
.fine-print.gag strong {
  color: var(--accent);
}
.result {
  padding: 1.25rem;
  text-align: center;
}
.result-label {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.result-link {
  font-family: "Fraunces", Georgia, serif;
  font-size: 1.35rem;
  font-weight: 600;
  display: inline-block;
  margin: 0.25rem 0;
}
.result-sub {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
  color: var(--muted);
}
.footer-note {
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
