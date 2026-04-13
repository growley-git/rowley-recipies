export const typeDefs = /* GraphQL */ `
  scalar DateTime

  type Tag {
    id: ID!
    name: String!
    slug: String!
  }

  type IngredientLine {
    id: ID!
    section: String
    foodName: String!
    unit: String!
    amount: Float!
    amountDisplay: String!
    note: String
  }

  type RecipeStep {
    id: ID!
    sortOrder: Int!
    text: String!
  }

  type RecipeReviewStats {
    averageRating: Float
    reviewCount: Int!
  }

  type RecipeReview {
    id: ID!
    rating: Int!
    body: String
    authorName: String
    createdAt: DateTime!
    mine: Boolean!
  }

  type Recipe {
    id: ID!
    title: String!
    slug: String!
    publishedAt: DateTime
    ingredients: [IngredientLine!]!
    steps: [RecipeStep!]!
    tags: [Tag!]!
    aiSummary: String
    reviewStats: RecipeReviewStats!
    reviews(first: Int = 50): [RecipeReview!]!
  }

  input SubmitRecipeReviewInput {
    rating: Int!
    body: String
    authorName: String
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type RecipeEdge {
    cursor: String!
    node: Recipe!
  }

  type RecipeConnection {
    edges: [RecipeEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input PaginationInput {
    first: Int
    after: String
  }

  input RecipeFilterInput {
    publishedOnly: Boolean
    tagSlug: String
    search: String
  }

  input IngredientLineInput {
    id: ID
    section: String
    foodName: String!
    unit: String!
    amount: Float!
    note: String
  }

  input RecipeStepInput {
    text: String!
  }

  input RecipeInput {
    title: String!
    slug: String!
    tagIds: [ID!]
    ingredients: [IngredientLineInput!]!
    steps: [RecipeStepInput!]!
  }

  type LoginPayload {
    token: String!
    expiresAt: DateTime!
  }

  type GrocerySourceRecipe {
    id: ID!
    title: String!
    slug: String!
  }

  type GroceryLine {
    id: ID!
    foodName: String!
    unit: String!
    amount: Float!
    display: String!
    sourceRecipes: [GrocerySourceRecipe!]!
  }

  type GroceryListPayload {
    lines: [GroceryLine!]!
    selectedRecipes: [GrocerySourceRecipe!]!
  }

  type GroceryListResult {
    lineCount: Int!
    lines: [GroceryLine!]!
    selectedRecipes: [GrocerySourceRecipe!]!
  }

  type AIFeatureFlags {
    enabled: Boolean!
    tagSuggestions: Boolean!
    summaries: Boolean!
  }

  type Query {
    recipe(id: ID, slug: String): Recipe
    recipes(filter: RecipeFilterInput, pagination: PaginationInput): RecipeConnection!
    tags: [Tag!]!
    groceryList: GroceryListPayload!
    aiFeatureFlags: AIFeatureFlags!
  }

  type Mutation {
    login(password: String!): LoginPayload!
    createRecipe(input: RecipeInput!): Recipe!
    updateRecipe(id: ID!, input: RecipeInput!): Recipe!
    deleteRecipe(id: ID!): Boolean!
    publishRecipe(id: ID!): Recipe!
    unpublishRecipe(id: ID!): Recipe!
    upsertTag(name: String!): Tag!
    addRecipeToGroceryList(recipeId: ID!): GroceryListResult!
    removeGroceryLine(id: ID!): Boolean!
    clearGroceryList: Boolean!
    suggestTagsForRecipe(recipeId: ID!): [Tag!]!
    summarizeRecipe(recipeId: ID!): String!
    submitRecipeReview(
      recipeSlug: String!
      input: SubmitRecipeReviewInput!
    ): RecipeReview!
  }
`;
