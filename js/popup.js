/* Main script for the popup */

// Execute after DOM loads
document.addEventListener("DOMContentLoaded", function () {
  // Get current tab URL
  getCurrentTabUrl();

  // Set tab switching event
  setupTabSwitching();

  // Setup search options
  setupRedditSearchOptions();

  // Add real-time search option updating
  setupSearchOptionsEvents();
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

  // Apply smooth switching with a small delay for animation
  hnTab.addEventListener("click", function () {
    if (!hnTab.classList.contains("active")) {
      // Switch tabs
      hnTab.classList.add("active");
      redditTab.classList.remove("active");

      // Add transition class to current active content
      if (redditContent.classList.contains("active")) {
        redditContent.classList.add("transitioning-out");
      }

      // Delay content switch slightly for animation
      setTimeout(() => {
        redditContent.classList.remove("transitioning-out");
        redditContent.classList.remove("active");
        hnContent.classList.add("active");
      }, 150);
    }
  });

  redditTab.addEventListener("click", function () {
    if (!redditTab.classList.contains("active")) {
      // Switch tabs
      redditTab.classList.add("active");
      hnTab.classList.remove("active");

      // Add transition class to current active content
      if (hnContent.classList.contains("active")) {
        hnContent.classList.add("transitioning-out");
      }

      // Delay content switch slightly for animation
      setTimeout(() => {
        hnContent.classList.remove("transitioning-out");
        hnContent.classList.remove("active");
        redditContent.classList.add("active");
      }, 150);
    }
  });
}

// Set up Reddit search options
function setupRedditSearchOptions() {
  const searchOptionsContainer = document.createElement("div");
  searchOptionsContainer.className = "search-options";

  const label = document.createElement("span");
  label.textContent = "Search by:";
  searchOptionsContainer.appendChild(label);

  // Create search option checkboxes
  const searchMethods = [
    { id: "url-search", text: "URL", checked: true },
    { id: "title-search", text: "Title", checked: false },
    { id: "domain-search", text: "Domain", checked: false },
  ];

  const optionsWrapper = document.createElement("div");
  optionsWrapper.style.display = "flex";
  optionsWrapper.style.alignItems = "center";
  optionsWrapper.style.flexWrap = "wrap";
  optionsWrapper.style.flex = "1";

  searchMethods.forEach((method) => {
    const optionLabel = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = method.id;
    checkbox.checked = method.checked;
    checkbox.dataset.method = method.text.toLowerCase();

    optionLabel.appendChild(checkbox);
    optionLabel.appendChild(document.createTextNode(" " + method.text));

    optionsWrapper.appendChild(optionLabel);
  });

  searchOptionsContainer.appendChild(optionsWrapper);

  // Insert options before the Reddit content results
  const redditContent = document.getElementById("reddit-content");
  const redditLoading = document.getElementById("reddit-loading");
  redditContent.insertBefore(searchOptionsContainer, redditLoading);
}

// Setup events for search options to update in real-time
function setupSearchOptionsEvents() {
  // Debounce function to prevent too many refreshes
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Add event listeners to checkboxes with debouncing
  document.addEventListener(
    "change",
    debounce(function (e) {
      if (
        e.target &&
        e.target.type === "checkbox" &&
        (e.target.id === "url-search" ||
          e.target.id === "title-search" ||
          e.target.id === "domain-search")
      ) {
        // Ensure at least one option is selected
        const urlSearch = document.getElementById("url-search");
        const titleSearch = document.getElementById("title-search");
        const domainSearch = document.getElementById("domain-search");

        if (
          !urlSearch.checked &&
          !titleSearch.checked &&
          !domainSearch.checked
        ) {
          // If trying to uncheck the last option, prevent it
          e.target.checked = true;

          // Show a brief tooltip/notification
          showOptionNotification(
            e.target,
            "At least one search method must be selected"
          );
        } else {
          // Refresh results when options change
          refreshRedditResults();
        }
      }
    }, 300)
  );
}

// Show a temporary notification near an element
function showOptionNotification(element, message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "absolute";
  notification.style.backgroundColor = "#333";
  notification.style.color = "white";
  notification.style.padding = "6px 10px";
  notification.style.borderRadius = "4px";
  notification.style.fontSize = "12px";
  notification.style.zIndex = "1000";
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.3s ease";
  notification.style.whiteSpace = "nowrap";
  notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";

  // Position near the checkbox
  const rect = element.getBoundingClientRect();
  document.body.appendChild(notification);

  const notifRect = notification.getBoundingClientRect();
  notification.style.top = rect.top - notifRect.height - 8 + "px";
  notification.style.left =
    rect.left + rect.width / 2 - notifRect.width / 2 + "px";

  // Show and then hide after delay
  setTimeout(() => {
    notification.style.opacity = "1";

    setTimeout(() => {
      notification.style.opacity = "0";

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }, 10);
}

// Refresh Reddit results based on current search options
function refreshRedditResults() {
  const redditResults = document.getElementById("reddit-results");

  // Clear previous results with fade out animation
  if (redditResults.style.display === "block") {
    redditResults.style.opacity = "0";
    setTimeout(() => {
      redditResults.innerHTML = "";
      redditResults.style.display = "none";
      redditResults.style.opacity = "1";

      // Get current tab URL and refresh results
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          fetchRedditDiscussions(tabs[0].url);
        }
      });
    }, 200);
  } else {
    redditResults.innerHTML = "";

    // Get current tab URL and refresh results
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        fetchRedditDiscussions(tabs[0].url);
      }
    });
  }
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
  redditResults.innerHTML = ""; // Clear previous results

  // Get search preferences
  const useUrlSearch =
    document.getElementById("url-search") &&
    document.getElementById("url-search").checked;
  const useTitleSearch =
    document.getElementById("title-search") &&
    document.getElementById("title-search").checked;
  const useDomainSearch =
    document.getElementById("domain-search") &&
    document.getElementById("domain-search").checked;

  // Start with available search method based on preferences
  if (useUrlSearch) {
    searchRedditByUrl(
      url,
      redditLoading,
      redditResults,
      redditError,
      useTitleSearch,
      useDomainSearch
    );
  } else if (useTitleSearch) {
    searchRedditByTitle(
      url,
      redditLoading,
      redditResults,
      redditError,
      useDomainSearch
    );
  } else if (useDomainSearch) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    searchRedditByDomain(
      domain,
      url,
      redditLoading,
      redditResults,
      redditError
    );
  } else {
    // No search method selected
    redditLoading.style.display = "none";
    showError(redditError, "Please select at least one search method");
  }
}

// Search Reddit by exact URL
function searchRedditByUrl(
  url,
  redditLoading,
  redditResults,
  redditError,
  useTitleSearch,
  useDomainSearch
) {
  const redditUrlSearch = `https://www.reddit.com/search.json?q=url:${encodeURIComponent(
    url
  )}&sort=relevance&t=all&limit=10`;

  fetch(redditUrlSearch)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Reddit API request failed");
      }
      return response.json();
    })
    .then((data) => {
      if (data.data && data.data.children && data.data.children.length > 0) {
        displayRedditResults(data, redditLoading, redditResults);
      } else {
        // Try next search method if enabled and no results found
        if (useTitleSearch) {
          searchRedditByTitle(
            url,
            redditLoading,
            redditResults,
            redditError,
            useDomainSearch
          );
        } else if (useDomainSearch) {
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          searchRedditByDomain(
            domain,
            url,
            redditLoading,
            redditResults,
            redditError
          );
        } else {
          // No more methods to try
          redditLoading.style.display = "none";
          showError(redditError, "No related discussions found");
        }
      }
    })
    .catch((error) => {
      // Try next search method on error
      if (useTitleSearch) {
        searchRedditByTitle(
          url,
          redditLoading,
          redditResults,
          redditError,
          useDomainSearch
        );
      } else if (useDomainSearch) {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        searchRedditByDomain(
          domain,
          url,
          redditLoading,
          redditResults,
          redditError
        );
      } else {
        redditLoading.style.display = "none";
        showError(redditError, "Query failed: " + error.message);
      }
    });
}

// Search Reddit by extracting and using page title
function searchRedditByTitle(
  url,
  redditLoading,
  redditResults,
  redditError,
  useDomainSearch
) {
  // Use the current tab info to get the page title
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs && tabs.length > 0 && tabs[0].title) {
      const pageTitle = tabs[0].title;
      const redditTitleSearch = `https://www.reddit.com/search.json?q=${encodeURIComponent(
        pageTitle
      )}&sort=relevance&t=all&limit=10`;

      fetch(redditTitleSearch)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Reddit API request failed");
          }
          return response.json();
        })
        .then((data) => {
          if (
            data.data &&
            data.data.children &&
            data.data.children.length > 0
          ) {
            displayRedditResults(data, redditLoading, redditResults);
          } else if (useDomainSearch) {
            // Try domain search if enabled and no results found
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            searchRedditByDomain(
              domain,
              url,
              redditLoading,
              redditResults,
              redditError
            );
          } else {
            // No more methods to try
            redditLoading.style.display = "none";
            showError(redditError, "No related discussions found");
          }
        })
        .catch((error) => {
          // Try domain search on error if enabled
          if (useDomainSearch) {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            searchRedditByDomain(
              domain,
              url,
              redditLoading,
              redditResults,
              redditError
            );
          } else {
            redditLoading.style.display = "none";
            showError(redditError, "Query failed: " + error.message);
          }
        });
    } else if (useDomainSearch) {
      // Cannot get title, try domain search if enabled
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      searchRedditByDomain(
        domain,
        url,
        redditLoading,
        redditResults,
        redditError
      );
    } else {
      // No title and no domain search enabled
      redditLoading.style.display = "none";
      showError(
        redditError,
        "Could not get page title and domain search is disabled"
      );
    }
  });
}

// Search Reddit by domain
function searchRedditByDomain(
  domain,
  originalUrl,
  redditLoading,
  redditResults,
  redditError
) {
  const redditDomainSearch = `https://www.reddit.com/search.json?q=url:${encodeURIComponent(
    domain
  )}&sort=relevance&t=all&limit=10`;

  fetch(redditDomainSearch)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Reddit API request failed");
      }
      return response.json();
    })
    .then((data) => {
      if (data.data && data.data.children && data.data.children.length > 0) {
        displayRedditResults(data, redditLoading, redditResults);
      } else {
        // No results found with any method
        redditLoading.style.display = "none";
        showError(redditError, "No related discussions found");
      }
    })
    .catch((error) => {
      // All search methods failed
      redditLoading.style.display = "none";
      showError(redditError, "Query failed: " + error.message);
    });
}

// Display Reddit results
function displayRedditResults(data, redditLoading, redditResults) {
  redditLoading.style.display = "none";
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
