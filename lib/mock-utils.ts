import type { Partner } from "./interfaces"

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