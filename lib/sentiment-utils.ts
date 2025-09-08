import type { Partner, Review } from "./interfaces";
import { analyzeReviewSentiment, mapScoreToCategoricalSentiment } from "./nova-score-model";

/**
 * Calculates the percentage breakdown of positive, neutral, and negative sentiments
 * for a given partner, prioritizing overallSentimentScore from the partner object
 * or individual review sentiment scores from the provided reviews array.
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

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let totalReviewsConsidered = 0;

  if (partnerReviews.length > 0) {
    // If there are individual reviews for the partner, use them
    partnerReviews.forEach(review => {
      const sentimentScore = review.sentimentScore ?? analyzeReviewSentiment(review.comment);
      const categoricalSentiment = mapScoreToCategoricalSentiment(sentimentScore);
      if (categoricalSentiment === "positive") {
        positiveCount++;
      } else if (categoricalSentiment === "negative") {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });
    totalReviewsConsidered = partnerReviews.length;
  } else if (partner.overallSentimentScore !== undefined) {
    // If no individual reviews but an overall sentiment score from Excel is available,
    // treat it as a single aggregated sentiment for the partner.
    const score = partner.overallSentimentScore;
    const categorical = mapScoreToCategoricalSentiment(score);
    if (categorical === "positive") {
      positiveCount = 1;
    } else if (categorical === "negative") {
      negativeCount = 1;
    } else {
      neutralCount = 1;
    }
    totalReviewsConsidered = 1; // Count as one aggregated review
  }

  if (totalReviewsConsidered === 0) {
    return { positive: 0, neutral: 100, negative: 0, total: 0 };
  }

  return {
    positive: Math.round((positiveCount / totalReviewsConsidered) * 100),
    neutral: Math.round((neutralCount / totalReviewsConsidered) * 100),
    negative: Math.round((negativeCount / totalReviewsConsidered) * 100),
    total: totalReviewsConsidered,
  };
}