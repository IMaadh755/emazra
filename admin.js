// admin.js

// Provided Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFwV0p9olCgNNPFDrmWdMz2RnJ0h2vqdE",
    authDomain: "foody-4f522.firebaseapp.com",
    projectId: "foody-4f522",
    storageBucket: "foody-4f522.firebasestorage.app",
    messagingSenderId: "178682861873",
    appId: "1:178682861873:web:35a5d6fa893a33c28cf810",
    measurementId: "G-P3P46QRCJY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Data Storage
let allCountries = [];
let allRestaurants = [];
let allFoods = []; // Global list for search functionality

// === DOM Elements ===
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const logoutNavItem = document.getElementById('logoutNavItem');

// Data List Containers
const foodListContainer = document.getElementById('foodListContainer');
const restaurantListContainer = document.getElementById('restaurantListContainer');
const countryListContainer = document.getElementById('countryListContainer');

// Search Elements
const foodSearchInput = document.getElementById('foodSearchInput');
const foodClearSearchBtn = document.getElementById('foodClearSearchBtn');
const restaurantSearchInput = document.getElementById('restaurantSearchInput');
const restaurantClearSearchBtn = document.getElementById('restaurantClearSearchBtn');
const countrySearchInput = document.getElementById('countrySearchInput');
const countryClearSearchBtn = document.getElementById('countryClearSearchBtn');

// Modal Elements
const foodForm = document.getElementById('foodForm');
const restaurantForm = document.getElementById('restaurantForm');
const countryForm = document.getElementById('countryForm');

// Select Elements for Foreign Keys
const foodRestaurantIdSelect = document.getElementById('foodRestaurantId');
const restaurantCountryIdSelect = document.getElementById('restaurantCountryId');


// === AUTHENTICATION LOGIC ===

auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        logoutNavItem.style.display = 'block';
        initDashboard();
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        logoutNavItem.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginError.style.display = 'none';
    } catch (error) {
        console.error("Login Failed:", error);
        loginError.textContent = `Login failed: ${error.message}`;
        loginError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Logout Failed:", error);
    }
});


// === DASHBOARD INITIALIZATION AND DATA FETCHING ===

function initDashboard() {
    // Start fetching supporting data first
    fetchCountries().then(() => {
        fetchRestaurants().then(() => {
            // Then fetch the main data
            fetchFoods();
            setupSearchListeners(); // Setup search listeners after initial data load
        }).catch(err => console.error("Error fetching restaurants:", err));
    }).catch(err => console.error("Error fetching countries:", err));

    // Setup tab change listeners to refresh data when switching
    document.getElementById('food-tab').addEventListener('click', () => { fetchFoods(); foodSearchInput.value = ''; foodClearSearchBtn.style.display = 'none'; });
    document.getElementById('restaurant-tab').addEventListener('click', () => { fetchRestaurants(); restaurantSearchInput.value = ''; restaurantClearSearchBtn.style.display = 'none'; });
    document.getElementById('country-tab').addEventListener('click', () => { fetchCountries(); countrySearchInput.value = ''; countryClearSearchBtn.style.display = 'none'; });
}

// Helper to show a simple loading message
function showLoading(container) {
    container.innerHTML = `<div class="text-center py-5 text-muted"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Loading data...</p></div>`;
}

// === SEARCH FUNCTIONALITY ===

function setupSearchListeners() {
    // --- Food Search ---
    foodSearchInput.addEventListener('input', () => filterData('foods', foodSearchInput.value));
    foodClearSearchBtn.addEventListener('click', () => {
        foodSearchInput.value = '';
        foodClearSearchBtn.style.display = 'none';
        renderFoods(allFoods);
    });

    // --- Restaurant Search ---
    restaurantSearchInput.addEventListener('input', () => filterData('restaurants', restaurantSearchInput.value));
    restaurantClearSearchBtn.addEventListener('click', () => {
        restaurantSearchInput.value = '';
        restaurantClearSearchBtn.style.display = 'none';
        renderRestaurants(allRestaurants);
    });

    // --- Country Search ---
    countrySearchInput.addEventListener('input', () => filterData('countries', countrySearchInput.value));
    countryClearSearchBtn.addEventListener('click', () => {
        countrySearchInput.value = '';
        countryClearSearchBtn.style.display = 'none';
        renderCountries(allCountries);
    });
}

function filterData(type, searchTerm) {
    const term = searchTerm.trim().toLowerCase();
    
    // Toggle clear button visibility
    const clearBtn = document.getElementById(`${type.slice(0, -1)}ClearSearchBtn`);
    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';

    let data = [];
    let renderFunction;

    if (type === 'foods') {
        data = allFoods;
        renderFunction = renderFoods;
    } else if (type === 'restaurants') {
        data = allRestaurants;
        renderFunction = renderRestaurants;
    } else if (type === 'countries') {
        data = allCountries;
        renderFunction = renderCountries;
    }

    if (!term) {
        renderFunction(data);
        return;
    }

    const filtered = data.filter(item => {
        // Check string properties for a match
        return Object.values(item).some(value => 
            (typeof value === 'string' && value.toLowerCase().includes(term))
        );
    });

    renderFunction(filtered);
}


// --- COUNTRY CRUD ---

async function fetchCountries() {
    showLoading(countryListContainer);
    try {
        const snapshot = await db.collection("countries").get();
        allCountries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCountries(allCountries);
        populateCountrySelects(); // Update restaurant selects
    } catch (error) {
        countryListContainer.innerHTML = `<div class="alert alert-danger">Error loading countries: ${error.message}</div>`;
    }
}

function renderCountries(countries) {
    if (countries.length === 0) {
        countryListContainer.innerHTML = `<div class="alert alert-info">No countries found.</div>`;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped admin-table">
                <thead>
                    <tr>
                        <th>Flag</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    countries.forEach(country => {
        const flagUrl = `https://flagcdn.com/20x15/${country.code.toLowerCase()}.png`;
        html += `
            <tr>
                <td data-label="Flag"><img src="${flagUrl}" class="flag-icon" alt="${country.name} Flag"></td>
                <td data-label="Name">${country.name}</td>
                <td data-label="Code">${country.code}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-info" data-bs-toggle="modal" data-bs-target="#countryModal" onclick="prepareCountryModal('edit', '${country.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument('countries', '${country.id}', '${country.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    countryListContainer.innerHTML = html;
}

function prepareCountryModal(mode, id = null) {
    const modalTitle = document.getElementById('countryModalTitle');
    countryForm.reset();
    document.getElementById('countryId').value = '';

    if (mode === 'add') {
        modalTitle.textContent = 'Add New Country';
        document.getElementById('countrySubmitBtn').textContent = 'Add Country';
    } else if (mode === 'edit' && id) {
        modalTitle.textContent = 'Edit Country';
        document.getElementById('countrySubmitBtn').textContent = 'Save Changes';
        const country = allCountries.find(c => c.id === id);
        if (country) {
            document.getElementById('countryId').value = id;
            document.getElementById('countryName').value = country.name;
            document.getElementById('countryCode').value = country.code;
        }
    }
}

countryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('countryId').value;
    const data = {
        name: document.getElementById('countryName').value,
        code: document.getElementById('countryCode').value.toLowerCase(),
    };

    try {
        if (id) {
            await db.collection("countries").doc(id).update(data);
            alert('Country updated successfully!');
        } else {
            await db.collection("countries").add(data);
            alert('Country added successfully!');
        }
        bootstrap.Modal.getInstance(document.getElementById('countryModal')).hide();
        fetchCountries();
        fetchRestaurants(); // Refresh restaurants to update foreign key display
    } catch (error) {
        alert(`Failed to save country: ${error.message}`);
    }
});


// --- RESTAURANT CRUD ---

async function fetchRestaurants() {
    showLoading(restaurantListContainer);
    try {
        const snapshot = await db.collection("restaurants").get();
        allRestaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderRestaurants(allRestaurants);
        populateRestaurantSelects(); // Update food selects
    } catch (error) {
        restaurantListContainer.innerHTML = `<div class="alert alert-danger">Error loading restaurants: ${error.message}</div>`;
    }
}

function populateCountrySelects() {
    restaurantCountryIdSelect.innerHTML = '<option value="" disabled selected>Select Country</option>';
    allCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        restaurantCountryIdSelect.appendChild(option);
    });
}

function renderRestaurants(restaurants) {
    if (restaurants.length === 0) {
        restaurantListContainer.innerHTML = `<div class="alert alert-info">No restaurants found.</div>`;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Country</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    restaurants.forEach(restaurant => {
        const country = allCountries.find(c => c.id === restaurant.countryId);
        const countryName = country ? country.name : 'Unknown';
        
        html += `
            <tr>
                <td data-label="Name">${restaurant.name}</td>
                <td data-label="Location">${restaurant.location}</td>
                <td data-label="Country">${countryName}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-info" data-bs-toggle="modal" data-bs-target="#restaurantModal" onclick="prepareRestaurantModal('edit', '${restaurant.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument('restaurants', '${restaurant.id}', '${restaurant.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    restaurantListContainer.innerHTML = html;
}

function prepareRestaurantModal(mode, id = null) {
    const modalTitle = document.getElementById('restaurantModalTitle');
    restaurantForm.reset();
    document.getElementById('restaurantId').value = '';

    // Must call this first to ensure the select element has options
    populateCountrySelects(); 

    if (mode === 'add') {
        modalTitle.textContent = 'Add New Restaurant';
        document.getElementById('restaurantSubmitBtn').textContent = 'Add Restaurant';
    } else if (mode === 'edit' && id) {
        modalTitle.textContent = 'Edit Restaurant';
        document.getElementById('restaurantSubmitBtn').textContent = 'Save Changes';
        const restaurant = allRestaurants.find(r => r.id === id);
        if (restaurant) {
            document.getElementById('restaurantId').value = id;
            document.getElementById('restaurantName').value = restaurant.name;
            document.getElementById('restaurantLocation').value = restaurant.location;
            // FIX: Ensure country is pre-selected
            document.getElementById('restaurantCountryId').value = restaurant.countryId;
        }
    }
}

restaurantForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('restaurantId').value;
    const data = {
        name: document.getElementById('restaurantName').value,
        location: document.getElementById('restaurantLocation').value,
        countryId: document.getElementById('restaurantCountryId').value,
    };

    try {
        if (id) {
            await db.collection("restaurants").doc(id).update(data);
            alert('Restaurant updated successfully!');
        } else {
            await db.collection("restaurants").add(data);
            alert('Restaurant added successfully!');
        }
        bootstrap.Modal.getInstance(document.getElementById('restaurantModal')).hide();
        fetchRestaurants();
        fetchFoods(); // Refresh foods to update foreign key display
    } catch (error) {
        alert(`Failed to save restaurant: ${error.message}`);
    }
});


// --- FOOD CRUD ---

async function fetchFoods() {
    showLoading(foodListContainer);
    try {
        const snapshot = await db.collection("foods").get();
        allFoods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFoods(allFoods);
    } catch (error) {
        foodListContainer.innerHTML = `<div class="alert alert-danger">Error loading foods: ${error.message}</div>`;
    }
}

function populateRestaurantSelects() {
    foodRestaurantIdSelect.innerHTML = '<option value="" disabled selected>Select Restaurant</option>';
    allRestaurants.forEach(restaurant => {
        const option = document.createElement('option');
        option.value = restaurant.id;
        option.textContent = `${restaurant.name} (${restaurant.location})`;
        foodRestaurantIdSelect.appendChild(option);
    });
}

function renderFoods(foods) {
    if (foods.length === 0) {
        foodListContainer.innerHTML = `<div class="alert alert-info">No foods found.</div>`;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-striped admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Taste</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    foods.forEach(food => {
        const restaurant = allRestaurants.find(r => r.id === food.restaurantId);
        const restaurantName = restaurant ? restaurant.name : 'Unknown';
        
        html += `
            <tr>
                <td data-label="Name">${food.name}</td>
                <td data-label="Price">QR ${food.price?.toFixed(2) || '0.00'}</td>
                <td data-label="Category">${food.category || 'N/A'}</td>
                <td data-label="Taste">${food.taste || 'N/A'}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-info" data-bs-toggle="modal" data-bs-target="#foodModal" onclick='prepareFoodModal("edit", "${food.id}")'>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument('foods', '${food.id}', '${food.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    foodListContainer.innerHTML = html;
}


/**
 * Helper function to clean the stored rating/quantity value to match the simple 
 * string values in the dropdowns (e.g., extracts 'Dissatisfied' from '😒 Dissatisfied').
 * @param {string} storedValue The value retrieved from the database.
 * @returns {string} The cleaned word (e.g., 'Dissatisfied') or an empty string.
 */
const getCleanRatingValue = (storedValue) => {
    if (!storedValue || typeof storedValue !== 'string') return '';
    const validValues = ['Dissatisfied', 'Average', 'Good', 'Excellent'];
    
    // Find the word that is contained in the storedValue
    const foundValue = validValues.find(val => 
        storedValue.includes(val)
    );
    
    return foundValue || ''; // Return the clean word, or empty string if no match
};


function prepareFoodModal(mode, id = null) {
    const modalTitle = document.getElementById('foodModalTitle');
    foodForm.reset();
    document.getElementById('foodId').value = '';

    // Must call this first to ensure the select element has options
    populateRestaurantSelects(); 

    if (mode === 'add') {
        modalTitle.textContent = 'Add New Food';
        document.getElementById('foodSubmitBtn').textContent = 'Add Food';
    } else if (mode === 'edit' && id) {
        modalTitle.textContent = 'Edit Food';
        document.getElementById('foodSubmitBtn').textContent = 'Save Changes';
        
        const foodData = allFoods.find(f => f.id === id);
        
        if (foodData) {
            document.getElementById('foodId').value = id;
            document.getElementById('foodName').value = foodData.name || '';
            document.getElementById('foodPrice').value = foodData.price || '';
            document.getElementById('foodCategory').value = foodData.category || '';
            
            // FIX: Use the helper function to clean the data from the database 
            // before setting the select value for Taste and Quantity
            document.getElementById('foodTaste').value = getCleanRatingValue(foodData.taste);
            document.getElementById('foodQuantity').value = getCleanRatingValue(foodData.quantity);
            
            document.getElementById('foodComments').value = foodData.comments || '';
            document.getElementById('foodRestaurantId').value = foodData.restaurantId || '';
            document.getElementById('foodImageUrl').value = foodData.imageUrl || '';
        } else {
            alert(`Error: Food item with ID ${id} not found.`);
        }
    }
}

foodForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('foodId').value;
    const priceValue = parseFloat(document.getElementById('foodPrice').value);

    const data = {
        name: document.getElementById('foodName').value,
        price: isNaN(priceValue) ? 0 : priceValue,
        category: document.getElementById('foodCategory').value,
        taste: document.getElementById('foodTaste').value,
        quantity: document.getElementById('foodQuantity').value,
        comments: document.getElementById('foodComments').value,
        restaurantId: document.getElementById('foodRestaurantId').value,
        imageUrl: document.getElementById('foodImageUrl').value,
    };

    // Clean up empty strings to avoid unnecessary data in Firestore (optional but good practice)
    Object.keys(data).forEach(key => data[key] === '' && delete data[key]);

    try {
        if (id) {
            // Use update for existing documents
            await db.collection("foods").doc(id).update(data);
            alert('Food item updated successfully!');
        } else {
            // Use add for new documents
            await db.collection("foods").add(data);
            alert('Food item added successfully!');
        }
        bootstrap.Modal.getInstance(document.getElementById('foodModal')).hide();
        fetchFoods();
    } catch (error) {
        alert(`Failed to save food item: ${error.message}`);
    }
});


// --- GENERAL DELETE FUNCTION ---

async function deleteDocument(collectionName, id, name) {
    if (confirm(`Are you sure you want to delete "${name}" from ${collectionName}?`)) {
        try {
            await db.collection(collectionName).doc(id).delete();
            alert(`${name} deleted successfully!`);
            
            // Re-fetch the data for the specific tab
            if (collectionName === 'foods') fetchFoods();
            else if (collectionName === 'restaurants') fetchRestaurants();
            else if (collectionName === 'countries') fetchCountries();
            
        } catch (error) {
            alert(`Failed to delete ${name}: ${error.message}`);
        }
    }
}