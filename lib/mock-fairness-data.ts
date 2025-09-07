import type { FairnessMetric } from "./interfaces"

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