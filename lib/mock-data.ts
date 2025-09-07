import { calculateNovaScore, analyzeReviewSentiment } from "./nova-score-model" // Import the new model functions

export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  novaScore: number // Changed from mlScore, now represents the Nova Score (0-1000)
  earningsHistory: number[]
  tripVolume: number
  onTimePickupRate: number // -1 to 1 scale
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
}

export interface Review {
  id: string
  partnerId: string
  rating: number
  comment: string
  sentiment: "positive" | "neutral" | "negative"
  date: string
  tripId: string
}

export interface FairnessMetric {
  demographic: string
  averageScore: number
  count: number
  bias: number // -1 to 1, where 0 is no bias
}

// Generate realistic mock data for reviews
export const mockReviews: Review[] = [
  {
    id: "r1",
    partnerId: "p1",
    rating: 5,
    comment: "Excellent driver, very professional and on time!",
    sentiment: "positive",
    date: "2024-01-10",
    tripId: "t1",
  },
  {
    id: "r2",
    partnerId: "p1",
    rating: 5,
    comment: "Great experience, clean car and friendly service.",
    sentiment: "positive",
    date: "2024-01-08",
    tripId: "t2",
  },
  {
    id: "r3",
    partnerId: "p2",
    rating: 4,
    comment: "Good ride, but arrived a few minutes late.",
    sentiment: "neutral",
    date: "2024-01-09",
    tripId: "t3",
  },
  {
    id: "r4",
    partnerId: "p4",
    rating: 3,
    comment: "Driver seemed distracted and took a longer route.",
    sentiment: "negative",
    date: "2024-01-07",
    tripId: "t4",
  },
  {
    id: "r5",
    partnerId: "p5",
    rating: 4,
    comment: "Reliable service, always on time.",
    sentiment: "positive",
    date: "2024-01-11",
    tripId: "t5",
  },
  {
    id: "r6",
    partnerId: "p6",
    rating: 2,
    comment: "Vehicle was not clean, and driver was rude.",
    sentiment: "negative",
    date: "2024-01-06",
    tripId: "t6",
  },
  {
    id: "r7",
    partnerId: "p7",
    rating: 5,
    comment: "Fantastic service, highly recommend!",
    sentiment: "positive",
    date: "2024-01-12",
    tripId: "t7",
  },
  {
    id: "r8",
    partnerId: "p8",
    rating: 3,
    comment: "Average trip, nothing special.",
    sentiment: "neutral",
    date: "2024-01-05",
    tripId: "t8",
  },
  {
    id: "r9",
    partnerId: "p9",
    rating: 4,
    comment: "Punctual and efficient, good experience.",
    sentiment: "positive",
    date: "2024-01-10",
    tripId: "t9",
  },
  {
    id: "r10",
    partnerId: "p10",
    rating: 1,
    comment: "Terrible service, driver cancelled last minute.",
    sentiment: "negative",
    date: "2024-01-04",
    tripId: "t10",
  },
  {
    id: "r11",
    partnerId: "p11",
    rating: 5,
    comment: "The best driver I've had, very safe and courteous.",
    sentiment: "positive",
    date: "2024-01-13",
    tripId: "t11",
  },
  {
    id: "r12",
    partnerId: "p12",
    rating: 4,
    comment: "Good overall, but the car could be cleaner.",
    sentiment: "neutral",
    date: "2024-01-07",
    tripId: "t12",
  },
  {
    id: "r13",
    partnerId: "p13",
    rating: 1,
    comment: "Unacceptable delays and poor communication.",
    sentiment: "negative",
    date: "2024-01-03",
    tripId: "t13",
  },
  {
    id: "r14",
    partnerId: "p14",
    rating: 5,
    comment: "Always a pleasant ride, very reliable.",
    sentiment: "positive",
    date: "2024-01-11",
    tripId: "t14",
  },
  {
    id: "r15",
    partnerId: "p15",
    rating: 3,
    comment: "Driver was okay, but seemed a bit tired.",
    sentiment: "neutral",
    date: "2024-01-09",
    tripId: "t15",
  },
]

// Base mock partner data without novaScore
const baseMockPartners: Omit<Partner, "novaScore">[] = [
  {
    id: "p1",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    phone: "+1-555-0101",
    earningsHistory: [2800, 3200, 2950, 3400, 3100, 2750],
    tripVolume: 156,
    onTimePickupRate: 0.92,
    leavesTaken: 2,
    medicalStability: "stable",
    vehicleCondition: 88,
    forecastedEarnings: [3200, 3350, 3100, 3450, 3300],
    riskLevel: "low",
    joinDate: "2023-01-15",
    lastActive: "2024-01-14",
    totalTrips: 1247,
    avgRating: 4.8,
    cancellationRate: 0.03,
  },
  {
    id: "p2",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "+1-555-0102",
    earningsHistory: [2100, 2400, 2200, 2600, 2300, 2150],
    tripVolume: 98,
    onTimePickupRate: 0.85,
    leavesTaken: 5,
    medicalStability: "moderate",
    vehicleCondition: 76,
    forecastedEarnings: [2300, 2450, 2200, 2500, 2400],
    riskLevel: "medium",
    joinDate: "2023-03-22",
    lastActive: "2024-01-13",
    totalTrips: 892,
    avgRating: 4.3,
    cancellationRate: 0.07,
  },
  {
    id: "p3",
    name: "James Chen",
    email: "james.chen@email.com",
    phone: "+1-555-0103",
    earningsHistory: [3500, 3800, 3650, 4000, 3750, 3600],
    tripVolume: 203,
    onTimePickupRate: 0.96,
    leavesTaken: 1,
    medicalStability: "stable",
    vehicleCondition: 94,
    forecastedEarnings: [3800, 3950, 3700, 4100, 3900],
    riskLevel: "low",
    joinDate: "2022-11-08",
    lastActive: "2024-01-14",
    totalTrips: 1856,
    avgRating: 4.9,
    cancellationRate: 0.01,
  },
  {
    id: "p4",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0104",
    earningsHistory: [1800, 1650, 1900, 1750, 1600, 1850],
    tripVolume: 67,
    onTimePickupRate: 0.73,
    leavesTaken: 8,
    medicalStability: "concerning",
    vehicleCondition: 62,
    forecastedEarnings: [1700, 1800, 1650, 1900, 1750],
    riskLevel: "high",
    joinDate: "2023-06-10",
    lastActive: "2024-01-12",
    totalTrips: 534,
    avgRating: 3.9,
    cancellationRate: 0.12,
  },
  {
    id: "p5",
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "+1-555-0105",
    earningsHistory: [2600, 2850, 2700, 2950, 2800, 2650],
    tripVolume: 134,
    onTimePickupRate: 0.88,
    leavesTaken: 3,
    medicalStability: "stable",
    vehicleCondition: 81,
    forecastedEarnings: [2750, 2900, 2650, 3000, 2850],
    riskLevel: "low",
    joinDate: "2023-02-28",
    lastActive: "2024-01-14",
    totalTrips: 1089,
    avgRating: 4.5,
    cancellationRate: 0.05,
  },
  {
    id: "p6",
    name: "Jennifer Williams",
    email: "jennifer.williams@email.com",
    phone: "+1-555-0106",
    earningsHistory: [1200, 1100, 1350, 1250, 1150, 1300],
    tripVolume: 45,
    onTimePickupRate: 0.68,
    leavesTaken: 12,
    medicalStability: "concerning",
    vehicleCondition: 54,
    forecastedEarnings: [1200, 1300, 1150, 1400, 1250],
    riskLevel: "high",
    joinDate: "2023-08-15",
    lastActive: "2024-01-11",
    totalTrips: 298,
    avgRating: 3.6,
    cancellationRate: 0.18,
  },
  {
    id: "p7",
    name: "Michael Brown",
    email: "michael.brown@email.com",
    phone: "+1-555-0107",
    earningsHistory: [3100, 3400, 3250, 3600, 3350, 3200],
    tripVolume: 178,
    onTimePickupRate: 0.94,
    leavesTaken: 2,
    medicalStability: "stable",
    vehicleCondition: 91,
    forecastedEarnings: [3400, 3550, 3300, 3700, 3500],
    riskLevel: "low",
    joinDate: "2022-12-03",
    lastActive: "2024-01-14",
    totalTrips: 1432,
    avgRating: 4.7,
    cancellationRate: 0.02,
  },
  {
    id: "p8",
    name: "Lisa Davis",
    email: "lisa.davis@email.com",
    phone: "+1-555-0108",
    earningsHistory: [1950, 2200, 2050, 2300, 2150, 2000],
    tripVolume: 89,
    onTimePickupRate: 0.79,
    leavesTaken: 6,
    medicalStability: "moderate",
    vehicleCondition: 69,
    forecastedEarnings: [2100, 2250, 2000, 2400, 2200],
    riskLevel: "medium",
    joinDate: "2023-04-18",
    lastActive: "2024-01-13",
    totalTrips: 687,
    avgRating: 4.1,
    cancellationRate: 0.09,
  },
  {
    id: "p9",
    name: "Robert Garcia",
    email: "robert.garcia@email.com",
    phone: "+1-555-0109",
    earningsHistory: [2750, 3000, 2850, 3150, 2950, 2800],
    tripVolume: 145,
    onTimePickupRate: 0.9,
    leavesTaken: 3,
    medicalStability: "stable",
    vehicleCondition: 84,
    forecastedEarnings: [2950, 3100, 2800, 3250, 3050],
    riskLevel: "low",
    joinDate: "2023-01-30",
    lastActive: "2024-01-14",
    totalTrips: 1156,
    avgRating: 4.6,
    cancellationRate: 0.04,
  },
  {
    id: "p10",
    name: "Amanda Wilson",
    email: "amanda.wilson@email.com",
    phone: "+1-555-0110",
    earningsHistory: [1600, 1450, 1750, 1550, 1400, 1650],
    tripVolume: 56,
    onTimePickupRate: 0.71,
    leavesTaken: 9,
    medicalStability: "concerning",
    vehicleCondition: 58,
    forecastedEarnings: [1500, 1600, 1450, 1700, 1550],
    riskLevel: "high",
    joinDate: "2023-07-22",
    lastActive: "2024-01-12",
    totalTrips: 423,
    avgRating: 3.8,
    cancellationRate: 0.14,
  },
  {
    id: "p11",
    name: "Kevin Martinez",
    email: "kevin.martinez@email.com",
    phone: "+1-555-0111",
    earningsHistory: [3800, 4100, 3950, 4300, 4050, 3900],
    tripVolume: 234,
    onTimePickupRate: 0.98,
    leavesTaken: 1,
    medicalStability: "stable",
    vehicleCondition: 97,
    forecastedEarnings: [4100, 4250, 4000, 4400, 4200],
    riskLevel: "low",
    joinDate: "2022-09-12",
    lastActive: "2024-01-14",
    totalTrips: 2134,
    avgRating: 4.95,
    cancellationRate: 0.005,
  },
  {
    id: "p12",
    name: "Nicole Taylor",
    email: "nicole.taylor@email.com",
    phone: "+1-555-0112",
    earningsHistory: [2300, 2550, 2400, 2700, 2500, 2350],
    tripVolume: 112,
    onTimePickupRate: 0.83,
    leavesTaken: 4,
    medicalStability: "stable",
    vehicleCondition: 78,
    forecastedEarnings: [2500, 2650, 2400, 2750, 2600],
    riskLevel: "medium",
    joinDate: "2023-02-14",
    lastActive: "2024-01-13",
    totalTrips: 934,
    avgRating: 4.4,
    cancellationRate: 0.06,
  },
  {
    id: "p13",
    name: "Christopher Lee",
    email: "christopher.lee@email.com",
    phone: "+1-555-0113",
    earningsHistory: [1000, 900, 1150, 1050, 950, 1100],
    tripVolume: 32,
    onTimePickupRate: 0.62,
    leavesTaken: 15,
    medicalStability: "concerning",
    vehicleCondition: 47,
    forecastedEarnings: [1000, 1100, 950, 1200, 1050],
    riskLevel: "high",
    joinDate: "2023-09-08",
    lastActive: "2024-01-10",
    totalTrips: 187,
    avgRating: 3.3,
    cancellationRate: 0.22,
  },
  {
    id: "p14",
    name: "Rachel Anderson",
    email: "rachel.anderson@email.com",
    phone: "+1-555-0114",
    earningsHistory: [2900, 3200, 3050, 3350, 3150, 3000],
    tripVolume: 167,
    onTimePickupRate: 0.91,
    leavesTaken: 2,
    medicalStability: "stable",
    vehicleCondition: 86,
    forecastedEarnings: [3150, 3300, 3000, 3450, 3250],
    riskLevel: "low",
    joinDate: "2022-10-25",
    lastActive: "2024-01-14",
    totalTrips: 1345,
    avgRating: 4.7,
    cancellationRate: 0.03,
  },
  {
    id: "p15",
    name: "Daniel Thomas",
    email: "daniel.thomas@email.com",
    phone: "+1-555-0115",
    earningsHistory: [2050, 2300, 2150, 2450, 2250, 2100],
    tripVolume: 95,
    onTimePickupRate: 0.81,
    leavesTaken: 5,
    medicalStability: "moderate",
    vehicleCondition: 72,
    forecastedEarnings: [2200, 2350, 2100, 2500, 2300],
    riskLevel: "medium",
    joinDate: "2023-05-03",
    lastActive: "2024-01-13",
    totalTrips: 756,
    avgRating: 4.2,
    cancellationRate: 0.08,
  },
]

// Generate mock partners with calculated novaScore
export const mockPartners: Partner[] = baseMockPartners.map((partner) => ({
  ...partner,
  novaScore: calculateNovaScore(partner as Partner, mockReviews), // Cast to Partner for calculation
}));


export const mockFairnessMetrics: FairnessMetric[] = [
  {
    demographic: "Age 18-30",
    averageScore: 682,
    count: 1847,
    bias: -0.08, // Younger drivers often face higher bias
  },
  {
    demographic: "Age 31-45",
    averageScore: 724,
    count: 2956,
    bias: 0.02, // Prime age group with slight positive bias
  },
  {
    demographic: "Age 46+",
    averageScore: 698,
    count: 1392,
    bias: -0.03, // Older drivers face some bias
  },
  {
    demographic: "Male",
    averageScore: 718,
    count: 3234,
    bias: 0.06, // Historical male bias in credit scoring
  },
  {
    demographic: "Female",
    averageScore: 689,
    count: 2961,
    bias: -0.06, // Female drivers face credit bias
  },
  {
    demographic: "Urban",
    averageScore: 731,
    count: 4156,
    bias: 0.09, // Urban areas get better scores
  },
  {
    demographic: "Suburban",
    averageScore: 687,
    count: 1439,
    bias: -0.04, // Suburban slight negative bias
  },
  {
    demographic: "Rural",
    averageScore: 663,
    count: 600,
    bias: -0.12, // Rural areas face significant bias
  },
  {
    demographic: "White",
    averageScore: 728,
    count: 3456,
    bias: 0.08, // Racial bias in credit scoring
  },
  {
    demographic: "Hispanic",
    averageScore: 681,
    count: 1234,
    bias: -0.09, // Hispanic drivers face bias
  },
  {
    demographic: "Black",
    averageScore: 672,
    count: 987,
    bias: -0.11, // Black drivers face significant bias
  },
  {
    demographic: "Asian",
    averageScore: 742,
    count: 518,
    bias: 0.04, // Asian drivers slight positive bias
  },
]

export const mockBiasTrendData = [
  { month: "Jul 2023", overall: -0.02, gender: -0.04, age: -0.03, location: -0.05, race: -0.08 },
  { month: "Aug 2023", overall: -0.03, gender: -0.05, age: -0.04, location: -0.06, race: -0.09 },
  { month: "Sep 2023", overall: -0.04, gender: -0.06, age: -0.05, location: -0.07, race: -0.1 },
  { month: "Oct 2023", overall: -0.03, gender: -0.05, age: -0.04, location: -0.06, race: -0.09 },
  { month: "Nov 2023", overall: -0.02, gender: -0.04, age: -0.03, location: -0.05, race: -0.08 },
  { month: "Dec 2023", overall: -0.01, gender: -0.03, age: -0.02, location: -0.04, race: -0.07 },
  { month: "Jan 2024", overall: -0.01, gender: -0.02, age: -0.02, location: -0.03, race: -0.06 },
]

export const implementedFairnessActions = [
  {
    id: "fa1",
    title: "Enhanced Data Collection",
    description: "Implemented additional socioeconomic factors to reduce demographic bias",
    impact: "Reduced overall bias by 15%",
    status: "completed",
    implementedDate: "2023-11-15",
  },
  {
    id: "fa2",
    title: "Algorithm Rebalancing",
    description: "Adjusted scoring weights to minimize gender and racial disparities",
    impact: "Gender bias reduced from -0.08 to -0.02",
    status: "completed",
    implementedDate: "2023-12-01",
  },
  {
    id: "fa3",
    title: "Geographic Normalization",
    description: "Applied regional economic adjustments to reduce location-based bias",
    impact: "Rural bias reduced by 23%",
    status: "completed",
    implementedDate: "2023-12-20",
  },
  {
    id: "fa4",
    title: "Continuous Monitoring System",
    description: "Deployed real-time bias detection and alerting system",
    impact: "Bias detection accuracy improved by 40%",
    status: "completed",
    implementedDate: "2024-01-05",
  },
]

// Utility functions for data processing
export const calculateSentimentDistribution = (partners: Partner[]) => {
  // Assuming novaScore is scaled from sentiment, we can reverse it for distribution
  const positive = partners.filter((p) => p.novaScore > 650).length // novaScore > 650 roughly corresponds to sentiment > 0.3
  const neutral = partners.filter((p) => p.novaScore >= 350 && p.novaScore <= 650).length // novaScore between 350 and 650 roughly corresponds to sentiment between -0.3 and 0.3
  const negative = partners.filter((p) => p.novaScore < 350).length // novaScore < 350 roughly corresponds to sentiment < -0.3

  return { positive, neutral, negative }
}

export const getScoreDistribution = (partners: Partner[]) => {
  const excellent = partners.filter((p) => p.novaScore >= 800).length
  const good = partners.filter((p) => p.novaScore >= 700 && p.novaScore < 800).length
  const fair = partners.filter((p) => p.novaScore >= 600 && p.novaScore < 700).length
  const poor = partners.filter((p) => p.novaScore < 600).length

  return { excellent, good, fair, poor }
}

export const getRiskDistribution = (partners: Partner[]) => {
  const low = partners.filter((p) => p.riskLevel === "low").length
  const medium = partners.filter((p) => p.riskLevel === "medium").length
  const high = partners.filter((p) => p.riskLevel === "high").length

  return { low, medium, high }
}