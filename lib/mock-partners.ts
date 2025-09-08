import type { Partner } from "./interfaces"
import { rawPartnerDataPart1, rawPartnerDataPart2, rawPartnerDataPart3 } from "./raw-partner-data" // Import the modular raw data parts
import { mockReviews } from "./mock-reviews" // Still needed for calculateNovaScore if used
import { calculateNovaScore } from "./nova-score-model" // Still needed for calculateNovaScore if used

// Combine all raw partner data parts
const combinedRawPartnerData: Partner[] = [
  ...rawPartnerDataPart1,
  ...rawPartnerDataPart2,
  ...rawPartnerDataPart3,
];

// Export the combined raw data as mockPartners, applying any necessary processing.
// For now, we'll use the novaScore directly from the raw data.
// If you want to recalculate based on mockReviews, uncomment the line below:
export const mockPartners: Partner[] = combinedRawPartnerData.map(partner => ({
  ...partner,
  // novaScore: calculateNovaScore(partner, mockReviews), // Uncomment if novaScore should be dynamically calculated
}));