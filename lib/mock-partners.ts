import type { Partner } from "./interfaces"
import { rawPartnerData } from "./raw-partner-data" // Import the raw data
import { mockReviews } from "./mock-reviews" // Still needed for calculateNovaScore if used
import { calculateNovaScore } from "./nova-score-model" // Still needed for calculateNovaScore if used

// Export the raw data as mockPartners, applying any necessary processing.
// For now, we'll use the novaScore directly from the raw data.
// If you want to recalculate based on mockReviews, uncomment the line below:
export const mockPartners: Partner[] = rawPartnerData.map(partner => ({
  ...partner,
  // novaScore: calculateNovaScore(partner, mockReviews), // Uncomment if novaScore should be dynamically calculated
}));