import { gql } from "@apollo/client/core";

/** Shared document so mutations can refetch the same cache entry. */
export const GROCERY_LIST_QUERY = gql`
  query GroceryList {
    groceryList {
      lines {
        id
        foodName
        unit
        amount
        display
        sourceRecipes {
          id
          title
          slug
        }
      }
      selectedRecipes {
        id
        title
        slug
      }
    }
  }
`;
