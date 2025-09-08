export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  novaScore: number // Represents the Nova Score (0-1000)
  earningsHistory: number[]
  tripVolume: number
  onTimePickupRate: number // 0-1 scale
  leavesTaken: number
  medicalStability: "stable" | "moderate" | "concerning"
  vehicleCondition: number // 0-100 scale
  forecastedEarnings: number[]
  riskLevel: "low" | "medium" | "high"
  joinDate: string
  lastActive: string
  totalTrips: number
  avgRating: number
  cancellationRate: number
  // New fields for demographic data from Excel
  ageGroup: string // e.g., "18-30", "31-45", "46+"
  areaType: "urban" | "suburban" | "rural" | string // Added string for flexibility
  gender: "male" | "female" | "other" | string // Added string for flexibility
  ethnicity: "white" | "hispanic" | "black" | "asian" | "other" | string // Added string for flexibility
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
  averageScore: number
  count: number
  bias: number // -1 to 1, where 0 is no bias
}