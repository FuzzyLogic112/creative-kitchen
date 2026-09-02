export interface RecipeIndex {
  id: string;
  name: string;
  category: string;
  difficulty: number | null;
  calories: number | null;
  mains: string[];
  optional: string[];
}

export interface MatchResult extends RecipeIndex {
  got: string[];
  missing: string[];
  bonus: string[];
  rate: number;
  score: number;
}

export interface Ingredient {
  name: string;
  raw: string;
  optional: boolean;
  isSeasoning: boolean;
  isTool: boolean;
}

export interface Recipe extends RecipeIndex {
  description: string;
  portion: string;
  steps: { text: string; tips: string[] }[];
  notes: string;
  ingredients: Ingredient[];
}
