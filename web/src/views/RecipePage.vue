<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import RecipeStepText from "../components/RecipeStepText.vue";
import { useRegisterBreadcrumbDetail } from "../composables/breadcrumbDetail";
import { useAlerts } from "../composables/useAlerts";
import { GROCERY_LIST_QUERY } from "../graphql/groceryList";

const props = defineProps<{
  slug: string;
}>();

const RECIPE = gql`
  query RecipeBySlug($slug: String!) {
    recipe(slug: $slug) {
      id
      title
      slug
      publishedAt
      reviewStats {
        averageRating
        reviewCount
      }
      reviews(first: 50) {
        id
        rating
        body
        authorName
        createdAt
        mine
      }
      steps {
        id
        sortOrder
        text
      }
      ingredients {
        id
        section
        foodName
        unit
        amount
        amountDisplay
        note
      }
      tags {
        id
        name
        slug
      }
    }
  }
`;

const ADD_TO_LIST = gql`
  mutation AddRecipe($recipeId: ID!) {
    addRecipeToGroceryList(recipeId: $recipeId) {
      lineCount
    }
  }
`;

const SUBMIT_REVIEW = gql`
  mutation SubmitRecipeReview(
    $recipeSlug: String!
    $input: SubmitRecipeReviewInput!
  ) {
    submitRecipeReview(recipeSlug: $recipeSlug, input: $input) {
      id
      rating
      body
      authorName
      createdAt
      mine
    }
  }
`;

const route = useRoute();
const slug = computed(() => (props.slug ?? route.params.slug) as string);

const { result, loading, refetch } = useQuery(
  RECIPE,
  () => ({ slug: slug.value }),
  () => ({ enabled: !!slug.value })
);

const recipe = computed(() => result.value?.recipe);

const hasMyReview = computed(() =>
  Boolean(
    recipe.value?.reviews?.some((rev: { mine?: boolean }) => rev.mine)
  )
);

useRegisterBreadcrumbDetail(() => recipe.value?.title);

const ingredientFoodNames = computed(() =>
  (recipe.value?.ingredients ?? []).map((i: { foodName: string }) => i.foodName)
);

const { mutate: addToList, loading: adding } = useMutation(ADD_TO_LIST, {
  refetchQueries: [{ query: GROCERY_LIST_QUERY }],
  awaitRefetchQueries: true,
});

const { mutate: submitReview, loading: submittingReview } =
  useMutation(SUBMIT_REVIEW);

const { push: alert } = useAlerts();

const draftRating = ref<number | null>(null);
const draftBody = ref("");
const draftAuthor = ref("");

watch(
  recipe,
  (r, prev) => {
    if (prev && r && prev.slug !== r.slug) {
      draftRating.value = null;
      draftBody.value = "";
      draftAuthor.value = "";
    }
    if (!r) return;
    const mine = r.reviews?.find((rev: { mine?: boolean }) => rev.mine) as
      | { rating: number; body?: string | null; authorName?: string | null }
      | undefined;
    if (mine) {
      draftRating.value = mine.rating;
      draftBody.value = mine.body ?? "";
      draftAuthor.value = mine.authorName ?? "";
    } else if (!prev || prev.slug !== r.slug) {
      draftRating.value = null;
      draftBody.value = "";
      draftAuthor.value = "";
    }
  },
  { immediate: true }
);

async function add() {
  const id = recipe.value?.id;
  if (!id) return;
  try {
    await addToList({ recipeId: id });
    alert("Ingredients added to your grocery list.", "success");
  } catch {
    alert("Could not add to the grocery list. Try again.", "error");
  }
}

function formatAvg(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(1);
}

function formatReviewDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function starsLabel(n: number) {
  const filled = "\u2605";
  const outline = "\u2606";
  return filled.repeat(n) + outline.repeat(5 - n);
}

async function sendReview() {
  const r = recipe.value;
  if (!r?.publishedAt || !r.slug) return;
  const rating = draftRating.value;
  if (rating == null || rating < 1 || rating > 5) {
    alert("Pick a rating from 1 to 5 stars.", "error");
    return;
  }
  try {
    await submitReview({
      recipeSlug: r.slug,
      input: {
        rating,
        body: draftBody.value.trim() || null,
        authorName: draftAuthor.value.trim() || null,
      },
    });
    await refetch();
    alert("Thanks — your review was saved.", "success");
  } catch {
    alert("Could not save your review. Try again.", "error");
  }
}
</script>

<template>
  <div v-if="loading">Loading…</div>
  <article v-else-if="recipe">
    <h1>{{ recipe.title }}</h1>
    <p
      v-if="recipe.reviewStats?.reviewCount"
      class="head-rating"
      :title="`${recipe.reviewStats.reviewCount} review(s)`"
    >
      <span class="avg"
        >{{ "\u2605" }} {{ formatAvg(recipe.reviewStats.averageRating) }}</span
      >
      <span class="count"
        >({{ recipe.reviewStats.reviewCount }}
        {{ recipe.reviewStats.reviewCount === 1 ? "review" : "reviews" }})</span
      >
    </p>
    <p v-if="recipe.tags?.length" class="tags">
      <span v-for="t in recipe.tags" :key="t.id" class="tag-pill">{{ t.name }}</span>
    </p>
    <section v-if="recipe.ingredients?.length" class="card block">
      <h2>Ingredients</h2>
      <ul>
        <li v-for="ing in recipe.ingredients" :key="ing.id">
          <template v-if="ing.section">
            <strong class="section">{{ ing.section }}</strong>
          </template>
          <span class="qty">{{ ing.amountDisplay }}</span>
          {{ ing.foodName }}
          <span v-if="ing.note" class="note">({{ ing.note }})</span>
        </li>
      </ul>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="adding || !recipe.publishedAt"
        @click="add"
      >
        Add to grocery list
      </button>
      <p v-if="!recipe.publishedAt" class="hint">This recipe is not published.</p>
    </section>
    <section v-if="recipe.steps?.length" class="card block">
      <h2>Directions</h2>
      <ol class="steps">
        <li v-for="s in recipe.steps" :key="s.id">
          <RecipeStepText :text="s.text" :food-names="ingredientFoodNames" />
        </li>
      </ol>
    </section>

    <section class="card block reviews">
      <h2>Reviews</h2>
      <p v-if="!recipe.reviewStats?.reviewCount" class="muted">
        No reviews yet. Be the first to rate this recipe.
      </p>
      <ul v-else class="review-list">
        <li v-for="rev in recipe.reviews" :key="rev.id" class="review-item">
          <div class="review-meta">
            <span class="stars" :aria-label="`${rev.rating} out of 5`">{{
              starsLabel(rev.rating)
            }}</span>
            <span class="who">{{
              rev.authorName?.trim() || "Anonymous"
            }}</span>
            <span class="when">{{ formatReviewDate(rev.createdAt) }}</span>
            <span v-if="rev.mine" class="badge-mine">You</span>
          </div>
          <p v-if="rev.body?.trim()" class="review-body">{{ rev.body }}</p>
        </li>
      </ul>

      <div v-if="recipe.publishedAt" class="review-form">
        <h3>{{ hasMyReview ? "Update your review" : "Your review" }}</h3>
        <p class="muted small">
          One review per browser — we use a session cookie (same as the grocery list).
        </p>
        <div class="rating-input" role="group" aria-label="Star rating">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="star-btn"
            :class="{ on: draftRating != null && n <= draftRating }"
            :aria-pressed="draftRating === n"
            @click="draftRating = n"
          >
            {{ "★" }}
          </button>
        </div>
        <label class="field">
          <span class="label">Notes (optional)</span>
          <textarea
            v-model="draftBody"
            class="input"
            rows="4"
            maxlength="2000"
            placeholder="What worked? Any tweaks?"
          />
        </label>
        <label class="field">
          <span class="label">Name (optional)</span>
          <input
            v-model="draftAuthor"
            class="input"
            type="text"
            maxlength="80"
            placeholder="Shown with your review"
          />
        </label>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="submittingReview"
          @click="sendReview"
        >
          Save review
        </button>
      </div>
      <p v-else class="hint">Reviews can be added after this recipe is published.</p>
    </section>
  </article>
  <p v-else>Recipe not found.</p>
</template>

<style lang="scss" scoped>
.head-rating {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}
.head-rating .avg {
  font-weight: 600;
  margin-right: 0.35rem;
}
.head-rating .count {
  color: var(--muted);
  font-size: 0.9rem;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
}
.block {
  margin-bottom: 1.5rem;
}
.section {
  display: block;
  margin-top: 0.75rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.qty {
  font-weight: 600;
  margin-right: 0.25rem;
}
.note {
  color: var(--muted);
  font-size: 0.9rem;
}
.steps {
  margin: 0;
  padding-left: 1.25rem;
}
.steps li {
  margin: 0.5rem 0;
  padding-left: 0.25rem;
}
.hint {
  font-size: 0.9rem;
  color: var(--muted);
}
.muted {
  color: var(--muted);
}
.small {
  font-size: 0.85rem;
}
.review-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem;
}
.review-item {
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
}
.review-item:last-child {
  border-bottom: none;
}
.review-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.stars {
  letter-spacing: 0.05em;
  color: var(--accent, #c9a227);
}
.who {
  font-weight: 600;
}
.when {
  color: var(--muted);
}
.badge-mine {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: var(--surface-2, rgba(0, 0, 0, 0.06));
}
.review-body {
  margin: 0.5rem 0 0;
  white-space: pre-wrap;
}
.review-form {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.review-form h3 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
}
.rating-input {
  display: flex;
  gap: 0.15rem;
  margin: 0.75rem 0 1rem;
}
.star-btn {
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.1rem 0.2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--border);
  transition: color 0.15s ease;
}
.star-btn.on,
.star-btn:hover {
  color: var(--accent, #c9a227);
}
.field {
  display: block;
  margin-bottom: 1rem;
}
.field .label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
  color: var(--muted);
}
.field textarea {
  width: 100%;
  max-width: 36rem;
  resize: vertical;
}
</style>
