document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("status");
  status.innerText = "Analyzing visible reviews…";

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(
    tab.id,
    { type: "EXTRACT_DATA" },
    (response) => {
      if (!response || !response.reviews) {
        status.innerText = "No reviews detected";
        return;
      }

      const agg = aggregateReviews(response.reviews, response.aggregate);
      const decision = getDecision(agg);

      status.innerHTML = `
        <strong>${decision.emoji} ${decision.label}</strong><br><br>

        Visible Reviews Analyzed: ${agg.sampleCount}<br>
        Total Reviews on Platform: ${agg.totalReviews ?? "Unknown"}<br>
        Avg Rating: ${agg.avgRating?.toFixed(1) ?? "N/A"}<br>
        Sampled Sentiment: ${agg.avgSentiment.toFixed(2)}<br>
        Negative Ratio (sample): ${(agg.negativeRatio * 100).toFixed(0)}%<br>
        Confidence: ${(agg.confidence * 100).toFixed(0)}%
      `;
    }
  );
});

/* ---------------- AGGREGATION ---------------- */

function aggregateReviews(reviews, aggregate) {
  const total = reviews.length;

  let sentimentSum = 0;
  let negativeCount = 0;

  reviews.forEach(r => {
    sentimentSum += r.sentimentScore;
    if (r.sentimentScore < -0.3) negativeCount++;
  });

  const avgSentiment = total ? sentimentSum / total : 0;
  const negativeRatio = total ? negativeCount / total : 0;

  const totalReviews = aggregate?.totalReviews ?? null;
  const avgRating = aggregate?.avgRating ?? null;

  const confidence = computeConfidence({
    totalReviews,
    avgRating,
    negativeRatio,
    avgSentiment
  });

  return {
    sampleCount: total,
    avgSentiment,
    negativeRatio,
    totalReviews,
    avgRating,
    confidence
  };
}

/* ---------------- CONFIDENCE LOGIC ---------------- */

function computeConfidence({
  totalReviews,
  avgRating,
  negativeRatio,
  avgSentiment
}) {
  let confidence;

  // Base confidence from TOTAL reviews (aggregate truth)
  if (!totalReviews || totalReviews < 10) confidence = 0.2;
  else if (totalReviews < 50) confidence = 0.4;
  else if (totalReviews < 500) confidence = 0.6;
  else if (totalReviews < 5000) confidence = 0.8;
  else confidence = 0.95;

  // Boosts
  if (avgRating !== null && avgRating >= 4.5) confidence += 0.05;
  if (negativeRatio < 0.1) confidence += 0.05;

  // Penalties (sample contradicts aggregate)
  if (avgSentiment < 0) confidence -= 0.1;
  if (negativeRatio > 0.3) confidence -= 0.2;

  return Math.max(0.1, Math.min(1, confidence));
}

/* ---------------- FINAL DECISION ---------------- */

function getDecision(agg) {
  if (agg.negativeRatio > 0.35) {
    return { label: "Risky Product", emoji: "❌" };
  }

  if (
    agg.avgRating !== null &&
    agg.avgRating >= 4.5 &&
    agg.avgSentiment >= 0.25 &&
    agg.confidence >= 0.6
  ) {
    return { label: "Worth Buying", emoji: "✅" };
  }

  return { label: "Mixed Reviews", emoji: "⚠️" };
}
