import { getAggregatedNews } from './utils/helper.mjs';

const screenThreshold = 768;
const baseUrl = 'https://interested-cyndia-siddheshorg-cfa870e6.koyeb.app';

// Initialize the Choices.js instance
const choices = new Choices('#sources', {
    delimiter: ',',
    editItems: true,
    removeItemButton: true,
    placeholderValue: 'Select sources...',
    searchEnabled: true,  // Enables the search functionality
});

export function showKeywordInput() {
    document.getElementById('keyword-input-container').style.display = 'block';
    document.getElementById('keyword-input').focus();
}

export function addKeyword(event) {
    if (event.key === 'Enter') {
        const keywordInput = document.getElementById('keyword-input');
        const keyword = keywordInput.value.trim();
        if (keyword) {
            const keywordList = document.getElementById('keyword-list');
            const keywordItem = document.createElement('div');
            keywordItem.className = 'keyword-item';
            keywordItem.innerHTML = `
                <span>${keyword}</span>
                <button class="remove-keyword-btn" onclick="removeKeyword(this)">x</button>
            `;
            keywordList.appendChild(keywordItem);
            keywordInput.value = '';
            document.getElementById('keyword-input-container').style.display = 'none';
        }
        event.preventDefault();  // Prevent default behavior like form submission
    }
}

export function removeKeyword(button) {
    const keywordItem = button.parentNode;
    keywordItem.parentNode.removeChild(keywordItem);
}

export async function handleSubmit() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!startDate || !endDate) {
        alert("Please fill out the start date and end date");
        return;
    }
    const startDateFormatted = new Date(startDate);
    const endDateFormatted = new Date(endDate);

    // Gather keywords
    const keywordElements = document.querySelectorAll('.keyword-item span');
    const keyWords = Array.from(keywordElements).map(elem => elem.textContent);

    if (keyWords.length === 0) {
        alert('Please add at least one keyword');
        return;
    }
    else if (startDateFormatted >= endDateFormatted) {
        alert('End date should be greater than start date');
        return;
    }

    // Get Sources
    const selectedSources = choices.getValue(true);

    let endPoint = document.getElementById('endpoint').value;
    let language = document.getElementById('language').value;
    let threshold = document.getElementById('threshold').value;
    const page = 1;
    const perPage = 10;
    if (!endPoint) {
        endPoint = 'everything';
    }
    if (!language) {
        language = 'en';
    }
    if (!threshold) {
        threshold = 10;
    }
    // Create the form data object
    const formData = {
        startDateFormatted,
        endDateFormatted,
        keyWords,
        selectedSources,
        endPoint,
        language,
        threshold,
        page,
        perPage
    };

    // Call custom function and handle the response
    const response = await customFunction(formData);
    if (response.length === 0) {
        alert('No news found with the given criteria');
        return;
    }
    renderCards(response);
    // Adjust layout after cards are rendered
    const formContainer = document.querySelector('.form-container');
    const cardsContainer = document.getElementById('cards-container');

    // Reveal cards container and shift form to the left
    cardsContainer.classList.remove('hidden');
    cardsContainer.classList.add('visible');

    if (window.matchMedia(`(max-width: ${screenThreshold}px)`).matches) {
        formContainer.classList.add('hidden');
    } else {
        formContainer.style.maxWidth = '50%';
    }
}

// Example custom function that returns a list of dictionaries
async function customFunction(formData) {
    // Don't expose the base URL in the frontend
    const formattedStartDate = formData.startDateFormatted.toISOString().split('T')[0];
    const formattedEndDate = formData.endDateFormatted.toISOString().split('T')[0];
    const apiURL = `${baseUrl}/news/?startDate=${formattedStartDate}&endDate=${formattedEndDate}&endPoint=${formData.endPoint}&language=${formData.language}&threshold=${formData.threshold}&page=${formData.page}&perPage=${formData.perPage}`;
    // Example data returned (simulate your function's return)

    const aggregatedNews = await getAggregatedNews(apiURL, formData.keyWords, formData.selectedSources);
    return aggregatedNews;
}

// Fetch sources from backend and set choices as predefined tags
async function fetchSources() {
    console.log('Fetching Sources');
    try {
        const apiURL = `${baseUrl}/sources/`;
        let response = await fetch(apiURL, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        const sources = await response.json();

        // Populate Choices.js with fetched options
        choices.setChoices(sources['results'].map(source => ({
            value: source.id,
            label: source.name
        })), 'value', 'label', true);

    } catch (error) {
        console.error('Error fetching sources:', error);
    }
}

// Function to render the cards based on response data
async function renderCards(data) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Clear previous cards
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <p>Source: ${item.source.name}</p>
            <p>Published at: ${item.publishedAt}<p>
            <a href="${item.url}" target="_blank">Read More</a>
        `;
        cardsContainer.appendChild(card);
    });
}

// Fetch and populate sources on page load
fetchSources();


// the module, mjs are not automatically loaded in the browser.
// Attach the function to the global window object
window.showKeywordInput = showKeywordInput;
window.addKeyword = addKeyword;
window.removeKeyword = removeKeyword;
window.handleSubmit = handleSubmit;

