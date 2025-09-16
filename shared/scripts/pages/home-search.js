// Global Search Functionality with Site-wide Content Search
const SEARCH_INDEX_URL = new URL('../../search-index.json', import.meta.url);

class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('global-search');
        this.clearButton = document.getElementById('clear-search');
        this.searchResults = document.getElementById('search-results');
        this.searchResultsContent = document.getElementById('search-results-content');
        this.modulesGrid = document.getElementById('modules-grid');
        this.noResults = document.getElementById('no-results');
        this.cards = document.querySelectorAll('.hub-card');

        this.searchData = [];
        this.cardData = [];
        this.loadSearchIndex();
        this.initializeEventListeners();
        this.initializeSuggestions();
    }

    async loadSearchIndex() {
        try {
            const response = await fetch(SEARCH_INDEX_URL);
            const data = await response.json();
            this.searchData = data.searchIndex.map(item => ({
                ...item,
                searchText: `${item.title} ${item.description} ${item.keywords} ${item.content}`.toLowerCase()
            }));

            // Also build card data for local filtering
            this.cardData = this.buildCardIndex();
        } catch (error) {
            console.warn('Could not load search index, falling back to local search:', error);
            this.searchData = this.buildCardIndex();
            this.cardData = this.searchData;
        }
    }

    buildCardIndex() {
        const cardData = [];
        this.cards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            const description = card.querySelector('p').textContent;
            const keywords = card.getAttribute('data-keywords') || '';
            const url = card.getAttribute('href');

            cardData.push({
                title,
                description,
                keywords,
                url,
                element: card,
                category: this.getCategoryFromUrl(url),
                type: 'module',
                searchText: `${title} ${description} ${keywords}`.toLowerCase()
            });
        });
        return cardData;
    }

    initializeEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('focus', () => this.showSearchResults());
        this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Clear button
        this.clearButton.addEventListener('click', () => this.clearSearch());

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchResults();
                this.searchInput.blur();
            }
        });
    }

    initializeSuggestions() {
        const suggestionTags = document.querySelectorAll('.search-suggestion-tag');
        suggestionTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const searchTerm = tag.getAttribute('data-search');
                this.searchInput.value = searchTerm;
                this.handleSearch(searchTerm);
                this.searchInput.focus();
            });
        });
    }

    handleSearch(query) {
        const trimmedQuery = query.trim();

        // Show/hide clear button
        if (trimmedQuery) {
            this.clearButton.classList.add('visible');
        } else {
            this.clearButton.classList.remove('visible');
        }

        if (trimmedQuery.length === 0) {
            this.resetView();
            this.showSearchResults();
            return;
        }

        if (trimmedQuery.length < 2) {
            this.hideSearchResults();
            return;
        }

        const results = this.performSearch(trimmedQuery);
        this.displaySearchResults(results, trimmedQuery);
        this.filterCards(results, trimmedQuery);
    }

    performSearch(query) {
        const queryLower = query.toLowerCase();
        const results = [];
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

        this.searchData.forEach(item => {
            let score = 0;
            let matchedWords = 0;

            // Exact phrase match in title (highest priority)
            if (item.title.toLowerCase().includes(queryLower)) {
                score += 20;
            }

            // Individual word matches in title
            queryWords.forEach(word => {
                if (item.title.toLowerCase().includes(word)) {
                    score += 10;
                    matchedWords++;
                }
            });

            // Exact phrase match in description
            if (item.description.toLowerCase().includes(queryLower)) {
                score += 15;
            }

            // Individual word matches in description
            queryWords.forEach(word => {
                if (item.description.toLowerCase().includes(word)) {
                    score += 5;
                    matchedWords++;
                }
            });

            // Keywords match
            if (item.keywords && item.keywords.toLowerCase().includes(queryLower)) {
                score += 8;
            }

            queryWords.forEach(word => {
                if (item.keywords && item.keywords.toLowerCase().includes(word)) {
                    score += 3;
                    matchedWords++;
                }
            });

            // Content match (for detailed content)
            if (item.content && item.content.toLowerCase().includes(queryLower)) {
                score += 6;
            }

            queryWords.forEach(word => {
                if (item.content && item.content.toLowerCase().includes(word)) {
                    score += 2;
                    matchedWords++;
                }
            });

            // Fuzzy search in all text
            if (item.searchText.includes(queryLower)) {
                score += 1;
            }

            // Bonus for matching multiple words
            if (queryWords.length > 1 && matchedWords >= queryWords.length * 0.7) {
                score += 5;
            }

            // Type-based scoring adjustments
            if (item.type === 'module') score *= 1.2;
            if (item.type === 'lesson') score *= 1.1;
            if (item.type === 'prompt-category') score *= 1.15;

            if (score > 0) {
                results.push({ ...item, score, matchedWords });
            }
        });

        // Sort by relevance score, then by matched words
        return results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.matchedWords - a.matchedWords;
        });
    }

    displaySearchResults(results, query) {
        this.searchResultsContent.textContent = '';

        if (results.length === 0) {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';

            const title = document.createElement('div');
            title.className = 'search-result-title';
            title.textContent = `No results found for "${query}"`;
            resultItem.appendChild(title);

            const description = document.createElement('div');
            description.className = 'search-result-description';
            description.textContent = 'Try different keywords like "prompts", "resume", "sourcing", or "training"';
            resultItem.appendChild(description);

            this.searchResultsContent.appendChild(resultItem);
        } else {
            // Show top 8 results with better categorization
            const topResults = results.slice(0, 8);

            // Group results by type for better organization
            const groupedResults = this.groupResultsByType(topResults);
            const groupCount = Object.keys(groupedResults).length;

            Object.entries(groupedResults).forEach(([type, items]) => {
                if (items.length > 0) {
                    // Add type header for multiple types
                    if (groupCount > 1 && items.length > 1) {
                        const header = document.createElement('div');
                        header.className = 'search-result-header';

                        const headerContent = document.createElement('div');
                        headerContent.style.padding = '8px 16px';
                        headerContent.style.background = '#f8fafc';
                        headerContent.style.fontWeight = '600';
                        headerContent.style.fontSize = '12px';
                        headerContent.style.color = '#6b7280';
                        headerContent.style.textTransform = 'uppercase';
                        headerContent.textContent = this.getTypeDisplayName(type);

                        header.appendChild(headerContent);
                        this.searchResultsContent.appendChild(header);
                    }

                    items.forEach(result => {
                        const resultElement = this.createSearchResultElement(result, query);
                        this.searchResultsContent.appendChild(resultElement);
                    });
                }
            });
        }

        this.showSearchResults();
    }

    groupResultsByType(results) {
        const groups = {
            'module': [],
            'lesson': [],
            'prompt-category': [],
            'use-case': [],
            'utility': []
        };

        results.forEach(result => {
            const type = result.type || 'module';
            if (groups[type]) {
                groups[type].push(result);
            } else {
                groups['module'].push(result);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    }

    getTypeDisplayName(type) {
        const typeNames = {
            'module': 'Main Modules',
            'lesson': 'Training Lessons',
            'prompt-category': 'Prompt Categories',
            'use-case': 'Success Stories',
            'utility': 'Tools & Support'
        };
        return typeNames[type] || 'Content';
    }

    createSearchResultElement(result, query) {
        const container = document.createElement('div');
        container.className = 'search-result-item';

        const titleElement = document.createElement('div');
        titleElement.className = 'search-result-title';
        this.setHighlightedText(titleElement, result.title || '', query);
        container.appendChild(titleElement);

        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'search-result-description';
        this.setHighlightedText(descriptionElement, result.description || '', query);
        container.appendChild(descriptionElement);

        if (result.sectionTitle) {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'search-result-section';
            sectionElement.style.fontSize = '12px';
            sectionElement.style.color = '#1967d2';
            sectionElement.style.fontWeight = '500';
            sectionElement.style.marginTop = '4px';
            sectionElement.appendChild(document.createTextNode('↳ In: '));
            this.appendHighlightedText(sectionElement, result.sectionTitle, query);
            container.appendChild(sectionElement);
        }

        const metaRow = document.createElement('div');
        metaRow.style.display = 'flex';
        metaRow.style.justifyContent = 'space-between';
        metaRow.style.alignItems = 'center';
        metaRow.style.marginTop = '4px';

        const categorySpan = document.createElement('span');
        categorySpan.className = 'search-result-category';
        categorySpan.textContent = result.category || this.getCategoryFromUrl(result.url);
        metaRow.appendChild(categorySpan);

        const typeLabels = {
            'lesson': '📚 Lesson',
            'prompt-category': '🎯 Prompts',
            'use-case': '📈 Case Study'
        };

        const typeLabel = typeLabels[result.type];
        if (typeLabel) {
            const typeSpan = document.createElement('span');
            typeSpan.style.fontSize = '11px';
            typeSpan.style.color = '#9ca3af';
            typeSpan.textContent = typeLabel;
            metaRow.appendChild(typeSpan);
        }

        container.appendChild(metaRow);

        container.addEventListener('click', () => {
            this.handleResultClick(result);
        });

        return container;
    }

    setHighlightedText(element, text, query) {
        element.textContent = '';
        this.appendHighlightedText(element, text, query);
    }

    appendHighlightedText(element, text, query) {
        const fragment = this.highlightText(text, query);
        if (fragment) {
            element.appendChild(fragment);
        }
    }

    handleResultClick(result) {
        // The full implementation with smooth scrolling will be in the next step.
        // For now, this just navigates to the URL with anchor.
        const targetUrl = result.anchor ? `${result.url}#${result.anchor}` : result.url;
        window.location.href = targetUrl;
    }

    highlightText(text, query) {
        const fragment = document.createDocumentFragment();
        const safeText = typeof text === 'string' ? text : (text ?? '');

        if (!query) {
            fragment.appendChild(document.createTextNode(safeText));
            return fragment;
        }

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, 'gi');
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(safeText)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(safeText.slice(lastIndex, match.index)));
            }

            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'search-highlight';
            highlightSpan.textContent = match[0];
            fragment.appendChild(highlightSpan);

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < safeText.length) {
            fragment.appendChild(document.createTextNode(safeText.slice(lastIndex)));
        }

        if (!fragment.hasChildNodes()) {
            fragment.appendChild(document.createTextNode(safeText));
        }

        return fragment;
    }

    getCategoryFromUrl(url) {
        const categoryMap = {
            'rpo-training': 'Training Program',
            'gbs-ai-workshop': 'Leadership Workshop',
            'daily-focus': 'Daily Tools',
            'gbs-prompts': 'Prompt Library',
            'knowledge-content': 'Knowledge Base',
            'ai-sme': 'Expert Resources',
            'use-cases': 'Success Stories',
            'sourcing-workshop': 'Workshop'
        };

        for (const [key, value] of Object.entries(categoryMap)) {
            if (url.includes(key)) return value;
        }
        return 'Module';
    }

    filterCards(results, query) {
        // Get matching URLs from both site-wide results and card data
        const siteWideUrls = new Set(results.map(r => r.url));
        const cardMatchingUrls = new Set();

        // Also check card data for local matches
        this.cardData.forEach(cardItem => {
            if (cardItem.searchText.includes(query.toLowerCase())) {
                cardMatchingUrls.add(cardItem.url);
            }
        });

        // Combine both sets
        const allMatchingUrls = new Set([...siteWideUrls, ...cardMatchingUrls]);

        this.cards.forEach(card => {
            const cardUrl = card.getAttribute('href');
            const isMainModuleMatch = allMatchingUrls.has(cardUrl);
            const hasRelatedContent = results.some(r => r.url.startsWith(cardUrl));

            if (query.length === 0 || isMainModuleMatch || hasRelatedContent) {
                // Show matching cards
                card.classList.remove('filtered-out');
                if (query.length > 0) {
                    card.classList.add('highlighted');
                    // Highlight text in cards
                    this.highlightCardText(card, query);
                } else {
                    card.classList.remove('highlighted');
                    this.removeCardHighlights(card);
                }
            } else {
                // Hide non-matching cards
                card.classList.add('filtered-out');
                card.classList.remove('highlighted');
            }
        });

        // Show/hide no results message for main modules
        const hasMainModuleResults = Array.from(this.cards).some(card =>
            !card.classList.contains('filtered-out')
        );

        if (query.length > 0 && !hasMainModuleResults && results.length === 0) {
            this.noResults.classList.remove('hidden');
            this.modulesGrid.style.opacity = '0.3';
        } else {
            this.noResults.classList.add('hidden');
            this.modulesGrid.style.opacity = '1';
        }
    }

    highlightCardText(card, query) {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');

        if (title) {
            if (!title.dataset.originalText) {
                title.dataset.originalText = title.textContent || '';
            }
            this.setHighlightedText(title, title.dataset.originalText, query);
        }

        if (description) {
            if (!description.dataset.originalText) {
                description.dataset.originalText = description.textContent || '';
            }
            this.setHighlightedText(description, description.dataset.originalText, query);
        }
    }

    removeCardHighlights(card) {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');

        if (title && title.dataset.originalText) {
            title.textContent = title.dataset.originalText;
        }

        if (description && description.dataset.originalText) {
            description.textContent = description.dataset.originalText;
        }
    }

    showSearchResults() {
        this.searchResults.classList.add('visible');
    }

    hideSearchResults() {
        this.searchResults.classList.remove('visible');
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearButton.classList.remove('visible');
        this.resetView();
        this.hideSearchResults();
        this.searchInput.focus();
    }

    resetView() {
        // Reset all cards
        this.cards.forEach(card => {
            card.classList.remove('filtered-out', 'highlighted');
            this.removeCardHighlights(card);
        });

        // Hide no results
        this.noResults.classList.add('hidden');
        this.modulesGrid.style.opacity = '1';
    }

    handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstResult = this.searchResultsContent.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.click();
            }
        }
    }
}

// Global function for clear search (used by no results button)
window.clearSearch = function clearSearch() {
    if (window.globalSearch) {
        window.globalSearch.clearSearch();
    }
};

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.globalSearch = new GlobalSearch();

    // Add keyboard shortcut (Ctrl/Cmd + K)
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('global-search').focus();
        }
    });
});
