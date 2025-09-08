"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Partner, Review } from "@/lib/interfaces"
import { useDataStore } from "@/hooks/use-data-store"
import { analyzeReviewSentiment, mapScoreToCategoricalSentiment } from "@/lib/nova-score-model" // Import sentiment analysis and mapping

interface SentimentHeatmapProps {
  partner: Partner | null // Now accepts a single partner or null
}

interface ReviewCellData {
  id: string
  comment: string
  sentimentScore: number // Numerical score (0-5) for coloring/intensity
  categoricalSentiment: "positive" | "neutral" | "negative" // Categorical sentiment for labels
}

export function SentimentHeatmap({ partner }: SentimentHeatmapProps) {
  const { reviews } = useDataStore(); // Get reviews from data store

  // If no partner is selected, display a message
  if (!partner) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Please select a partner from the "Partners" tab to view their detailed sentiment heatmap.
        </CardContent>
      </Card>
    )
  }

  // Generate review cell data for the selected partner
  const reviewCells = useMemo((): ReviewCellData[] => {
    const partnerReviews = reviews.filter(r => r.partnerId === partner.id);
    
    const processReview = (review: Review): ReviewCellData => {
      const numericalScore = review.sentimentScore ?? analyzeReviewSentiment(review.comment);
      const categorical = review.sentiment ?? mapScoreToCategoricalSentiment(numericalScore);
      return {
        id: review.id,
        comment: review.comment,
        sentimentScore: numericalScore,
        categoricalSentiment: categorical,
      };
    };

    // If reviews exist in data store for this partner
    if (partnerReviews.length > 0) {
      return partnerReviews.map(processReview);
    }

    // Fallback to rawReviewsText if no reviews in data store (e.g., after initial import)
    if (partner.rawReviewsText) {
      const comments = partner.rawReviewsText.split(';').map(s => s.trim()).filter(Boolean);
      return comments.map((comment, index) => {
        const numericalScore = analyzeReviewSentiment(comment);
        const categorical = mapScoreToCategoricalSentiment(numericalScore);
        return {
          id: `${partner.id}-raw-r${index}`,
          comment: comment,
          sentimentScore: numericalScore,
          categoricalSentiment: categorical,
        };
      });
    }

    return [];
  }, [partner, reviews]);

  const getSentimentColor = (sentimentScore: number) => {
    if (sentimentScore > 3.5) return "bg-emerald-500" // Positive
    if (sentimentScore > 2.5) return "bg-emerald-400" // Slightly positive
    if (sentimentScore > 1.5) return "bg-yellow-400" // Neutral
    if (sentimentScore > 0.5) return "bg-orange-500" // Slightly negative
    return "bg-red-500" // Negative
  }

  const getSentimentIntensity = (sentimentScore: number) => {
    const intensity = Math.abs(sentimentScore - 2.5) / 2.5; // Normalize intensity from 0 (neutral) to 1 (extreme)
    if (intensity > 0.7) return "opacity-100"
    if (intensity > 0.4) return "opacity-80"
    if (intensity > 0.2) return "opacity-60"
    return "opacity-40"
  }

  const getSentimentLabel = (categoricalSentiment: "positive" | "neutral" | "negative") => {
    switch (categoricalSentiment) {
      case "positive": return "Positive";
      case "neutral": return "Neutral";
      case "negative": return "Negative";
      default: return "Unknown";
    }
  }

  // Calculate sentiment breakdown for the selected partner
  const sentimentBreakdown = useMemo(() => {
    if (reviewCells.length === 0) {
      return { positive: 0, neutral: 100, negative: 0, total: 0 };
    }

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    reviewCells.forEach(cell => {
      if (cell.categoricalSentiment === "positive") {
        positiveCount++;
      } else if (cell.categoricalSentiment === "negative") {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });

    const total = reviewCells.length;
    return {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
      total: total,
    };
  }, [reviewCells]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Sentiment Heatmap for {partner.name}</CardTitle>
          <CardDescription>
            Visual analysis of individual customer review sentiments for this partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewCells.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No reviews available for this partner.</div>
          ) : (
            <>
              {/* Heatmap Grid of Reviews */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {reviewCells.map((cell) => (
                  <div
                    key={cell.id}
                    className={`p-3 rounded-md border border-border cursor-pointer hover:scale-105 transition-transform flex flex-col justify-between ${getSentimentColor(cell.sentimentScore)} ${getSentimentIntensity(cell.sentimentScore)}`}
                    title={`Sentiment: ${getSentimentLabel(cell.categoricalSentiment)} (${cell.sentimentScore.toFixed(1)}/5)\nReview: ${cell.comment}`}
                  >
                    <p className="text-xs text-white/90 line-clamp-3">{cell.comment}</p>
                    <div className="mt-2 text-right">
                      <span className="text-xs font-medium text-white">
                        {getSentimentLabel(cell.categoricalSentiment)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-3">Sentiment Scale (0-5)</h4>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                    <span className="text-xs text-muted-foreground">Excellent (3.5+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-400 rounded"></div>
                    <span className="text-xs text-muted-foreground">Good (2.5 to 3.5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-xs text-muted-foreground">Neutral (1.5 to 2.5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-xs text-muted-foreground">Poor (0.5 to 1.5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs text-muted-foreground">Critical (0.5-)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Sentiment Breakdown</CardTitle>
            <CardDescription>Overall sentiment distribution for {partner.name}'s reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{sentimentBreakdown.positive}%</div>
                <p className="text-sm text-muted-foreground">Positive</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{sentimentBreakdown.neutral}%</div>
                <p className="text-sm text-muted-foreground">Neutral</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{sentimentBreakdown.negative}%</div>
                <p className="text-sm text-muted-foreground">Negative</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Total {sentimentBreakdown.total} reviews analyzed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Review Insights</CardTitle>
            <CardDescription>Highlights from {partner.name}'s recent feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewCells.slice(0, 3).map((cell, index) => (
                <div key={cell.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`text-xs ${getSentimentColor(cell.sentimentScore).replace('bg-', 'text-')}`}>
                      {getSentimentLabel(cell.categoricalSentiment)} ({cell.sentimentScore.toFixed(1)}/5)
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{cell.comment}</p>
                </div>
              ))}
              {reviewCells.length === 0 && (
                <p className="text-muted-foreground text-sm">No reviews to display insights.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}