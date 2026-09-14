import type { difficultyValues } from '@/lib/recipeFormSchema'

type Difficulty = (typeof difficultyValues)[number]

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-rose-400',
}

export function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as Difficulty] ?? 'text-muted-foreground'
}
