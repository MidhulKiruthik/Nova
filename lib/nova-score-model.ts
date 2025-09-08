import type { Partner, Review } from "./interfaces";

/**
 * Simulates an ML model for sentiment analysis on review text.
 * Returns a score between 0 (very negative) and 5 (very positive).
 */
export function analyzeReviewSentiment(text: string): number {
  if (!text || text.trim() === "") {
    return 2.5; // Neutral score for empty or missing reviews
  }

  const lowerText = text.toLowerCase();
  let rawScore = 0; // Raw score between -1 and 1

  // Positive keywords
  if (lowerText.includes("excellent")) rawScore += 0.8;
  if (lowerText.includes("great")) rawScore += 0.6;
  if (lowerText.includes("good")) rawScore += 0.4;
  if (lowerText.includes("professional")) rawScore += 0.7;
  if (lowerText.includes("friendly")) rawScore += 0.5;
  if (lowerText.includes("on time")) rawScore += 0.6;
  if (lowerText.includes("clean")) rawScore += 0.5;
  if (lowerText.includes("smooth")) rawScore += 0.4;
  if (lowerText.includes("happy")) rawScore += 0.5;
  if (lowerText.includes("fantastic")) rawScore += 0.8;
  if (lowerText.includes("best")) rawScore += 0.9;
  if (lowerText.includes("safe")) rawScore += 0.6;
  if (lowerText.includes("courteous")) rawScore += 0.5;
  if (lowerText.includes("pleasant")) rawScore += 0.5;
  if (lowerText.includes("reliable")) rawScore += 0.6;
  if (lowerText.includes("efficient")) rawScore += 0.5;
  if (lowerText.includes("punctual")) rawScore += 0.6;


  // Negative keywords
  if (lowerText.includes("poor")) rawScore -= 0.8;
  if (lowerText.includes("bad")) rawScore -= 0.6;
  if (lowerText.includes("late")) rawScore -= 0.7;
  if (lowerText.includes("distracted")) rawScore -= 0.6;
  if (lowerText.includes("rude")) rawScore -= 0.7;
  if (lowerText.includes("unprofessional")) rawScore -= 0.8;
  if (lowerText.includes("dirty")) rawScore -= 0.5;
  if (lowerText.includes("long route")) rawScore -= 0.5;
  if (lowerText.includes("unhappy")) rawScore -= 0.5;
  if (lowerText.includes("cancel")) rawScore -= 0.9;
  if (lowerText.includes("terrible")) rawScore -= 0.9;
  if (lowerText.includes("unacceptable")) rawScore -= 0.8;
  if (lowerText.includes("delays")) rawScore -= 0.7;
  if (lowerText.includes("tired")) rawScore -= 0.3;


  // Neutral keywords (adjusts score slightly towards zero)
  if (lowerText.includes("okay")) rawScore += 0.1;
  if (lowerText.includes("fine")) rawScore += 0.1;
  if (lowerText.includes("average")) rawScore += 0; // No change

  // Normalize rawScore to be between -1 and 1
  const normalizedRawScore = Math.max(-1, Math.min(1, rawScore / 2));

  // Map normalizedRawScore (-1 to 1) to sentimentScore (0 to 5)
  return parseFloat(((normalizedRawScore + 1) * 2.5).toFixed(1)); // e.g., -1 -> 0, 0 -> 2.5, 1 -> 5
}

/**
 * Maps a numerical sentiment score (0-5) to a categorical sentiment label.
 */
export function mapScoreToCategoricalSentiment(score: number): "positive" | "neutral" | "negative" {
  if (score > 3.5) return "positive";
  if (score < 1.5) return "negative";
  return "neutral";
}

/**
 * Calculates the Nova Score for a partner based on various responsibility metrics and review sentiment.
 * The Nova Score is scaled from 0 to 1000, similar to a credit score.
 * This function now employs a multiple regression-like approach with weighted factors.
 * It now takes rawReviewsText directly from the partner object for sentiment analysis.
 */
export function calculateNovaScore(partner: Partner): number {
  let score = 0; // Start with 0 and build up

  // Calculate average sentiment score from rawReviewsText
  // Assuming rawReviewsText might contain multiple reviews separated by a delimiter (e.g., ';')
  const reviewComments = partner.rawReviewsText ? partner.rawReviewsText.split(';').map(s => s.trim()).filter(Boolean) : [];
  const totalSentimentScore = reviewComments.reduce((sum, comment) => {
    return sum + analyzeReviewSentiment(comment);
  }, 0);
  const avgSentimentScore = reviewComments.length > 0 ? totalSentimentScore / reviewComments.length : 2.5; // Default to neutral (2.5) if no reviews

  // Map categorical risk level to a numerical value (higher is worse)
  let numericRiskLevel = 0;
  if (partner.riskLevel === "low") numericRiskLevel = 1;
  else if (partner.riskLevel === "medium") numericRiskLevel = 2;
  else if (partner.riskLevel === "high") numericRiskLevel = 3;

  // Calculate average monthly earnings
  const avgMonthlyEarnings = partner.earningsHistory.length > 0
    ? partner.earningsHistory.reduce((sum, e) => sum + e, 0) / partner.earningsHistory.length
    : 0;

  // --- Multiple Regression-like Weighted Sum ---
  // These weights are illustrative and would typically be derived from an actual regression model.
  // They are scaled to contribute to a final 0-1000 score.

  // 1. Sentiment Score (0-5 scale, higher is better) - Strong positive impact
  score += (avgSentimentScore / 5) * 300; // Max 300 points

  // 2. On-Time Pickup Rate (0-1 scale, higher is better) - Strong positive impact
  score += partner.onTimePickupRate * 250; // Max 250 points

  // 3. Trip Volume (higher is better, but with diminishing returns) - Moderate positive impact
  score += Math.min(partner.tripVolume / 200, 1) * 100; // Max 100 points, caps at 200 trips

  // 4. Average Monthly Earnings (higher is better, with diminishing returns) - Moderate positive impact
  score += Math.min(avgMonthlyEarnings / 3000, 1) * 150; // Max 150 points, caps at $3000 avg earnings

  // 5. Risk Level (1-3 scale, lower is better) - Strong negative impact
  score -= (numericRiskLevel / 3) * 200; // Max -200 points

  // 6. Cancellation Rate (0-1 scale, lower is better) - Significant negative impact
  score -= partner.cancellationRate * 150; // Max -150 points

  // 7. Vehicle Condition (0-100 scale, higher is better) - Moderate positive impact
  score += (partner.vehicleCondition / 100) * 50; // Max 50 points

  // 8. Leaves Taken (lower is better) - Minor negative impact
  score -= Math.min(partner.leavesTaken / 10, 1) * 20; // Max -20 points, caps at 10 leaves

  // 9. Average Rating (0-5 scale, higher is better) - Moderate positive impact
  score += (partner.avgRating / 5) * 70; // Max 70 points

  // Adjust base score to center around a reasonable value (e.g., 500) and clamp
  // The sum of max positive contributions is 300+250+100+150+50+70 = 920
  // The sum of max negative contributions is -200-150-20 = -370
  // So raw score range is roughly -370 to 920. We need to scale this to 0-1000.
  // A simple linear scaling: (score - min_raw) / (max_raw - min_raw) * 1000
  const minRawScore = -370; // Approximate minimum possible score
  const maxRawScore = 920;  // Approximate maximum possible score
  const scaledScore = ((score - minRawScore) / (maxRawScore - minRawScore)) * 1000;

  return Math.max(0, Math.min(1000, Math.round(scaledScore)));
}