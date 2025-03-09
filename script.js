const firebaseConfig = {
    apiKey: "AIzaSyDlWQ1qYx5-owdm7YVfSnmUz443rZKwaDE",
    authDomain: "restaurant-review-35bc1.firebaseapp.com",
    databaseURL: "https://restaurant-review-35bc1-default-rtdb.firebaseio.com",
    projectId: "restaurant-review-35bc1",
    storageBucket: "restaurant-review-35bc1.firebasestorage.app",
    messagingSenderId: "794762331188",
    appId: "1:794762331188:web:9090ebf328848f2607f661",
    measurementId: "G-M0BYSP1C56"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let restaurants = [];

function init() {
    fetchRestaurants();
    setupEventListeners();
}

function fetchRestaurants() {
    database.ref('restaurants').on('value', (snapshot) => {
        restaurants = [];
        snapshot.forEach((childSnapshot) => {
            const restaurant = childSnapshot.val();
            restaurant.id = childSnapshot.key;
            restaurants.push(restaurant);
        });
        renderRestaurants();
    });
}

function renderRestaurants(filtered = restaurants) {
    const container = document.getElementById('restaurantList');
    container.innerHTML = '';
    
    filtered.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.innerHTML = `
            <div class="restaurant-header">
                <h2>${restaurant.name}</h2>
                <p>${restaurant.cuisine}</p>
            </div>
            ${renderFoodItems(restaurant.foods)}
        `;
        container.appendChild(card);
    });
}

function renderFoodItems(foods) {
    return Object.values(foods).map(food => `
        <div class="food-item">
            <h3>${food.name} - QR ${food.price}</h3>
            <div class="rating">
                <span>Quantity: ${food.quantity}</span>
                <span>Taste: ${food.taste}</span>
            </div>
            ${food.remarks ? `<p>Remarks: ${food.remarks}</p>` : ''}
        </div>
    `).join('');
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', filterRestaurants);
}

function filterRestaurants() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cuisineFilter = document.getElementById('cuisineFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;

    const filtered = restaurants.filter(restaurant => {
        const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm) ||
            Object.values(restaurant.foods).some(food => 
                food.name.toLowerCase().includes(searchTerm)
            );
        
        const matchesCuisine = !cuisineFilter || restaurant.cuisine === cuisineFilter;
        
        const matchesRating = !ratingFilter || 
            Object.values(restaurant.foods).some(food => 
                food.quantity === ratingFilter || food.taste === ratingFilter
            );
        
        return matchesSearch && matchesCuisine && matchesRating;
    });

    renderRestaurants(filtered);
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => console.log("Service Worker Registered"));
  }
  

// Initialize the app
document.addEventListener('DOMContentLoaded', init);