// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "foody-4f522",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const countriesContainer = document.getElementById('countriesContainer');
const categoriesContainer = document.getElementById('categoriesContainer');
const locationsContainer = document.getElementById('locationsContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Global Data
let allFoodItems = [];
let allRestaurants = [];
let allCountries = [];
let allCategories = [];

// Initialize the app
function initApp() {
    fetchAllData();
    setupEventListeners();
}

// Fetch all required data
function fetchAllData() {
    showLoading(countriesContainer);
    showLoading(categoriesContainer);
    showLoading(locationsContainer);

    // Fetch countries (existing code remains the same)
    db.collection("countries").get().then((snapshot) => {
        allCountries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCountries(allCountries);
    }).catch((error) => {
        showError(countriesContainer, "Failed to load countries");
    });

    // Fetch restaurants (existing code remains the same)
    db.collection("restaurants").get().then((snapshot) => {
        allRestaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderLocations(getUniqueLocations(allRestaurants));
    }).catch((error) => {
        showError(locationsContainer, "Failed to load locations");
    });

    // Fetch foods (existing code remains the same)
    db.collection("foods").get().then((snapshot) => {
        allFoodItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        linkFoodsWithRestaurants();
    }).catch((error) => {
        console.error("Error loading foods:", error);
    });

    // MODIFIED: Fetch categories from food items instead of separate collection
    db.collection("foods").get().then((snapshot) => {
        const categories = new Set();
        snapshot.docs.forEach(doc => {
            const food = doc.data();
            if (food.category && food.category.trim() !== '') {
                categories.add(food.category.trim());
            }
        });
        allCategories = Array.from(categories).sort();
        renderCategories(allCategories);
    }).catch((error) => {
        console.error("Error loading categories:", error);
        // Fallback to default categories if needed
        allCategories = ['Rice', 'Noodles', 'Kottu', 'Pizza', 'Burgers', 'Salads', 'Desserts'];
        renderCategories(allCategories);
    });
}

// Link foods with their restaurant and country data
function linkFoodsWithRestaurants() {
    allFoodItems.forEach(food => {
        const restaurant = allRestaurants.find(r => r.id === food.restaurantId);
        if (restaurant) {
            food.restaurantName = restaurant.name;
            food.location = restaurant.location;
            food.restaurantData = restaurant;
            
            const country = allCountries.find(c => c.id === restaurant.countryId);
            if (country) {
                food.countryName = country.name;
                food.countryCode = country.code;
            }
        }
        
        // Ensure category exists and is properly formatted
        if (!food.category || food.category.trim() === '') {
            food.category = 'Uncategorized';
        } else {
            food.category = food.category.trim();
        }
    });
}

// Get unique locations from restaurants
function getUniqueLocations(restaurants) {
    const locations = new Set();
    restaurants.forEach(restaurant => {
        if (restaurant.location) locations.add(restaurant.location);
    });
    return Array.from(locations);
}

// Render functions
function renderCountries(countries) {
    countriesContainer.innerHTML = '';
    countries.forEach(country => {
        const countryCard = document.createElement('div');
        countryCard.className = 'country-card';
        countryCard.innerHTML = `
            <img src="https://flagcdn.com/${country.code}.svg" alt="${country.name}" class="country-flag">
            <span class="country-name">${country.name}</span>
        `;
        countryCard.addEventListener('click', () => {
            window.location.href = `results.html?country=${country.id}&name=${encodeURIComponent(country.name)}`;
        });
        countriesContainer.appendChild(countryCard);
    });
}

function renderCategories(categories) {
    categoriesContainer.innerHTML = '';
    
    // Add "All Categories" option
    const allCategoriesCard = document.createElement('div');
    allCategoriesCard.className = 'category-card';
    allCategoriesCard.innerHTML = `
        <div class="category-icon">
            <i class="fas fa-utensils"></i>
        </div>
        <span>All Categories</span>
    `;
    allCategoriesCard.addEventListener('click', () => {
        window.location.href = 'results.html?show=all';
    });
    categoriesContainer.appendChild(allCategoriesCard);

    // Add actual categories
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-icon">
                <i class="fas ${getCategoryIcon(category)}"></i>
            </div>
            <span>${category}</span>
        `;
        categoryCard.addEventListener('click', () => {
            window.location.href = `results.html?category=${encodeURIComponent(category.toLowerCase())}`;
        });
        categoriesContainer.appendChild(categoryCard);
    });
}

function renderLocations(locations) {
    locationsContainer.innerHTML = '';
    locations.forEach(location => {
        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        locationCard.innerHTML = `
            <i class="fas fa-city"></i>
            <span>${location}</span>
        `;
        locationCard.addEventListener('click', () => {
            window.location.href = `results.html?location=${encodeURIComponent(location)}`;
        });
        locationsContainer.appendChild(locationCard);
    });
}

// Results page functions
function fetchFilteredResults(filter) {
    return new Promise((resolve, reject) => {
        // First get all foods if we haven't already
        if (allFoodItems.length === 0) {
            db.collection("foods").get().then((snapshot) => {
                allFoodItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                linkFoodsWithRestaurants();
                resolve(applyFilter(filter));
            }).catch(reject);
        } else {
            resolve(applyFilter(filter));
        }
    });
}

function applyFilter(filter) {
    let filteredItems = [...allFoodItems];

    switch(filter.type) {
        case 'country':
            const restaurantsInCountry = allRestaurants.filter(
                restaurant => restaurant.countryId === filter.value
            );
            const countryRestaurantIds = restaurantsInCountry.map(r => r.id);
            filteredItems = filteredItems.filter(food => 
                countryRestaurantIds.includes(food.restaurantId)
            );
            break;

        case 'location':
            const restaurantsInLocation = allRestaurants.filter(
                restaurant => restaurant.location && 
                              restaurant.location.toLowerCase() === filter.value.toLowerCase()
            );
            const locationRestaurantIds = restaurantsInLocation.map(r => r.id);
            filteredItems = filteredItems.filter(food => 
                locationRestaurantIds.includes(food.restaurantId)
            );
            break;

        case 'category':
            filteredItems = filteredItems.filter(food => 
                food.category && 
                food.category.toLowerCase() === filter.value.toLowerCase()
            );
            break;

        case 'search':
            const searchTerm = filter.value.toLowerCase();
            filteredItems = filteredItems.filter(food => 
                food.name.toLowerCase().includes(searchTerm) ||
                (food.restaurantName && food.restaurantName.toLowerCase().includes(searchTerm)) ||
                (food.comments && food.comments.toLowerCase().includes(searchTerm))
            );
            break;

        case 'all':
        default:
            // Return all items
            break;
    }

    return filteredItems;
}


function groupItemsByRestaurant(items) {
    const grouped = {};
    
    items.forEach(item => {
        // Get restaurant details or use defaults
        const restaurant = allRestaurants.find(r => r.id === item.restaurantId) || {};
        const country = allCountries.find(c => c.id === restaurant.countryId) || {};
        
        const restaurantKey = restaurant.name || 'Other Restaurants';
        const location = restaurant.location || 'Unknown Location';
        const countryName = country.name || '';
        const countryCode = country.code || '';
        
        if (!grouped[restaurantKey]) {
            grouped[restaurantKey] = {
                name: restaurantKey,
                location: location,
                country: countryName,
                countryCode: countryCode,
                items: []
            };
        }
        grouped[restaurantKey].items.push(item);
    });
    
    return grouped;
}

function createRestaurantCard(group) {
    const restaurantCard = document.createElement('div');
    restaurantCard.className = 'restaurant-group';
    
    // Header
    const header = document.createElement('div');
    header.className = 'restaurant-header';
    header.innerHTML = `
        <div>
            <div class="restaurant-name">${group.name}</div>
            <div class="restaurant-location">
                <i class="fas fa-map-marker-alt"></i>
                ${group.location || 'Unknown Location'}
                ${group.countryCode ? `<img src="https://flagcdn.com/${group.countryCode}.svg" width="20" height="15">` : ''}
            </div>
        </div>
    `;
    
    // Items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'food-items show'; // Always expanded on results page
    
    // Add items
    group.items.forEach(item => {
        const itemCard = createFoodItemCard(item);
        itemsContainer.appendChild(itemCard);
    });
    
    restaurantCard.appendChild(header);
    restaurantCard.appendChild(itemsContainer);
    return restaurantCard;
}

function createFoodItemCard(item) {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
        <div class="food-content">
            <div class="food-header">
                <div class="food-name">${item.name}</div>
                <div class="food-price">QR ${item.price?.toFixed(2) || '0.00'}</div>
            </div>
            <div class="food-details">
                <div class="food-taste">
                    <i class="fas fa-star"></i>
                    ${item.taste || 'N/A'}
                </div>
                <div class="food-quantity">
                    <i class="fas fa-utensils"></i>
                    ${item.quantity || 'N/A'}
                </div>
            </div>
            ${item.comments ? `<div class="food-comment">${item.comments}</div>` : ''}
        </div>
    `;
    return card;
}

// Search functionality
function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    window.location.href = `results.html?search=${encodeURIComponent(query)}`;
}

// Helper functions
function getCategoryIcon(category) {
    const categoryLower = category.toLowerCase();
    const icons = {
        'rice': 'fa-bowl-rice',
        'noodles': 'fa-bowl-food',
        'kottu': 'fa-utensils',
        'pizza': 'fa-pizza-slice',
        'burger': 'fa-burger',
        'burgers': 'fa-burger',
        'salad': 'fa-leaf',
        'salads': 'fa-leaf',
        'dessert': 'fa-ice-cream',
        'desserts': 'fa-ice-cream',
        'cake': 'fa-cake-candles',
        'pastry': 'fa-cookie-bite',
        'fast food': 'fa-burger',
        'snack': 'fa-cookie',
        'snacks': 'fa-cookie',
        'beverage': 'fa-glass-water',
        'beverages': 'fa-glass-water',
        'drink': 'fa-mug-hot',
        'drinks': 'fa-mug-hot',
        'coffee': 'fa-mug-saucer',
        'tea': 'fa-mug-hot',
        'juice': 'fa-glass-water',
        'milkshake': 'fa-glass-water',
        'soup': 'fa-bowl-food',
        'noodle soup': 'fa-bowl-food',
        'seafood': 'fa-fish',
        'fish': 'fa-fish',
        'shrimp': 'fa-shrimp',
        'vegetarian': 'fa-carrot',
        'vegan': 'fa-leaf',
        'meat': 'fa-drumstick-bite',
        'chicken': 'fa-drumstick-bite',
        'beef': 'fa-drumstick-bite',
        'mutton': 'fa-drumstick-bite',
        'egg': 'fa-egg',
        'breakfast': 'fa-egg',
        'lunch': 'fa-utensils',
        'dinner': 'fa-moon',
        'fruit': 'fa-apple-whole',
        'fruits': 'fa-apple-whole',
        'apple': 'fa-apple-whole',
        'banana': 'fa-lemon',
        'orange': 'fa-lemon',
        'grape': 'fa-lemon',
        'spicy': 'fa-pepper-hot',
        'street food': 'fa-store',
        'grill': 'fa-fire-burner',
        'bbq': 'fa-fire-burner',
        'barbecue': 'fa-fire-burner',
        'wrap': 'fa-burrito',
        'shawarma': 'fa-burrito',
        'sandwich': 'fa-sandwich',
        'sub': 'fa-sandwich',
        'taco': 'fa-taco',
        'burrito': 'fa-burrito',
        'pasta': 'fa-bowl-food',
        'spaghetti': 'fa-bowl-food',
        'rice and curry': 'fa-bowl-rice',
        'curry': 'fa-bowl-rice',
        'dumpling': 'fa-bowl-food',
        'sushi': 'fa-fish',
        'ramen': 'fa-bowl-food'
    };

    // Exact match
    if (icons[categoryLower]) {
        return icons[categoryLower];
    }

    // Partial match
    for (const key in icons) {
        if (categoryLower.includes(key)) {
            return icons[key];
        }
    }

    // Default icon
    return 'fa-utensils';
}


function showLoading(container, message = '') {
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            ${message ? `<p class="mt-2">${message}</p>` : ''}
        </div>
    `;
}

function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-utensils"></i>
            <p>${message}</p>
        </div>
    `;
}

function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// Initialize the app
if (document.getElementById('countriesContainer')) {
    document.addEventListener('DOMContentLoaded', initApp);
}
