import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "foody-4f522",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allRestaurants = [];
let allFruits = [];
let currentType = 'food';

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    setupMobileNavigation();
    
    // Set initial active state
    document.querySelector('[data-type="food"]').classList.add('active-mobile');
    document.body.classList.add('touch-device');
});

async function loadData() {
    try {
        const [restaurantsSnap, foodsSnap, fruitsSnap] = await Promise.all([
            getDocs(collection(db, "restaurants")),
            getDocs(collection(db, "foods")),
            getDocs(collection(db, "fruits"))
        ]);

        allRestaurants = processRestaurants(restaurantsSnap, foodsSnap);
        allFruits = processFruits(fruitsSnap);
        renderContent();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function processRestaurants(restaurantsSnap, foodsSnap) {
    const restaurants = {};

    restaurantsSnap.forEach(doc => {
        restaurants[doc.id] = {
            ...doc.data(),
            foods: [],
            totalRating: 0,
            reviewCount: 0,
            totalPrice: 0,
            priceCount: 0
        };
    });

    foodsSnap.forEach(doc => {
        const food = doc.data();
        const restaurant = restaurants[food.restaurantId];

        if (restaurant) {
            restaurant.foods.push({
                ...food,
                createdAt: food.createdAt?.toDate?.() || new Date()
            });

            restaurant.totalRating += food.rating;
            restaurant.reviewCount++;

            if (typeof food.price === 'number') {
                restaurant.totalPrice += food.price;
                restaurant.priceCount++;
            }
        }
    });

    Object.values(restaurants).forEach(restaurant => {
        restaurant.avgRating = restaurant.reviewCount > 0
            ? (restaurant.totalRating / restaurant.reviewCount).toFixed(1)
            : 0;

        restaurant.avgPrice = restaurant.priceCount > 0
            ? (restaurant.totalPrice / restaurant.priceCount).toFixed(2)
            : 0;
    });

    return Object.values(restaurants);
}

function processFruits(fruitsSnap) {
    const fruits = [];
    
    fruitsSnap.forEach(doc => {
        const fruitData = doc.data();
        fruits.push({
            id: doc.id,
            name: fruitData.name,
            price: fruitData.price,
            origin: fruitData.origin,
            season: fruitData.season,
            taste: fruitData.taste,
            quantity: fruitData.quantity,
            comments: fruitData.comments,
            createdAt: fruitData.createdAt?.toDate?.() || new Date()
        });
    });
    
    return fruits;
}

function renderContent() {
    renderRestaurants(allRestaurants);
    renderFruits(allFruits);
    applyActiveFilters();
}

function renderRestaurants(restaurants) {
    const container = document.getElementById('restaurantContainer');
    const restaurantTemplate = document.getElementById('restaurantTemplate');
    const foodItemTemplate = document.getElementById('foodItemTemplate');

    // Check if containers exist
    if (!container || !restaurantTemplate || !foodItemTemplate) {
        console.error('Required templates not found');
        return;
    }

    container.innerHTML = '';

    restaurants.forEach(restaurant => {
        const restaurantClone = restaurantTemplate.content.cloneNode(true);

        // Add null checks for all elements
        const setName = (selector, value) => {
            const el = restaurantClone.querySelector(selector);
            if (el) el.textContent = value;
        };

        setName('.restaurant-name', restaurant.name);
        setName('.location span', restaurant.location || 'N/A');
        setName('.cuisine span', restaurant.cuisine || 'N/A');
        setName('.avg-rating', restaurant.avgRating);
        setName('.review-count', restaurant.reviewCount);
        setName('.avg-price', `Avg. Price: QR ${restaurant.avgPrice}`);

        const foodContainer = restaurantClone.querySelector('.food-items-container');
        if (!foodContainer) {
            console.warn('Food container not found in template');
            return;
        }

        if (restaurant.foods.length > 0) {
            restaurant.foods.sort((a, b) => b.rating - a.rating);

            restaurant.foods.forEach(food => {
                const foodClone = foodItemTemplate.content.cloneNode(true);
                
                // Food item elements with null checks
                const setFoodValue = (selector, value) => {
                    const el = foodClone.querySelector(selector);
                    if (el) el.textContent = value;
                };

                setFoodValue('.food-name', food.name);
                setFoodValue('.food-price', `QR ${food.price?.toFixed(2) || '0.00'}`);
                setFoodValue('.rating-value', food.rating?.toFixed(1) || 'N/A');
                
                const starsEl = foodClone.querySelector('.stars');
                if (starsEl) {
                    starsEl.innerHTML = food.rating ? 
                        '★'.repeat(Math.round(food.rating)) + '☆'.repeat(5 - Math.round(food.rating)) : 
                        'N/A';
                }

                const tasteBadge = foodClone.querySelector('.taste-badge');
                if (tasteBadge) {
                    tasteBadge.textContent = food.taste || 'N/A';
                    tasteBadge.setAttribute('data-taste', food.taste || '');
                }

                const quantityBadge = foodClone.querySelector('.quantity-badge');
                if (quantityBadge) {
                    quantityBadge.textContent = food.quantity || 'N/A';
                    quantityBadge.setAttribute('data-quantity', food.quantity || '');
                }

                setFoodValue('.food-comments', food.comments || 'No comments available');
                setFoodValue('.review-date', 
                    food.createdAt?.toLocaleDateString('en-US') || 'N/A');

                foodContainer.appendChild(foodClone);
            });
        }

        container.appendChild(restaurantClone);
    });
}


function renderFruits(fruits) {
    const container = document.getElementById('fruitContainer');
    const fruitTemplate = document.getElementById('restaurantTemplate');
    const foodItemTemplate = document.getElementById('foodItemTemplate');

    if (!container || !fruitTemplate || !foodItemTemplate) {
        console.error('Fruit containers/templates not found');
        return;
    }

    container.innerHTML = '';

    // Group fruits by origin with null checks
    const groupedFruits = fruits.reduce((acc, fruit) => {
        const origin = fruit.origin || 'Unknown Origin';
        if (!acc[origin]) {
            acc[origin] = {
                name: origin,
                fruits: [],
                totalPrice: 0,
                priceCount: 0
            };
        }
        acc[origin].fruits.push(fruit);
        acc[origin].totalPrice += Number(fruit.price) || 0;
        acc[origin].priceCount++;
        return acc;
    }, {});

    Object.values(groupedFruits).forEach(originGroup => {
        const fruitClone = fruitTemplate.content.cloneNode(true);

        const setName = (selector, value) => {
            const el = fruitClone.querySelector(selector);
            if (el) el.textContent = value;
        };

        setName('.restaurant-name', originGroup.name);
        setName('.location span', `Season: ${originGroup.fruits[0]?.season || 'N/A'}`);
        setName('.cuisine span', `Total Varieties: ${originGroup.fruits.length}`);
        setName('.avg-price', 
            `Avg. Price: QR ${(originGroup.totalPrice / originGroup.priceCount).toFixed(2) || '0.00'}`);

        const foodContainer = fruitClone.querySelector('.food-items-container');
        if (!foodContainer) {
            console.warn('Food container not found in fruit template');
            return;
        }

        originGroup.fruits.forEach(fruit => {
            const fruitItemClone = foodItemTemplate.content.cloneNode(true);
            
            const setFruitValue = (selector, value) => {
                const el = fruitItemClone.querySelector(selector);
                if (el) el.textContent = value;
            };

            setFruitValue('.food-name', fruit.name);
            setFruitValue('.food-price', `QR ${fruit.price?.toFixed(2) || '0.00'}`);
            
            const tasteBadge = fruitItemClone.querySelector('.taste-badge');
            if (tasteBadge) {
                tasteBadge.textContent = fruit.taste || 'N/A';
                tasteBadge.setAttribute('data-taste', fruit.taste || '');
            }

            const quantityBadge = fruitItemClone.querySelector('.quantity-badge');
            if (quantityBadge) {
                quantityBadge.textContent = fruit.quantity || 'N/A';
                quantityBadge.setAttribute('data-quantity', fruit.quantity || '');
            }

            setFruitValue('.food-comments', fruit.comments || 'No comments available');
            setFruitValue('.review-date', 
                fruit.createdAt?.toLocaleDateString('en-US') || 'N/A');

            foodContainer.appendChild(fruitItemClone);
        });

        container.appendChild(fruitClone);
    });
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('globalSearch').addEventListener('input', function(e) {
        applyActiveFilters();
    });

    // Sort functionality
    document.getElementById('sortBy').addEventListener('change', function(e) {
        if (currentType === 'food') {
            const sorted = [...allRestaurants].sort((a, b) => {
                switch (this.value) {
                    case 'rating_desc': return b.avgRating - a.avgRating;
                    case 'rating_asc': return a.avgRating - b.avgRating;
                    case 'price_desc': return b.avgPrice - a.avgPrice;
                    case 'price_asc': return a.avgPrice - b.avgPrice;
                    default: return 0;
                }
            });
            renderRestaurants(sorted);
        }
    });

    // Taste filter
    document.querySelectorAll('.btn-taste').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-taste').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyActiveFilters();
        });
    });
}

function setupMobileEventListeners() {
    setupMobileNavigation();
    
    // Mobile search toggle
    const searchBtn = document.querySelector('.mobile-search-btn');
    const searchContainer = document.querySelector('.mobile-search-container');
    const searchCloseBtn = document.querySelector('.mobile-search-close');
    
    if (searchBtn && searchContainer && searchCloseBtn) {
        searchBtn.addEventListener('click', () => {
            searchContainer.style.display = 'flex';
            document.getElementById('mobileSearch').focus();
        });
        
        searchCloseBtn.addEventListener('click', () => {
            searchContainer.style.display = 'none';
        });
    }
}

function setupMobileNavigation() {
    // Handle both mobile and PC navigation
    document.querySelectorAll('.mobile-bottom-nav .nav-link, .pc-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            
            // Update active state for all navigation buttons
            document.querySelectorAll('.mobile-bottom-nav .nav-link, .pc-tab').forEach(b => {
                b.classList.toggle('active', b.dataset.type === type);
            });

            // Loop through all containers and show/hide based on type
            document.querySelectorAll('[data-type]').forEach(container => {
                // Only affect containers that are actual content sections (not nav buttons)
                if (container.id && container.dataset.type) {
                    container.style.display = container.dataset.type === type ? 'flex' : 'none';
                }
            });

            currentType = type;
            applyActiveFilters();
        });
    });
}


function applyActiveFilters() {
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
    const activeTaste = document.querySelector('.btn-taste.active').dataset.taste;
    const container = currentType === 'food' ? 
        document.getElementById('restaurantContainer') : 
        document.getElementById('fruitContainer');

    container.querySelectorAll('.glass-card').forEach(card => {
        const cardText = card.textContent.toLowerCase();
        const matchesSearch = cardText.includes(searchTerm);
        const hasMatchingTaste = activeTaste === 'all' || 
            Array.from(card.querySelectorAll('.taste-badge'))
                .some(badge => badge.textContent === activeTaste);

        card.style.display = (matchesSearch && hasMatchingTaste) ? 'block' : 'none';
    });
}

// Existing delete function
async function deleteFood(foodId) {
    if (confirm('Are you sure you want to delete this review?')) {
        try {
            await deleteDoc(doc(db, "foods", foodId));
            await loadData();
        } catch (error) {
            console.error("Error deleting food:", error);
            alert("Error deleting food review. Please try again.");
        }
    }
}