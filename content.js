console.log("✅ Product Trust Analyzer content script loaded");

/* ---------------- Sentiment helpers (unchanged, proven) ---------------- */

const HINGLISH_POSITIVE = [
  "acha", "accha", "achha", "mast",
  "badhiya", "badiya", "sahi hai",
  "paisa vasool", "worth hai",
  "bahut acha", "bhut acha",
  "good hai", "nice hai"
];

const HINGLISH_NEGATIVE = [
  "bekar", "bakwas", "ghatiya",
  "faltu", "kharab", "waste",
  "paisa barbaad", "bilkul bekar"
];

const POSITIVE_WORDS = [
  "good", "great", "nice", "excellent",
  "amazing", "perfect", "love",
  "worth", "best", "buy"
];

const NEGATIVE_WORDS = [
  "bad", "poor", "worst", "hate",
  "transparent", "cheap",
  "waste", "disappointed"
];

const POSITIVE_EMOJIS = ["👍", "❤️", "😍", "😊", "😄", "😃", "🔥", "✨"];
const NEGATIVE_EMOJIS = ["👎", "😡", "😠", "😭", "😞", "😢", "💔"];

function emojiSentiment(text) {
  let score = 0;
  POSITIVE_EMOJIS.forEach(e => text.includes(e) && score++);
  NEGATIVE_EMOJIS.forEach(e => text.includes(e) && score--);
  return score;
}

function getSentimentScore(text) {
  const lower = text.toLowerCase();
  let score = 0;

  POSITIVE_WORDS.forEach(w => lower.includes(w) && score++);
  NEGATIVE_WORDS.forEach(w => lower.includes(w) && score--);

  HINGLISH_POSITIVE.forEach(w => lower.includes(w) && (score += 2));
  HINGLISH_NEGATIVE.forEach(w => lower.includes(w) && (score -= 2));

  score += emojiSentiment(text) * 2;

  score = Math.max(-4, Math.min(4, score));
  return score / 4;
}

/* ---------------- Visible reviews (SAMPLED TRUTH) ---------------- */

function extractVisibleReviews() {
  const reviews = [];
  const seen = new Set();

  // 🔹 MODE A: View-All Reviews Page (list layout)
  const listReviewCards = document.querySelectorAll(
    'div[class*="Comment__FlexRow"], div[class*="ReviewCard"]'
  );

  listReviewCards.forEach(card => {
    const textEl =
      card.querySelector('span[class*="Comment__CommentText"]') ||
      card.querySelector('div[class*="Comment__CommentText"]') ||
      card.querySelector('div');

    if (!textEl) return;

    const text = textEl.innerText?.trim();
    if (!text || text.length < 8) return;

    if (seen.has(text)) return;
    seen.add(text);

    let rating = null;
    const ratingEl = card.querySelector('span[label]');
    if (ratingEl) {
      const r = parseFloat(ratingEl.innerText);
      if (!isNaN(r)) rating = r;
    }

    reviews.push({
      text,
      rating,
      sentimentScore: getSentimentScore(text)
    });
  });

  // 🔹 MODE B: Inline / carousel reviews (fallback)
  if (reviews.length === 0) {
    const inlineTexts = document.querySelectorAll(
      'span[class*="Comment__CommentText"], div[class*="Comment__CommentText"]'
    );

    inlineTexts.forEach(el => {
      const text = el.innerText?.trim();
      if (!text || text.length < 8) return;
      if (seen.has(text)) return;

      seen.add(text);

      reviews.push({
        text,
        rating: null,
        sentimentScore: getSentimentScore(text)
      });
    });
  }

  return reviews;
}



/* ---------------- Aggregate stats (AGGREGATE TRUTH) ---------------- */

function extractAggregateStats() {
  let totalRatings = null;
  let totalReviews = null;
  let avgRating = null;
  let ratingMap = {};

  // Aggregate card
  const card = document.querySelector(
    'div[class*="CountWrapper__CountWrapperCard"]'
  );

  if (!card) {
    return { totalRatings, totalReviews, avgRating, ratingMap };
  }

  // ⭐ Average rating
  const avgRatingEl = card.querySelector(
    'div[class*="CountWrapper__AverageRating"] span'
  );
  if (avgRatingEl) {
    avgRating = parseFloat(avgRatingEl.innerText);
  }

  // 🧮 Total ratings & reviews
  const countSpans = card.querySelectorAll(
    'div[class*="CountWrapper__RatingReviewCount"] span'
  );

  countSpans.forEach(span => {
    const text = span.innerText;

    if (/Ratings/i.test(text)) {
      totalRatings = parseInt(text.replace(/[^\d]/g, ""));
    }

    if (/Reviews/i.test(text)) {
      totalReviews = parseInt(text.replace(/[^\d]/g, ""));
    }
  });

  // 📊 Rating distribution (Excellent / Good / Poor)
  const ratingRows = card.querySelectorAll(
    'div[class*="RatingMap__CountList"]'
  );

  ratingRows.forEach(row => {
    const label = row.querySelector(".rating_label span")?.innerText;
    const count = row.querySelector(".ratingCount span")?.innerText;

    if (label && count) {
      ratingMap[label.toLowerCase()] = parseInt(count.replace(/[^\d]/g, ""));
    }
  });

  return { totalRatings, totalReviews, avgRating, ratingMap };
}



/* ---------------- Message handler ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT_DATA") {
    sendResponse({
      reviews: extractVisibleReviews(),
      aggregate: extractAggregateStats()
    });
  }
});
