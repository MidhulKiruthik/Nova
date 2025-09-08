"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/hooks/use-data-store"
import { analyzeReviewSentiment } from "@/lib/nova-score-model"
import { MessageSquare } from "lucide-react"

export function PartnerSentimentList() {
  const { partners } = useDataStore()

  const partnersWithSentiment = useMemo(() => {
    return partners.map(partner => {
      let sentimentScore: number;

      if (partner.overallSentimentScore !== undefined) {
        sentimentScore = partner.overallSentimentScore;
      } else if (partner.rawReviewsText && partner.rawReviewsText.trim() !== "") {
        const comments = partner.rawReviewsText.split(';').map(s => s.trim()).filter(Boolean);
        if (comments.length > 0) {
          const totalSentiment = comments.reduce((sum, comment) => sum + analyzeReviewSentiment(comment), 0);
          sentimentScore = totalSentiment / comments.length;
        } else {
          sentimentScore = 2.5; // Default neutral if no reviews
        }
      } else {
        sentimentScore = 2.5; // Default neutral if no reviews
      }

      const getSentimentColorClass = (score: number) => {
        if (score > 3.3) return "bg-green-600 text-white";
        if (score >= 2.8 && score <= 3.3) return "bg-yellow-500 text-black";
        return "bg-red-600 text-white";
      };

      return {
        ...partner,
        calculatedSentimentScore: parseFloat(sentimentScore.toFixed(1)),
        sentimentColorClass: getSentimentColorClass(sentimentScore),
      };
    });
  }, [partners]);

  if (partners.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No partner data available to display sentiment. Please import data via Data Management.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Partner Sentiment Overview
        </CardTitle>
        <CardDescription>
          Overall sentiment scores for all partners, derived from reviews.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnersWithSentiment.map(partner => (
            <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-foreground">{partner.name}</p>
                <p className="text-sm text-muted-foreground">{partner.email}</p>
              </div>
              <Badge className={`text-lg font-bold px-3 py-1 ${partner.sentimentColorClass}`}>
                {partner.calculatedSentimentScore}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-3">Sentiment Score Legend (0-5)</h4>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-xs text-muted-foreground">Positive (&gt; 3.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs text-muted-foreground">Neutral (2.8 - 3.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-xs text-muted-foreground">Negative (&lt; 2.8)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}