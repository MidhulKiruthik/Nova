import type { Partner, Review } from "./interfaces";
import { analyzeReviewSentiment, mapScoreToCategoricalSentiment } from "./nova-score-model";

/**
 * Helper to generate a random number within a range (inclusive).
 */
const getRandom = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates random percentages for positive, neutral, and negative sentiment,
 * biased by a base sentiment score (0-5 scale).
 * Ensures percentages sum to 100.
 */
function generateRandomPercentages(baseSentimentScore: number): { positive: number; neutral: number; negative: number } {
  let positive, neutral, negative;

  if (baseSentimentScore > 3.5) { // Generally positive
    positive = getRandom(60, 90); // High positive
    const remaining = 100 - positive;
    neutral = getRandom(0, remaining);
    negative = remaining - neutral;
  } else if (baseSentimentScore < 1.5) { // Generally negative
    negative = getRandom(60, 90); // High negative
    const remaining = 100 - negative;
    neutral = getRandom(0, remaining);
    positive = remaining - neutral;
  } else { // Neutral
    // Aim for a more balanced distribution around neutral
    positive = getRandom(20, 50);
    negative = getRandom(20, 50);
    neutral = 100 - positive - negative;

    // Adjust if neutral becomes negative due to large positive/negative random picks
    if (neutral < 0) {
      const adjustment = Math.abs(neutral);
      if (positive > negative) { // Reduce positive more
        positive = Math.max(0, positive - adjustment);
      } else { // Reduce negative more
        negative = Math.max(0, negative - adjustment);
      }
      neutral = 100 - positive - negative; // Recalculate neutral
    }
  }

  // Final adjustment to ensure sum is exactly 100 due to integer rounding
  const sum = positive + neutral + negative;
  if (sum !== 100) {
    positive += (100 - sum); // Add/subtract difference from positive
  }

  return { positive, neutral, negative };
}

/**
 * Calculates the percentage breakdown of positive, neutral, and negative sentiments
 * for a given partner, prioritizing overallSentimentScore from the partner object
 * or individual review sentiment scores from the provided reviews array.
 * The percentages are randomized but biased by the effective sentiment.
 *
 * @param partner The Partner object, potentially containing an overallSentimentScore.
 * @param allReviews An array of all reviews in the system, from which partner-specific reviews will be filtered.
 * @returns An object with positive, neutral, and negative percentages, and the total number of reviews.
 */
export function calculateSentimentBreakdownForPartner(
  partner: Partner,
  allReviews: Review[]
) {
  const partnerReviews = allReviews.filter(r => r.partnerId === partner.id);

  let effectiveSentimentScore: number;
  let totalReviewsConsidered: number;

  if (partner.overallSentimentScore !== undefined) {
    effectiveSentimentScore = partner.overallSentimentScore;
    totalReviewsConsidered = 1; // Treat as one aggregated sentiment source
  } else if (partnerReviews.length > 0) {
    // Calculate average sentiment from individual reviews
    const totalSentiment = partnerReviews.reduce((sum, review) => {
      return sum + (review.sentimentScore ?? analyzeReviewSentiment(review.comment));
    }, 0);
    effectiveSentimentScore = totalSentiment / partnerReviews.length;
    totalReviewsConsidered = partnerReviews.length;
  } else if (partner.rawReviewsText && partner.rawReviewsText.trim() !== "") {
    // Fallback to rawReviewsText if no structured reviews but raw text exists
    const comments = partner.rawReviewsText.split(';').map(s => s.trim()).filter(Boolean);
    if (comments.length > 0) {
      const totalSentiment = comments.reduce((sum, comment) => sum + analyzeReviewSentiment(comment), 0);
      effectiveSentimentScore = totalSentiment / comments.length;
      totalReviewsConsidered = comments.length;
    } else {
      effectiveSentimentScore = 2.5; // Default neutral
      totalReviewsConsidered = 0;
    }
  } else {
    effectiveSentimentScore = 2.5; // Default neutral
    totalReviewsConsidered = 0;
  }

  if (totalReviewsConsidered === 0) {
    return { positive: 0, neutral: 100, negative: 0, total: 0 };
  }

  const { positive, neutral, negative } = generateRandomPercentages(effectiveSentimentScore);

  return {
    positive,
    neutral,
    negative,
    total: totalReviewsConsidered,
  };
}