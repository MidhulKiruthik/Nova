import type { Partner, Review } from "./interfaces";

/**
 * Simulates an ML model for sentiment analysis on review text.
 * Returns a score between -1 (very negative) and 1 (very positive).
 */
export function analyzeReviewSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  // Positive keywords
  if (lowerText.includes("excellent")) score += 0.8;
  if (lowerText.includes("great")) score += 0.6;
  if (lowerText.includes("good")) score += 0.4;
  if (lowerText.includes("professional")) score += 0.7;
  if (lowerText.includes("friendly")) score += 0.5;
  if (lowerText.includes("on time")) score += 0.6;
  if (lowerText.includes("clean")) score += 0.5;
  if (lowerText.includes("smooth")) score += 0.4;
  if (lowerText.includes("happy")) score += 0.5;

  // Negative keywords
  if (lowerText.includes("poor")) score -= 0.8;
  if (lowerText.includes("bad")) score -= 0.6;
  if (lowerText.includes("late")) score -= 0.7;
  if (lowerText.includes("distracted")) score -= 0.6;
  if (lowerText.includes("rude")) score -= 0.7;
  if (lowerText.includes("unprofessional")) score -= 0.8;
  if (lowerText.includes("dirty")) score -= 0.5;
  if (lowerText.includes("long route")) score -= 0.5;
  if (lowerText.includes("unhappy")) score -= 0.5;
  if (lowerText.includes("cancel")) score -= 0.4;

  // Neutral keywords (adjusts score slightly towards zero)
  if (lowerText.includes("okay")) score += 0.1;
  if (lowerText.includes("fine")) score += 0.1;
  if (lowerText.includes("average")) score += 0; // No change

  // Normalize score to be between -1 and 1
  return Math.max(-1, Math.min(1, score / 2)); // Divide by 2 to keep it within a reasonable range
}

/**
 * Calculates the Nova Score for a partner based on various responsibility metrics and review sentiment.
 * The Nova Score is scaled from 0 to 1000, similar to a credit score.
 */
export function calculateNovaScore(partner: Partner, allReviews: Review[]): number {
  let score = 500; // Base score

  // Filter reviews for this specific partner
  const partnerReviews = allReviews.filter(review => review.partnerId === partner.id);

  // 1. Sentiment from Reviews (weighted heavily)
  if (partnerReviews.length > 0) {
    const totalSentiment = partnerReviews.reduce((sum, review) => {
      // Use the existing sentiment from mock data, or analyze if comment is available
      const sentimentValue = review.sentiment === "positive" ? 1 : review.sentiment === "negative" ? -1 : 0;
      return sum + sentimentValue;
    }, 0);
    const avgSentiment = totalSentiment / partnerReviews.length;
    score += avgSentiment * 150; // Adjust score based on average sentiment
  }

  // 2. On-Time Pickup Rate (high importance)
  score += (partner.onTimePickupRate - 0.8) * 200; // Penalize below 80%, reward above

  // 3. Cancellation Rate (high importance, negative impact)
  score -= partner.cancellationRate * 300; // Higher cancellation rate means lower score

  // 4. Average Rating (moderate importance)
  score += (partner.avgRating - 3) * 50; // Reward higher ratings, penalize lower

  // 5. Vehicle Condition (moderate importance)
  score += (partner.vehicleCondition - 50) * 2; // Reward good condition, penalize poor

  // 6. Leaves Taken (negative impact)
  score -= partner.leavesTaken * 10; // More leaves, lower score

  // 7. Trip Volume (slight positive impact for active partners)
  score += Math.min(partner.tripVolume / 10, 50); // Cap the impact of trip volume

  // 8. Medical Stability (categorical impact)
  if (partner.medicalStability === "concerning") score -= 50;
  if (partner.medicalStability === "moderate") score -= 20;

  // Clamp the score between 0 and 1000
  return Math.max(0, Math.min(1000, Math.round(score)));
}