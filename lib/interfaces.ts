export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  novaScore: number // Represents the Nova Score (0-1000)
  earningsHistory: number[] // Now represents 8 months (Jan-Aug)
  tripVolume: number
  onTimePickupRate: number // 0-1 scale
  leavesTaken: number
  medicalStability: "stable" | "moderate" | "concerning"
  vehicleCondition: number // 0-100 scale
  forecastedEarnings: number[] // Now represents 4 months (Sep-Dec)
  riskLevel: "low" | "medium" | "high"
  joinDate: string
  lastActive: string
  totalTrips: number
  avgRating: number
  cancellationRate: number
  // New fields for demographic data from Excel
  ageGroup: string
  areaType: string
  gender: string
  ethnicity: string
  rawReviewsText: string // To hold the combined review text from Excel
}

export interface Review {
  id: string
  partnerId: string
  rating: number
  comment: string
  sentiment: "positive" | "neutral" | "negative"
  date: string
  tripId: string
  sentimentScore?: number // New field: 0-5 score based on sentiment analysis
}

export interface FairnessMetric {
  demographic: string
  category: "age" | "area" | "gender" | "ethnicity"
  group: string // e.g., "18-30", "Male", "Urban"
  averageScore: number
  count: number
  bias: number // -1 to 1, where 0 is no bias
}