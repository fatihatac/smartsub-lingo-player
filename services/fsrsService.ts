/**
 * FSRS (Free Spaced Repetition Scheduler) service.
 * Wraps ts-fsrs to provide scheduling for saved vocabulary words.
 * Pure functions, no React dependencies.
 */

import {
  fsrs,
  createEmptyCard as fsrsCreateEmptyCard,
  Rating,
  State,
  type Card,
  type Grade,
  type ReviewLog,
} from "ts-fsrs";

// ---------------------------------------------------------------------------
// Singleton scheduler with default FSRS parameters
// ---------------------------------------------------------------------------

const scheduler = fsrs();

// ---------------------------------------------------------------------------
// FSRS fields stored on SavedWord (timestamps as ms since epoch)
// ---------------------------------------------------------------------------

export interface FsrsFields {
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
  scheduled_days: number;
  learning_steps: number;
  due: number;
  last_review: number | null;
}

// ---------------------------------------------------------------------------
// Mapping utilities
// ---------------------------------------------------------------------------

/**
 * Convert SavedWord FSRS fields to a ts-fsrs Card.
 * Transforms numeric timestamps to Date objects.
 */
export function mapToCard(fields: FsrsFields): Card {
  return {
    due: new Date(fields.due),
    stability: fields.stability,
    difficulty: fields.difficulty,
    elapsed_days: 0,
    scheduled_days: fields.scheduled_days,
    learning_steps: fields.learning_steps,
    reps: fields.reps,
    lapses: fields.lapses,
    state: fields.state as State,
    last_review:
      fields.last_review != null ? new Date(fields.last_review) : undefined,
  };
}

/**
 * Convert a ts-fsrs Card back to SavedWord FSRS fields.
 * Transforms Date objects to numeric timestamps.
 */
export function mapFromCard(card: Card, _log: ReviewLog): FsrsFields {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    state: card.state,
    reps: card.reps,
    lapses: card.lapses,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    due: card.due.getTime(),
    last_review: card.last_review ? card.last_review.getTime() : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new empty FSRS card with default state.
 * Use this when saving a new word to initialize its FSRS fields.
 */
export function createEmptyCard(): FsrsFields {
  const card = fsrsCreateEmptyCard(new Date());
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    state: card.state,
    reps: card.reps,
    lapses: card.lapses,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    due: card.due.getTime(),
    last_review: card.last_review ? card.last_review.getTime() : null,
  };
}

/**
 * Schedule a review for a saved word.
 * Returns the updated FSRS fields and the review log entry.
 */
export function scheduleReview(
  fields: FsrsFields,
  rating: Grade,
): { card: FsrsFields; log: ReviewLog } {
  const card = mapToCard(fields);
  const result = scheduler.next(card, new Date(), rating);

  return {
    card: mapFromCard(result.card, result.log),
    log: result.log,
  };
}

/**
 * Get the current retrievability (probability of recall) for a saved word.
 * Returns a value between 0 and 1.
 */
export function getRetrievability(fields: FsrsFields): number {
  const card = mapToCard(fields);
  return scheduler.get_retrievability(card, new Date(), false);
}

// ---------------------------------------------------------------------------
// Re-exports for UI consumption
// ---------------------------------------------------------------------------

export { Rating, State };
export type { Grade, ReviewLog };
