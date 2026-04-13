import { GraphQLScalarType } from "graphql";
import type { Prisma } from "@prisma/client";
import type { GraphQLContext } from "../context.js";
export declare const resolvers: {
    DateTime: GraphQLScalarType<Date | null, string | null>;
    Query: {
        recipe(_: unknown, args: {
            id?: string;
            slug?: string;
        }, ctx: GraphQLContext): Promise<({
            ingredients: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                note: string | null;
                recipeId: string;
                sortOrder: number;
                section: string | null;
            }[];
            steps: {
                id: string;
                recipeId: string;
                sortOrder: number;
                text: string;
            }[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                recipeId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            title: string;
            slug: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            aiSummary: string | null;
        }) | null>;
        recipes(_: unknown, args: {
            filter?: {
                publishedOnly?: boolean;
                tagSlug?: string;
                search?: string;
            };
            pagination?: {
                first?: number;
                after?: string;
            };
        }, ctx: GraphQLContext): Promise<{
            edges: {
                cursor: string;
                node: {
                    ingredients: {
                        id: string;
                        foodName: string;
                        unit: string;
                        amount: number;
                        note: string | null;
                        recipeId: string;
                        sortOrder: number;
                        section: string | null;
                    }[];
                    steps: {
                        id: string;
                        recipeId: string;
                        sortOrder: number;
                        text: string;
                    }[];
                    tags: ({
                        tag: {
                            id: string;
                            name: string;
                            slug: string;
                        };
                    } & {
                        recipeId: string;
                        tagId: string;
                    })[];
                } & {
                    id: string;
                    title: string;
                    slug: string;
                    publishedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    aiSummary: string | null;
                };
            }[];
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
            };
            totalCount: number;
        }>;
        tags(_: unknown, __: unknown, ctx: GraphQLContext): Prisma.PrismaPromise<{
            id: string;
            name: string;
            slug: string;
        }[]>;
        groceryList(_: unknown, __: unknown, ctx: GraphQLContext): Promise<{
            lines: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                display: string;
                sourceRecipes: {
                    id: string;
                    title: string;
                    slug: string;
                }[];
            }[];
            selectedRecipes: {
                id: string;
                title: string;
                slug: string;
            }[];
        }>;
        aiFeatureFlags(): {
            enabled: boolean;
            tagSuggestions: boolean;
            summaries: boolean;
        };
    };
    Mutation: {
        login(_: unknown, args: {
            password: string;
        }): {
            token: string;
            expiresAt: Date;
        };
        createRecipe(_: unknown, args: {
            input: {
                title: string;
                slug: string;
                tagIds?: string[];
                steps: Array<{
                    text: string;
                }>;
                ingredients: Array<{
                    section?: string | null;
                    foodName: string;
                    unit: string;
                    amount: number;
                    note?: string | null;
                }>;
            };
        }, ctx: GraphQLContext): Promise<{
            ingredients: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                note: string | null;
                recipeId: string;
                sortOrder: number;
                section: string | null;
            }[];
            steps: {
                id: string;
                recipeId: string;
                sortOrder: number;
                text: string;
            }[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                recipeId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            title: string;
            slug: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            aiSummary: string | null;
        }>;
        updateRecipe(_: unknown, args: {
            id: string;
            input: {
                title: string;
                slug: string;
                tagIds?: string[];
                steps: Array<{
                    text: string;
                }>;
                ingredients: Array<{
                    section?: string | null;
                    foodName: string;
                    unit: string;
                    amount: number;
                    note?: string | null;
                }>;
            };
        }, ctx: GraphQLContext): Promise<{
            ingredients: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                note: string | null;
                recipeId: string;
                sortOrder: number;
                section: string | null;
            }[];
            steps: {
                id: string;
                recipeId: string;
                sortOrder: number;
                text: string;
            }[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                recipeId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            title: string;
            slug: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            aiSummary: string | null;
        }>;
        deleteRecipe(_: unknown, args: {
            id: string;
        }, ctx: GraphQLContext): Promise<boolean>;
        publishRecipe(_: unknown, args: {
            id: string;
        }, ctx: GraphQLContext): Promise<{
            ingredients: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                note: string | null;
                recipeId: string;
                sortOrder: number;
                section: string | null;
            }[];
            steps: {
                id: string;
                recipeId: string;
                sortOrder: number;
                text: string;
            }[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                recipeId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            title: string;
            slug: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            aiSummary: string | null;
        }>;
        unpublishRecipe(_: unknown, args: {
            id: string;
        }, ctx: GraphQLContext): Promise<{
            ingredients: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                note: string | null;
                recipeId: string;
                sortOrder: number;
                section: string | null;
            }[];
            steps: {
                id: string;
                recipeId: string;
                sortOrder: number;
                text: string;
            }[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                recipeId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            title: string;
            slug: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            aiSummary: string | null;
        }>;
        upsertTag(_: unknown, args: {
            name: string;
        }, ctx: GraphQLContext): Promise<{
            id: string;
            name: string;
            slug: string;
        }>;
        addRecipeToGroceryList(_: unknown, args: {
            recipeId: string;
        }, ctx: GraphQLContext): Promise<{
            lineCount: number;
            lines: {
                id: string;
                foodName: string;
                unit: string;
                amount: number;
                display: string;
                sourceRecipes: {
                    id: string;
                    title: string;
                    slug: string;
                }[];
            }[];
            selectedRecipes: {
                id: string;
                title: string;
                slug: string;
            }[];
        }>;
        removeGroceryLine(_: unknown, args: {
            id: string;
        }, ctx: GraphQLContext): Promise<boolean>;
        clearGroceryList(_: unknown, __: unknown, ctx: GraphQLContext): Promise<boolean>;
        suggestTagsForRecipe(_: unknown, args: {
            recipeId: string;
        }, ctx: GraphQLContext): Promise<{
            id: string;
            name: string;
            slug: string;
        }[]>;
        summarizeRecipe(_: unknown, args: {
            recipeId: string;
        }, ctx: GraphQLContext): Promise<string>;
    };
    Recipe: {
        ingredients(parent: {
            ingredients?: unknown[];
        }): unknown[];
        steps(parent: {
            steps?: unknown[];
        }): unknown[];
        tags(parent: {
            tags?: Array<{
                tag: unknown;
            }>;
        }): unknown[];
    };
    IngredientLine: {
        amountDisplay(parent: {
            amount: number;
            unit: string;
        }): string;
    };
};
//# sourceMappingURL=index.d.ts.map