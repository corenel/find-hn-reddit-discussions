/* Main script for the popup */

// Execute after DOM loads
document.addEventListener("DOMContentLoaded", function () {
  // Get current tab URL
  getCurrentTabUrl();

  // Set tab switching event
  setupTabSwitching();
});

// Get current tab URL
function getCurrentTabUrl() {
  const urlElement = document.getElementById("current-url");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs && tabs.length > 0) {
      const currentUrl = tabs[0].url;
      urlElement.textContent = truncateUrl(currentUrl);
      urlElement.title = currentUrl;

      // After getting the URL, fetch related discussions
      fetchHackerNewsDiscussions(currentUrl);
      fetchRedditDiscussions(currentUrl);
    } else {
      urlElement.textContent = "Cannot get current page URL";
    }
  });
}

// Truncate URL to fit display
function truncateUrl(url) {
  const maxLength = 50;
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
}

// Set tab switching
function setupTabSwitching() {
  const hnTab = document.getElementById("hn-tab");
  const redditTab = document.getElementById("reddit-tab");
  const hnContent = document.getElementById("hn-content");
  const redditContent = document.getElementById("reddit-content");

  hnTab.addEventListener("click", function () {
    hnTab.classList.add("active");
    redditTab.classList.remove("active");
    hnContent.classList.add("active");
    redditContent.classList.remove("active");
  });

  redditTab.addEventListener("click", function () {
    redditTab.classList.add("active");
    hnTab.classList.remove("active");
    redditContent.classList.add("active");
    hnContent.classList.remove("active");
  });
}

// Fetch Hacker News discussions
function fetchHackerNewsDiscussions(url) {
  const hnLoading = document.getElementById("hn-loading");
  const hnResults = document.getElementById("hn-results");
  const hnError = document.getElementById("hn-error");

  hnLoading.style.display = "block";
  hnResults.style.display = "none";
  hnError.style.display = "none";

  // Extract domain and path for better search results
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const searchQuery =
    domain + (urlObj.pathname !== "/" ? " " + urlObj.pathname : "");

  // Use Algolia API to fetch related discussions
  const algoliaUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
    searchQuery
  )}&restrictSearchableAttributes=url`;

  fetch(algoliaUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Hacker News API request failed");
      }
      return response.json();
    })
    .then((data) => {
      hnLoading.style.display = "none";

      if (data.hits && data.hits.length > 0) {
        // Filter results, only keep discussions related to the current URL
        const relevantHits = data.hits.filter((hit) => {
          if (!hit.url) return false;
          try {
            const hitUrl = new URL(hit.url);
            return hitUrl.hostname === domain;
          } catch (e) {
            return false;
          }
        });

        if (relevantHits.length > 0) {
          hnResults.style.display = "block";

          // Sort by comment count
          relevantHits.sort(
            (a, b) => (b.num_comments || 0) - (a.num_comments || 0)
          );

          // Show top 5 results
          const maxResults = Math.min(5, relevantHits.length);
          for (let i = 0; i < maxResults; i++) {
            const hit = relevantHits[i];
            const hnItemUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
            const discussionItem = createDiscussionItem(
              hit.title || "No title",
              hnItemUrl,
              hit.points,
              hit.num_comments,
              hit.created_at_i
            );
            hnResults.appendChild(discussionItem);
          }
        } else {
          showError(hnError, "No related discussions found");
        }
      } else {
        showError(hnError, "No related discussions found");
      }
    })
    .catch((error) => {
      hnLoading.style.display = "none";
      showError(hnError, "Query failed: " + error.message);
    });
}

// Fetch Reddit discussions
function fetchRedditDiscussions(url) {
  const redditLoading = document.getElementById("reddit-loading");
  const redditResults = document.getElementById("reddit-results");
  const redditError = document.getElementById("reddit-error");

  redditLoading.style.display = "block";
  redditResults.style.display = "none";
  redditError.style.display = "none";

  // Extract domain for better search results
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  // Use Reddit search API to query related discussions
  const redditUrl = `https://www.reddit.com/search.json?q=url:${encodeURIComponent(
    domain
  )}&sort=relevance&t=all&limit=10`;

  fetch(redditUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Reddit API request failed");
      }
      return response.json();
    })
    .then((data) => {
      redditLoading.style.display = "none";

      if (data.data && data.data.children && data.data.children.length > 0) {
        redditResults.style.display = "block";

        // Sort by comment count
        data.data.children.sort(
          (a, b) => (b.data.num_comments || 0) - (a.data.num_comments || 0)
        );

        // Show top 5 results
        const maxResults = Math.min(5, data.data.children.length);
        for (let i = 0; i < maxResults; i++) {
          const post = data.data.children[i].data;
          const discussionItem = createDiscussionItem(
            post.title || "No title",
            "https://www.reddit.com" + post.permalink,
            post.score,
            post.num_comments,
            post.created_utc
          );
          redditResults.appendChild(discussionItem);
        }
      } else {
        showError(redditError, "No related discussions found");
      }
    })
    .catch((error) => {
      redditLoading.style.display = "none";
      showError(redditError, "Query failed: " + error.message);
    });
}

// Create discussion item element
function createDiscussionItem(title, url, points, comments, date) {
  const item = document.createElement("div");
  item.className = "discussion-item";

  const titleElement = document.createElement("a");
  titleElement.href = url;
  titleElement.target = "_blank";
  titleElement.textContent = title;
  titleElement.className = "discussion-title";

  const metaElement = document.createElement("div");
  metaElement.className = "discussion-meta";

  if (points !== undefined) {
    const pointsSpan = document.createElement("span");
    pointsSpan.className = "points";
    pointsSpan.textContent = `${points} points`;
    metaElement.appendChild(pointsSpan);
  }

  if (comments !== undefined) {
    const commentsSpan = document.createElement("span");
    commentsSpan.className = "comments";
    commentsSpan.textContent = `${comments} comments`;
    metaElement.appendChild(commentsSpan);
  }

  if (date) {
    const dateSpan = document.createElement("span");
    dateSpan.className = "date";
    dateSpan.textContent = formatDate(date);
    metaElement.appendChild(dateSpan);
  }

  item.appendChild(titleElement);
  item.appendChild(metaElement);

  return item;
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

// Show error message
function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}
