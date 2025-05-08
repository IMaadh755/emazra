// Firebase configuration and imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot, 
    doc, 
    deleteDoc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";

const firebaseConfig = {
    projectId: "foody-4f522",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// DOM Elements
const totalFoodsElement = document.getElementById('totalFoods');
const totalRestaurantsElement = document.getElementById('totalRestaurants');
const totalFruitsElement = document.getElementById('totalFruits');
const recentFoodsElement = document.getElementById('recentFoods');
const recentRestaurantsElement = document.getElementById('recentRestaurants');
const foodsTableBody = document.getElementById('foodsTableBody');
const fruitsTableBody = document.getElementById('fruitsTableBody');
const restaurantsTableBody = document.getElementById('restaurantsTableBody');
const foodSearch = document.getElementById('foodSearch');

// Modal buttons
const saveFoodBtn = document.getElementById('saveFoodBtn');
const saveFruitBtn = document.getElementById('saveFruitBtn');
const saveRestaurantBtn = document.getElementById('saveRestaurantBtn');

// Restaurant dropdown
const foodRestaurantSelect = document.getElementById('foodRestaurant');

// Chart instances
let categoryChart, tasteChart;

function setupTasteSelectors() {
    const tasteSelect = document.getElementById('foodTaste');
    const quantitySelect = document.getElementById('foodQuantity');
    const customTasteContainer = document.getElementById('customTasteContainer');
    const customQuantityContainer = document.getElementById('customQuantityContainer');

    if (tasteSelect && customTasteContainer) {
        tasteSelect.addEventListener('change', function() {
            customTasteContainer.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }

    if (quantitySelect && customQuantityContainer) {
        quantitySelect.addEventListener('change', function() {
            customQuantityContainer.style.display = this.value === '⚙️ Custom' ? 'block' : 'none';
        });
    }
}
export { db };
import { initTheme } from './theme-settings.js';

// ✅ Now this can safely call the function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeTabs();
    setupFruitSelectors();
    setupTabSynchronization();
    initCharts();
    setupRealTimeListeners();
    setupEventListeners();
    loadRestaurantsForDropdown();
    setupTasteSelectors(); // Now it's safe and works correctly
    setupMobileSidebar();
    initTheme();

    // You can remove this block if it's already handled inside setupTasteSelectors()
    const quantitySelect = document.getElementById('foodQuantity');
    const customQuantityContainer = document.getElementById('customQuantityContainer');

    if (quantitySelect && customQuantityContainer) {
        quantitySelect.addEventListener('change', function() {
            customQuantityContainer.style.display =
                this.value === '⚙️ Custom' ? 'block' : 'none';
        });
    }
});


// Initialize Charts
function initCharts() {
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#7c3aed',
                        '#10b981',
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f8fafc'
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
    }

    // Taste Chart
    const tasteCtx = document.getElementById('tasteChart');
    if (tasteCtx) {
        tasteChart = new Chart(tasteCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Taste Ratings',
                    data: [],
                    backgroundColor: '#7c3aed',
                    borderWidth: 0,
                    borderRadius: 8
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });
    }
}

// Setup real-time listeners
function setupRealTimeListeners() {
    // Foods listener
    onSnapshot(collection(db, "foods"), (snapshot) => {
        totalFoodsElement.textContent = snapshot.size;
        const foods = [];
        snapshot.forEach(doc => foods.push({ id: doc.id, ...doc.data() }));
        updateCharts(foods);
        updateRecentFoods(foods);
        updateFoodsTable(foods);
    });

    // Restaurants listener
    onSnapshot(collection(db, "restaurants"), (snapshot) => {
        totalRestaurantsElement.textContent = snapshot.size;
        const restaurants = [];
        snapshot.forEach(doc => restaurants.push({ id: doc.id, ...doc.data() }));
        updateRecentRestaurants(restaurants);
        updateRestaurantsTable(restaurants);
        loadRestaurantsForDropdown();
    });

    // Fruits listener
    onSnapshot(collection(db, "fruits"), (snapshot) => {
        totalFruitsElement.textContent = snapshot.size;
        const fruits = [];
        snapshot.forEach(doc => fruits.push({ id: doc.id, ...doc.data() }));
        updateFruitsTable(fruits);
    });
}

// Update charts with data
function updateCharts(foods) {
    // Process categories
    const categories = {};
    foods.forEach(food => {
        const category = food.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + 1;
    });

    // Process taste counts
    const tasteCounts = {
        '😒 Dissatisfied': 0,
        '🤔 Average': 0,
        '🙂 Good': 0,
        '🥰 Excellent': 0
    };

    foods.forEach(food => {
        if (tasteCounts.hasOwnProperty(food.taste)) {
            tasteCounts[food.taste]++;
        }
    });

    // Update charts
    if (categoryChart) {
        categoryChart.data.labels = Object.keys(categories);
        categoryChart.data.datasets[0].data = Object.values(categories);
        categoryChart.update();
    }

    if (tasteChart) {
        tasteChart.data.labels = Object.keys(tasteCounts);
        tasteChart.data.datasets[0].data = Object.values(tasteCounts);
        tasteChart.update();
    }
}

// Update recent foods list
function updateRecentFoods(foods) {
    if (!recentFoodsElement) return;
    
    recentFoodsElement.innerHTML = '';
    
    // Sort by creation date (newest first)
    const sortedFoods = [...foods].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    
    // Take top 5
    sortedFoods.slice(0, 5).forEach(food => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <div class="recent-icon">
                <i class="bi bi-egg-fried"></i>
            </div>
            <div>
                <div class="recent-title">${food.name}</div>
                <small class="text-muted">${food.category || 'No category'} • QR ${food.price?.toFixed(2) || '0.00'}</small>
            </div>
        `;
        recentFoodsElement.appendChild(item);
    });
}

// Update recent restaurants list
function updateRecentRestaurants(restaurants) {
    if (!recentRestaurantsElement) return;

    recentRestaurantsElement.innerHTML = '';

    // Sort by creation date (newest first)
    const sortedRestaurants = [...restaurants].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

    // Take top 5
    sortedRestaurants.slice(0, 5).forEach(restaurant => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <div class="recent-icon">
                <i class="bi bi-shop"></i>
            </div>
            <div>
                <div class="recent-title">${restaurant.name}</div>
                <small class="text-muted">${restaurant.location || 'No location'}</small>
            </div>
        `;
        recentRestaurantsElement.appendChild(item);
    });
}

// Update foods table
async function updateFoodsTable(foods) {
    if (!foodsTableBody) return;
    
    // Get all countries
    const countriesSnapshot = await getDocs(collection(db, "countries"));
    const countriesMap = {};
    countriesSnapshot.forEach(doc => {
        countriesMap[doc.id] = doc.data().name;
    });

    foodsTableBody.innerHTML = '';
    const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantsMap = {};
    const restaurantCountries = {};
    restaurantsSnapshot.forEach(doc => {
        restaurantsMap[doc.id] = doc.data().name;
        restaurantCountries[doc.id] = doc.data().countryId;
    });

    foods.forEach((food) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Name">${food.name || '-'}</td>
            <td data-label="Price">QR ${(food.price || 0).toFixed(2)}</td>
            <td data-label="Restaurant">${restaurantsMap[food.restaurantId] || 'Unknown'}</td>
            <td data-label="Taste">${food.taste || '-'}</td>
            <td data-label="Country">${countriesMap[food.countryId] || 'Unknown'}</td>
            <td data-label="Quantity">${food.quantity || '-'}</td>
            <td data-label="Actions">
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editFood('${food.id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteItem('${food.id}', 'foods')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        foodsTableBody.appendChild(row);
    });
}

// Update fruits table
async function updateFruitsTable(fruits) {
    if (!fruitsTableBody) return;
    
    // Get all countries
    const countriesSnapshot = await getDocs(collection(db, "countries"));
    const countriesMap = {};
    countriesSnapshot.forEach(doc => {
        countriesMap[doc.id] = doc.data().name;
    });

    fruitsTableBody.innerHTML = '';

    fruits.forEach((fruit) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Name">${fruit.name}</td>
            <td data-label="Price">QR ${fruit.price?.toFixed(2) || '0.00'}</td>
            <td data-label="Country">${countriesMap[fruit.origin] || fruit.origin || 'Unknown'}</td>
            <td data-label="Taste">${fruit.taste}</td>
            <td data-label="Actions">
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editFruit('${fruit.id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteItem('${fruit.id}', 'fruits')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        fruitsTableBody.appendChild(row);
    });
}



// Update restaurants table
async function updateRestaurantsTable(restaurants) {
    if (!restaurantsTableBody) return;

    // Fetch country data once
    const countriesSnapshot = await getDocs(collection(db, "countries"));
    const countriesMap = {};
    countriesSnapshot.forEach(doc => {
        countriesMap[doc.id] = doc.data().name;
    });

    restaurantsTableBody.innerHTML = '';

    restaurants.forEach(restaurantItem => {
        // Handle both Firebase doc snapshots and plain JS objects
        const restaurant = restaurantItem.data ? restaurantItem.data() : restaurantItem;
        const id = restaurantItem.id || restaurant.id || '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Name">${restaurant.name}</td>
            <td data-label="Location">${restaurant.location}</td>
            <td data-label="Country">${countriesMap[restaurant.countryId] || 'Unknown'}</td>
            <td data-label="Actions">
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editRestaurant('${id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteItem('${id}', 'restaurants')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        restaurantsTableBody.appendChild(row);
    });
}


// Load restaurants for dropdown
async function loadRestaurantsForDropdown() {
    if (!foodRestaurantSelect) return;
    
    const querySnapshot = await getDocs(collection(db, "restaurants"));
    foodRestaurantSelect.innerHTML = '<option value="">Select Restaurant</option>';
    querySnapshot.forEach((doc) => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.data().name;
        foodRestaurantSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Save Food Button (fallback if form not submitted)
    if (saveFoodBtn) {
        saveFoodBtn.addEventListener('click', async function() {
            if (!validateForm('food')) return;
            await saveItem('food');
        });
    }

    // Save Fruit Button (fallback if form not submitted)
    if (saveFruitBtn) {
        saveFruitBtn.addEventListener('click', async function() {
            if (!validateForm('fruit')) return;
            await saveItem('fruit');
        });
    }

    // Save Restaurant Button (fallback if form not submitted)
    if (saveRestaurantBtn) {
        saveRestaurantBtn.addEventListener('click', async function() {
            if (!validateForm('restaurant')) return;
            await saveItem('restaurant');
        });
    }

    // Food search
    if (foodSearch) {
        foodSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = foodsTableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const name = row.cells[0].textContent.toLowerCase();
                row.style.display = name.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Form submissions with validation
    const foodForm = document.getElementById('foodForm');
    if (foodForm) {
        foodForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateForm('food')) return;
            saveItem('food');
        });
    }

    const fruitForm = document.getElementById('fruitForm');
    if (fruitForm) {
        fruitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateForm('fruit')) return;
            saveItem('fruit');
        });
    }

    const restaurantForm = document.getElementById('restaurantForm');
    if (restaurantForm) {
        restaurantForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateForm('restaurant')) return;
            saveItem('restaurant');
        });
    }
}

function validateForm(type) {
    const formData = {
        name: document.getElementById(`${type}Name`).value.trim()
    };

    if (!formData.name) {
        alert(`Please enter a ${type} name`);
        return false;
    }

    if (type === 'food') {
        const price = document.getElementById('foodPrice').value;
        if (!price || isNaN(price)) {
            alert('Please enter a valid price');
            return false;
        }

        const restaurant = document.getElementById('foodRestaurant').value;
        if (!restaurant) {
            alert('Please select a restaurant');
            return false;
        }
    }

    return true;
}



// Setup mobile sidebar
function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    // Mobile menu button toggle
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        sidebarOverlay.style.display = sidebar.classList.contains('show') ? 'block' : 'none';
    });

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        sidebarOverlay.style.display = 'none';
    });

    // Close sidebar when clicking a nav link on mobile
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('show');
                sidebarOverlay.style.display = 'none';
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('show');
            sidebarOverlay.style.display = 'none';
        }
    });
}

// Save item (food, fruit, or restaurant)
async function saveItem(type) {
    const modalId = `add${type.charAt(0).toUpperCase() + type.slice(1)}Modal`;
    const formId = `${type}Form`;
    const saveBtnId = `save${type.charAt(0).toUpperCase() + type.slice(1)}Btn`;
    
    const form = document.getElementById(formId);
    const saveBtn = document.getElementById(saveBtnId);
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    
    if (!form || !saveBtn || !modal) {
        console.error('Required elements not found');
        return;
    }

    // Initialize formData with common fields
    const formData = {
        name: getValue(`${type}Name`),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Helper function to safely get values
    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    // Add price only for food and fruit
    if (type === 'food' || type === 'fruit') {
        const priceEl = document.getElementById(`${type}Price`);
        formData.price = priceEl ? parseFloat(priceEl.value) || 0 : 0;
    }

    // Add type-specific fields
    if (type === 'food') {
        formData.price = parseFloat(document.getElementById('foodPrice').value) || 0;
        formData.restaurantId = document.getElementById('foodRestaurant').value;

        // Get the selected country from the dropdown
    const countrySelect = document.getElementById('restaurantCountry');
    if (countrySelect) {
        formData.countryId = countrySelect.value;
    }

        // Get the restaurant's country
        if (formData.restaurantId) {
            const restaurantDoc = await getDoc(doc(db, "restaurants", formData.restaurantId));
            if (restaurantDoc.exists()) {
                formData.countryId = restaurantDoc.data().countryId;
            }
        }

        const tasteSelect = document.getElementById('foodTaste');
        formData.taste = tasteSelect && tasteSelect.value === 'custom' 
            ? document.getElementById('foodCustomTaste').value.trim()
            : tasteSelect ? tasteSelect.value : '';
            
        const quantitySelect = document.getElementById('foodQuantity');
        formData.quantity = quantitySelect && quantitySelect.value === '⚙️ Custom'
            ? document.getElementById('foodCustomQuantity').value.trim()
            : quantitySelect ? quantitySelect.value : '';
            
        formData.comments = document.getElementById('foodComments').value.trim();
    }
    else if (type === 'fruit') {
        formData.origin = document.getElementById('fruitCountry').value;

        const tasteSelect = document.getElementById('fruitTaste');
        formData.taste = tasteSelect && tasteSelect.value === '⚙️ Custom'
            ? getValue('fruitCustomTaste')
            : tasteSelect ? tasteSelect.value : '';
            
        formData.comments = getValue('fruitComments');
    }
    else if (type === 'restaurant') {
        formData.location = document.getElementById('restaurantLocation').value.trim();
        formData.countryId = document.getElementById('restaurantCountry').value;
    }
    else if (type === 'country') {
        formData.name = getValue('countryName');
        formData.code = getValue('countryCode');
    }

    // Validate required fields
    if (!formData.name) {
        alert(`Please enter a ${type} name`);
        return;
    }

    try {
        if (saveBtn.dataset.docId) {
            // Update existing document
            await updateDoc(doc(db, `${type}s`, saveBtn.dataset.docId), formData);
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
        } else {
            // Add new document
            await addDoc(collection(db, `${type}s`), formData);
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
        }

        // Reset form and modal
        modal.hide();
        form.reset();
        saveBtn.textContent = `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        saveBtn.dataset.docId = '';
        document.getElementById(`${modalId}Label`).textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    } catch (error) {
        console.error(`Error saving ${type}:`, error);
        showToast(`Error saving ${type}. Please try again.`, true);
    }
}


// Add this helper function for toast notifications
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Edit food
window.editFood = async function(id) {
    try {
        const docRef = doc(db, "foods", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const food = docSnap.data();

            // Set basic fields
            document.getElementById('foodName').value = food.name || '';
            document.getElementById('foodPrice').value = food.price || '';

            // Set restaurant dropdown
            const restaurantSelect = document.getElementById('foodRestaurant');
            if (restaurantSelect) {
                restaurantSelect.value = food.restaurantId || '';

                // Load and set country if restaurant ID exists
                if (food.restaurantId) {
                    const restaurantDoc = await getDoc(doc(db, "restaurants", food.restaurantId));
                    if (restaurantDoc.exists()) {
                        const restaurant = restaurantDoc.data();
                        const countrySelect = document.getElementById('restaurantCountry');

                        // Ensure countries are loaded before setting
                        await loadCountriesForDropdowns();

                        if (countrySelect) {
                            countrySelect.value = restaurant.countryId || '';
                        }
                    }
                }
            }

            // Set cuisine if exists
            const cuisineSelect = document.getElementById('foodCuisine');
            if (cuisineSelect) {
                cuisineSelect.value = food.cuisine || '';
            }

            // Handle taste
            const tasteSelect = document.getElementById('foodTaste');
            const customTasteContainer = document.getElementById('customTasteContainer');
            const customTasteInput = document.getElementById('foodCustomTaste');

            if (tasteSelect && customTasteContainer && customTasteInput) {
                if (['😒 Dissatisfied', '🤔 Average', '🙂 Good', '🥰 Excellent'].includes(food.taste)) {
                    tasteSelect.value = food.taste;
                    customTasteContainer.style.display = 'none';
                } else {
                    tasteSelect.value = 'custom';
                    customTasteInput.value = food.taste || '';
                    customTasteContainer.style.display = 'block';
                }
            }

            // Handle quantity
            const quantitySelect = document.getElementById('foodQuantity');
            const customQuantityContainer = document.getElementById('customQuantityContainer');
            const customQuantityInput = document.getElementById('foodCustomQuantity');

            if (quantitySelect && customQuantityContainer && customQuantityInput) {
                if (['😒 Dissatisfied', '🤔 Average', '🙂 Good', '🥰 Excellent'].includes(food.quantity)) {
                    quantitySelect.value = food.quantity;
                    customQuantityContainer.style.display = 'none';
                } else {
                    quantitySelect.value = '⚙️ Custom';
                    customQuantityInput.value = food.quantity || '';
                    customQuantityContainer.style.display = 'block';
                }
            }

            // Set comments
            const commentsField = document.getElementById('foodComments');
            if (commentsField) {
                commentsField.value = food.comments || '';
            }

            // Update modal UI
            document.getElementById('addFoodModalLabel').textContent = 'Edit Food';
            const saveBtn = document.getElementById('saveFoodBtn');
            if (saveBtn) {
                saveBtn.textContent = 'Update Food';
                saveBtn.dataset.docId = id;
            }

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addFoodModal'));
            modal.show();
        } else {
            alert("Food not found!");
        }
    } catch (error) {
        console.error("Error getting food document:", error);
        alert("Error loading food data. Please try again.");
    }
};


// Edit fruit
window.editFruit = async function(id) {
    try {
        const docRef = doc(db, "fruits", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const fruit = docSnap.data();

            // Set basic fields
            document.getElementById('fruitName').value = fruit.name || '';
            document.getElementById('fruitPrice').value = fruit.price || '';
            
            // Set country dropdown (replaces origin)
            const countrySelect = document.getElementById('fruitCountry');
            if (countrySelect) {
                // Load countries if not already loaded
                if (countrySelect.options.length <= 1) {
                    await loadCountriesForDropdowns();
                }
                countrySelect.value = fruit.origin || '';
            }

            // Handle taste selection
            const tasteSelect = document.getElementById('fruitTaste');
            const customTasteContainer = document.getElementById('customFruitTasteContainer');
            const customTasteInput = document.getElementById('fruitCustomTaste');

            if (tasteSelect && customTasteContainer && customTasteInput) {
                if (['😒 Dissatisfied', '🤔 Average', '🙂 Good', '🥰 Excellent'].includes(fruit.taste)) {
                    tasteSelect.value = fruit.taste;
                    customTasteContainer.style.display = 'none';
                } else {
                    tasteSelect.value = '⚙️ Custom';
                    customTasteInput.value = fruit.taste || '';
                    customTasteContainer.style.display = 'block';
                }
            }

            // Set comments if the field exists
            const commentsField = document.getElementById('fruitComments');
            if (commentsField) {
                commentsField.value = fruit.comments || '';
            }

            // Update modal UI
            document.getElementById('addFruitModalLabel').textContent = 'Edit Fruit';
            const saveBtn = document.getElementById('saveFruitBtn');
            if (saveBtn) {
                saveBtn.textContent = 'Update Fruit';
                saveBtn.dataset.docId = id;
            }

            // Show modal with accessibility fix
            const modal = new bootstrap.Modal(document.getElementById('addFruitModal'), {
                focus: false
            });
            modal.show();
            
            // Focus on name field after modal opens
            document.getElementById('addFruitModal').addEventListener('shown.bs.modal', function() {
                document.getElementById('fruitName').focus();
            }, { once: true });
        }
    } catch (error) {
        console.error("Error editing fruit:", error);
        alert("Error loading fruit data. Please try again.");
    }
};

// Edit restaurant
window.editRestaurant = async function(id) {
    try {
        const docRef = doc(db, "restaurants", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const restaurant = docSnap.data();
            
            // Set basic fields
            document.getElementById('restaurantName').value = restaurant.name || '';
            document.getElementById('restaurantLocation').value = restaurant.location || '';
            
            // Set country dropdown
            const countrySelect = document.getElementById('restaurantCountry');
            if (countrySelect) {
                // Load countries if not already loaded
                if (countrySelect.options.length <= 1) {
                    await loadRestaurantCountries();
                }
                countrySelect.value = restaurant.countryId || '';
            }
            
            // Update modal UI
            document.getElementById('addRestaurantModalLabel').textContent = 'Edit Restaurant';
            const saveBtn = document.getElementById('saveRestaurantBtn');
            if (saveBtn) {
                saveBtn.textContent = 'Update Restaurant';
                saveBtn.dataset.docId = id;
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addRestaurantModal'));
            modal.show();
        } else {
            alert("Restaurant not found!");
        }
    } catch (error) {
        console.error("Error getting restaurant document:", error);
        alert("Error loading restaurant data. Please try again.");
    }
};

// Delete item
window.deleteItem = async function(id, collectionName) {
    if (confirm(`Are you sure you want to delete this ${collectionName.slice(0, -1)}?`)) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (error) {
            console.error("Error deleting document:", error);
            alert(`Error deleting ${collectionName.slice(0, -1)}. Please try again.`);
        }
    }
};

// Reset modals when closed
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('hidden.bs.modal', function() {
        const form = this.querySelector('form');
        if (form) form.reset();
        
        const saveBtn = this.querySelector('.btn-primary');
        if (saveBtn) {
            saveBtn.textContent = saveBtn.textContent.replace('Update', 'Save');
            saveBtn.dataset.docId = '';
        }
    });
});

// Add this in your setupEventListeners function or similar initialization code
function setupTabSynchronization() {
    // Sync active states when tabs are shown
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('href');
            
            // Remove active class from all tab links
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to all matching tab links
            document.querySelectorAll(`[data-bs-toggle="tab"][href="${targetId}"]`).forEach(link => {
                link.classList.add('active');
            });
        });
    });
}

// Add this function in your initialization code
function initializeTabs() {
    // Activate first tab by default
    const firstTabLink = document.querySelector('[data-bs-toggle="tab"]');
    if (firstTabLink) {
        new bootstrap.Tab(firstTabLink).show();
    }

    // Handle mobile bottom nav clicks
    document.querySelectorAll('.mobile-bottom-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // Hide all tabs
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Show target tab
                target.classList.add('show', 'active');
                
                // Update all nav links
                document.querySelectorAll('[data-bs-toggle="tab"]').forEach(navLink => {
                    navLink.classList.remove('active');
                    if (navLink.getAttribute('href') === this.getAttribute('href')) {
                        navLink.classList.add('active');
                    }
                });
            }
        });
    });
}



document.addEventListener('DOMContentLoaded', function() {
    const tasteSelect = document.getElementById('foodTaste');
    const quantitySelect = document.getElementById('foodQuantity');
    const customTasteContainer = document.getElementById('customTasteContainer');
    const customQuantityContainer = document.getElementById('customQuantityContainer');

    tasteSelect.addEventListener('change', function() {
        customTasteContainer.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    quantitySelect.addEventListener('change', function() {
        customQuantityContainer.style.display = this.value === '⚙️ Custom' ? 'block' : 'none';
    });
});

// Initialize fruit modal custom fields
function setupFruitSelectors() {
    const tasteSelect = document.getElementById('fruitTaste');
    const quantitySelect = document.getElementById('fruitQuantity');
    const customTasteContainer = document.getElementById('customFruitTasteContainer');
    

    if (tasteSelect && customTasteContainer) {
        tasteSelect.addEventListener('change', function() {
            customTasteContainer.style.display = this.value === '⚙️ Custom' ? 'block' : 'none';
        });
    }

    if (quantitySelect && customQuantityContainer) {
        quantitySelect.addEventListener('change', function() {
            customQuantityContainer.style.display = this.value === '⚙️ Custom' ? 'block' : 'none';
        });
    }
}

// Add to your setupRealTimeListeners
onSnapshot(collection(db, "countries"), (snapshot) => {
    updateCountriesTable(snapshot.docs);
    loadCountriesForDropdowns();
});

// New functions
if (typeof updateCountriesTable !== 'function') {
    async function updateCountriesTable(countries) {
        const tbody = document.getElementById('countriesTableBody');
        tbody.innerHTML = '';

        countries.forEach(countryDoc => {
            const country = countryDoc.data();
            const row = `
                <tr>
                    <td>${country.name}</td>
                    <td><img src="https://flagcdn.com/${country.code}.svg" width="30" height="20"></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editCountry('${countryDoc.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${countryDoc.id}', 'countries')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }
}

// Add new functions
async function loadCountriesForDropdowns() {
    const countriesSnapshot = await getDocs(collection(db, "countries"));
    
    // Update all country dropdowns
    const countrySelectors = [
        'restaurantCountry', 
        'fruitCountry'
        // add any other country dropdown IDs here
    ];
    
    countrySelectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            // Preserve current value if editing
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Country</option>';
            
            countriesSnapshot.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.data().name;
                select.appendChild(option);
            });
            
            // Restore previous value if it exists
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

function updateCountriesTable(countries) {
    const tbody = document.getElementById('countriesTableBody');
    tbody.innerHTML = '';
    
    countries.forEach(countryDoc => {
        const country = countryDoc.data();
        const row = `
            <tr>
                <td>${country.name}</td>
                <td><img src="https://flagcdn.com/${country.code}.svg" 
                       style="height: 20px; width: 30px"></td>
                
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="editCountry('${countryDoc.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="deleteItem('${countryDoc.id}', 'countries')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Helper function to load countries for restaurant dropdown
async function loadRestaurantCountries() {
    const select = document.getElementById('restaurantCountry');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Country</option>';
    
    try {
        const snapshot = await getDocs(collection(db, "countries"));
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading countries:", error);
    }
}

// Add event listener for country saving
document.getElementById('saveCountryBtn')?.addEventListener('click', async function() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('addCountryModal'));
    const isEdit = !!this.dataset.docId;
    
    // Check if country already exists
    const countryName = document.getElementById('countryName').value.trim();
    const countryCode = document.getElementById('countryCode').value.trim().toLowerCase();
    
    if (!isEdit) {
        const querySnapshot = await getDocs(query(
            collection(db, "countries"),
            where("code", "==", countryCode)
        ));
        
        if (!querySnapshot.empty) {
            alert("A country with this code already exists!");
            return;
        }
    }

    const countryData = {
        name: countryName,
        code: countryCode,
        updatedAt: new Date()
    };

    try {
        if (isEdit) {
            await updateDoc(doc(db, "countries", this.dataset.docId), countryData);
        } else {
            countryData.createdAt = new Date();
            await addDoc(collection(db, "countries"), countryData);
        }
        
        modal.hide();
        document.getElementById('countryForm').reset();
        this.textContent = 'Save Country';
        delete this.dataset.docId;
    } catch (error) {
        console.error("Error saving country:", error);
        alert("Error saving country. Please try again.");
    }
});

// Update editCountry function
window.editCountry = async function(id) {
    try {
        const docRef = doc(db, "countries", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const country = docSnap.data();
            
            // Safely set values with null checks
            const nameField = document.getElementById('countryName');
            const codeField = document.getElementById('countryCode');
            
            if (nameField) nameField.value = country.name || '';
            if (codeField) codeField.value = country.code || '';
            
            // Update modal UI
            const modalLabel = document.getElementById('addCountryModalLabel');
            const saveBtn = document.getElementById('saveCountryBtn');
            
            if (modalLabel) modalLabel.textContent = 'Edit Country';
            if (saveBtn) {
                saveBtn.textContent = 'Update Country';
                saveBtn.dataset.docId = id;
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addCountryModal'));
            modal.show();
        } else {
            alert("Country not found!");
        }
    } catch (error) {
        console.error("Error getting country document:", error);
        alert("Error loading country data. Please try again.");
    }
};

// Update saveCountryBtn event listener
document.getElementById('saveCountryBtn')?.addEventListener('click', async function() {
    const name = document.getElementById('countryName')?.value.trim();
    const code = document.getElementById('countryCode')?.value.trim().toLowerCase();
    
    if (!name || !code) {
        alert("Please fill all required fields");
        return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('addCountryModal'));
    const isEdit = !!this.dataset.docId;
    
    const countryData = {
        name: name,
        code: code,
        updatedAt: new Date()
    };

    try {
        if (isEdit) {
            await updateDoc(doc(db, "countries", this.dataset.docId), countryData);
        } else {
            countryData.createdAt = new Date();
            await addDoc(collection(db, "countries"), countryData);
        }
        
        modal.hide();
        document.getElementById('countryForm')?.reset();
        this.textContent = 'Save Country';
        delete this.dataset.docId;
    } catch (error) {
        console.error("Error saving country:", error);
        alert("Error saving country. Please try again.");
    }
});

// In your restaurant change handler:
document.getElementById('foodRestaurant')?.addEventListener('change', async function() {
    try {
        const restaurantId = this.value;
        const countrySelect = document.getElementById('restaurantCountry');
        
        if (restaurantId && countrySelect) {
            const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
            if (restaurantDoc.exists()) {
                const restaurant = restaurantDoc.data();
                
                // Ensure countries are loaded
                await loadCountriesForDropdowns();
                
                // Set the country value
                countrySelect.value = restaurant.countryId || '';
            } else {
                console.warn("Restaurant not found:", restaurantId);
                countrySelect.value = '';
            }
        }
    } catch (error) {
        console.error("Error loading restaurant:", error);
    }
});