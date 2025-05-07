import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    onSnapshot,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    projectId: "foody-4f522",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const featuredFoods = document.getElementById('featuredFoods');
const freshFruits = document.getElementById('freshFruits');
const popularRestaurants = document.getElementById('popularRestaurants');
const categoriesGrid = document.getElementById('categoriesGrid');
const footerCategories = document.getElementById('footerCategories');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const foodCount = document.getElementById('foodCount');
const fruitCount = document.getElementById('fruitCount');
const restaurantCount = document.getElementById('restaurantCount');
const themeToggle = document.getElementById('themeToggle');

// Sample categories data (replace with your actual categories)
const foodCategories = [
    { name: "Fast Food", icon: "bi-burger", count: 24 },
    { name: "Asian", icon: "bi-noodles", count: 18 },
    { name: "Italian", icon: "bi-egg-fried", count: 15 },
    { name: "Desserts", icon: "bi-cake", count: 12 },
    { name: "Healthy", icon: "bi-apple", count: 20 },
    { name: "Beverages", icon: "bi-cup-straw", count: 8 }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedItems();
    renderCategories();
    setupEventListeners();
    animateCounters();
});

// Load featured items from Firestore
async function loadFeaturedItems() {
    try {
        const [foodsSnapshot, fruitsSnapshot, restaurantsSnapshot] = await Promise.all([
            getDocs(query(collection(db, "foods"), orderBy("rating", "desc"), limit(4))),
            getDocs(query(collection(db, "fruits"), orderBy("createdAt", "desc"), limit(4))),
            getDocs(query(collection(db, "restaurants"), orderBy("createdAt", "desc"), limit(3)))
        ]);

        renderItems(foodsSnapshot, featuredFoods, 'food');
        renderItems(fruitsSnapshot, freshFruits, 'fruit');
        renderRestaurants(restaurantsSnapshot, popularRestaurants);
        
        // Update counters
        updateCounters(foodsSnapshot.size, fruitsSnapshot.size, restaurantsSnapshot.size);
        
        // Set up real-time listeners
        setupRealtimeListeners();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Render food/fruit items
function renderItems(snapshot, container, type) {
    container.innerHTML = '';
    
    if (snapshot.empty) {
        container.innerHTML = `<div class="col-12 text-center py-4">
            <p>No ${type === 'food' ? 'foods' : 'fruits'} found</p>
        </div>`;
        return;
    }

    snapshot.forEach(doc => {
        const item = doc.data();
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-3 mb-4';
        card.innerHTML = `
            <div class="card h-100 food-card">
                <div class="card-img-container">
                    <img src="${item.image || 'images/placeholder.jpg'}" 
                         class="card-img-top" 
                         alt="${item.name}" 
                         onerror="this.src='images/placeholder.jpg'">
                    ${type === 'food' ? 
                        `<div class="rating-badge">
                            <i class="bi bi-star-fill"></i> ${item.rating || '4.0'}
                        </div>` : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text text-muted">${item.category || 'Various'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="price">QR ${item.price?.toFixed(2) || '0.00'}</span>
                        <button class="btn btn-sm btn-outline-primary">View</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render restaurants
function renderRestaurants(snapshot, container) {
    container.innerHTML = '';
    
    if (snapshot.empty) {
        container.innerHTML = `<div class="col-12 text-center py-4">
            <p>No restaurants found</p>
        </div>`;
        return;
    }

    snapshot.forEach(doc => {
        const restaurant = doc.data();
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100 restaurant-card">
                <img src="${restaurant.image || 'images/restaurant-placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${restaurant.name}"
                     onerror="this.src='images/restaurant-placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${restaurant.name}</h5>
                    <p class="card-text text-muted">
                        <i class="bi bi-geo-alt"></i> ${restaurant.location || 'Unknown location'}
                    </p>
                    <p class="cuisine-type">${restaurant.cuisine || 'Various cuisines'}</p>
                    <a href="#" class="btn btn-primary btn-sm">View Menu</a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render categories
function renderCategories() {
    categoriesGrid.innerHTML = '';
    footerCategories.innerHTML = '';
    
    foodCategories.forEach(category => {
        // Main categories grid
        const categoryCard = document.createElement('div');
        categoryCard.className = 'col-6 col-md-4 col-lg-2 mb-4';
        categoryCard.innerHTML = `
            <div class="category-card text-center p-3">
                <div class="category-icon mb-2">
                    <i class="bi ${category.icon}"></i>
                </div>
                <h6 class="category-name">${category.name}</h6>
                <small class="text-muted">${category.count} items</small>
            </div>
        `;
        categoriesGrid.appendChild(categoryCard);
        
        // Footer categories list
        const categoryItem = document.createElement('li');
        categoryItem.innerHTML = `<a href="#">${category.name}</a>`;
        footerCategories.appendChild(categoryItem);
    });
}

// Update counters with animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;
    
    counters.forEach(counter => {
        const target = +counter.innerText;
        const increment = target / speed;
        let current = 0;
        
        const updateCount = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target;
            }
        };
        
        updateCount();
    });
}

// Update counters with real data
function updateCounters(foodCountValue, fruitCountValue, restaurantCountValue) {
    foodCount.textContent = foodCountValue;
    fruitCount.textContent = fruitCountValue;
    restaurantCount.textContent = restaurantCountValue;
}

// Set up real-time listeners
function setupRealtimeListeners() {
    // Listen for food count changes
    onSnapshot(collection(db, "foods"), (snapshot) => {
        foodCount.textContent = snapshot.size;
    });
    
    // Listen for fruit count changes
    onSnapshot(collection(db, "fruits"), (snapshot) => {
        fruitCount.textContent = snapshot.size;
    });
    
    // Listen for restaurant count changes
    onSnapshot(collection(db, "restaurants"), (snapshot) => {
        restaurantCount.textContent = snapshot.size;
    });
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search functionality
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Back to top button
    window.addEventListener('scroll', toggleBackToTop);
    document.getElementById('backToTop').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Toggle between light/dark theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
        icon.classList.remove('bi-moon-stars');
        icon.classList.add('bi-sun');
    } else {
        icon.classList.remove('bi-sun');
        icon.classList.add('bi-moon-stars');
    }
}

// Perform search
function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        alert(`Searching for: ${searchTerm}`); // Replace with actual search implementation
        // You would typically filter your data here or make a Firebase query
    }
}

// Show/hide back to top button
function toggleBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
}