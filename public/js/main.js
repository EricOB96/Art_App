// API Base URL
const API_BASE_URL = 'http://localhost:8080/api/artworks';

// State
let currentPage = 1;
let totalPages = 1;
let artworks = [];
let currentArtworkIndex = 0;
let currentFilters = {};

// DOM Elements
const artworkGrid = document.getElementById('artworkGrid');
const pagination = document.getElementById('pagination');
const currentArtworkDisplay = document.getElementById('currentArtwork');
const paginationInfo = document.getElementById('paginationInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const filterField = document.getElementById('filterField');
const filterValue = document.getElementById('filterValue');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const addArtworkForm = document.getElementById('addArtworkForm');
const saveArtworkBtn = document.getElementById('saveArtworkBtn');
const editArtworkForm = document.getElementById('editArtworkForm');
const updateArtworkBtn = document.getElementById('updateArtworkBtn');
const deleteArtworkBtn = document.getElementById('deleteArtworkBtn');

// Bootstrap Modals
const addArtworkModal = new bootstrap.Modal(document.getElementById('addArtworkModal'));
const editArtworkModal = new bootstrap.Modal(document.getElementById('editArtworkModal'));

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial artworks
    fetchArtworks();

    // Event listeners
    prevBtn.addEventListener('click', showPreviousArtwork);
    nextBtn.addEventListener('click', showNextArtwork);
    searchForm.addEventListener('submit', handleSearch);
    applyFilterBtn.addEventListener('click', applyFilter);
    saveArtworkBtn.addEventListener('click', handleAddArtwork);
    updateArtworkBtn.addEventListener('click', handleUpdateArtwork);
    deleteArtworkBtn.addEventListener('click', handleDeleteArtwork);
});

// Fetch artworks from the API
async function fetchArtworks(page = 1, filters = {}) {
    try {
        artworkGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading artworks...</p>
            </div>
        `;

        let url = `${API_BASE_URL}?page=${page}&limit=10`;

        // Add filters to URL if they exist
        if (filters.search) {
            url = `${API_BASE_URL}/search/query?term=${encodeURIComponent(filters.search)}`;
            if (filters.field) {
                url += `&field=${encodeURIComponent(filters.field)}`;
            }
        }

        const response = await axios.get(url);

        if (filters.search) {
            // Search results have a different structure
            artworks = response.data;
            totalPages = 1; // Just one page for search results
        } else {
            // Regular pagination results
            artworks = response.data.data;
            currentPage = response.data.page;
            totalPages = response.data.totalPages;
        }

        // Display the artworks
        renderArtworkGrid();
        renderPagination();

        // Display the first artwork
        if (artworks.length > 0) {
            currentArtworkIndex = 0;
            displayCurrentArtwork();
        } else {
            currentArtworkDisplay.innerHTML = `
                <div class="alert alert-info">No artworks found</div>
            `;
        }
    } catch (error) {
        console.error('Error fetching artworks:', error);
        artworkGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Error loading artworks. Please try again later.
                </div>
            </div>
        `;
    }
}

// Render the artwork grid
function renderArtworkGrid() {
    if (artworks.length === 0) {
        artworkGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">No artworks found</div>
            </div>
        `;
        return;
    }

    let gridHTML = '';

    artworks.forEach((artwork, index) => {
        gridHTML += `
            <div class="col-md-3 mb-4">
                <div class="card artwork-card h-100" onclick="selectArtwork(${index})">
                    <img src="${artwork.ImageURL || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                        class="card-img-top artwork-image" 
                        alt="${artwork.Title}">
                    <div class="card-body">
                        <h5 class="card-title">${artwork.Title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${artwork.Artist}</h6>
                        <p class="card-text">${artwork.Year}</p>
                    </div>
                </div>
            </div>
        `;
    });

    artworkGrid.innerHTML = gridHTML;
}

// Render pagination controls
function renderPagination() {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    // Page numbers
    const maxPages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) {
        return;
    }

    currentPage = page;
    fetchArtworks(currentPage, currentFilters);
}

// Display the current artwork
function displayCurrentArtwork() {
    if (artworks.length === 0) {
        currentArtworkDisplay.innerHTML = `
            <div class="alert alert-info">No artwork selected</div>
        `;
        return;
    }

    const artwork = artworks[currentArtworkIndex];

    currentArtworkDisplay.innerHTML = `
        <div class="row">
            <div class="col-md-6 text-center">
                <img src="${artwork.ImageURL || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                    class="img-fluid current-artwork-image" 
                    alt="${artwork.Title}">
            </div>
            <div class="col-md-6">
                <h3>${artwork.Title}</h3>
                <h5>${artwork.Artist}</h5>
                <p>${artwork.Year}</p>
                
                <dl class="row artwork-details">
                    <dt class="col-sm-3">Medium</dt>
                    <dd class="col-sm-9">${artwork.Medium || 'Not specified'}</dd>
                    
                    <dt class="col-sm-3">Dimensions</dt>
                    <dd class="col-sm-9">${artwork.Dimensions || 'Not specified'}</dd>
                </dl>
                
                <button class="btn btn-primary" onclick="editArtwork(${currentArtworkIndex})">
                    Edit Artwork
                </button>
            </div>
        </div>
    `;

    paginationInfo.textContent = `${currentArtworkIndex + 1} of ${artworks.length}`;
    updateNavigationButtons();
}

// Update navigation buttons state
function updateNavigationButtons() {
    prevBtn.disabled = currentArtworkIndex === 0;
    nextBtn.disabled = currentArtworkIndex === artworks.length - 1;
}

// Show previous artwork
function showPreviousArtwork() {
    if (currentArtworkIndex > 0) {
        currentArtworkIndex--;
        displayCurrentArtwork();
    }
}

// Show next artwork
function showNextArtwork() {
    if (currentArtworkIndex < artworks.length - 1) {
        currentArtworkIndex++;
        displayCurrentArtwork();
    }
}

// Select a specific artwork
function selectArtwork(index) {
    if (index >= 0 && index < artworks.length) {
        currentArtworkIndex = index;
        displayCurrentArtwork();
        // Scroll to the current artwork display
        currentArtworkDisplay.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle search form submission
function handleSearch(e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();

    if (searchTerm) {
        currentFilters = {
            search: searchTerm
        };
        fetchArtworks(1, currentFilters);
    } else {
        currentFilters = {};
        fetchArtworks(1);
    }
}

// Apply filter based on field and value
function applyFilter() {
    const field = filterField.value;
    const value = filterValue.value.trim();

    if (value) {
        currentFilters = {
            search: value,
            field: field
        };
        fetchArtworks(1, currentFilters);
    } else {
        currentFilters = {};
        fetchArtworks(1);
    }
}

// Edit an artwork
function editArtwork(index) {
    const artwork = artworks[index];

    // Populate the edit form
    document.getElementById('editArtworkId').value = artwork._id;
    document.getElementById('editArtworkTitle').value = artwork.Title || '';
    document.getElementById('editArtworkArtist').value = artwork.Artist || '';
    document.getElementById('editArtworkYear').value = artwork.Year || '';
    document.getElementById('editArtworkMedium').value = artwork.Medium || '';
    document.getElementById('editArtworkDimensions').value = artwork.Dimensions || '';
    document.getElementById('editArtworkImageURL').value = artwork.ImageURL || '';

    // Show the edit modal
    editArtworkModal.show();
}

// Handle adding a new artwork
async function handleAddArtwork() {
    const newArtwork = {
        Title: document.getElementById('artworkTitle').value,
        Artist: document.getElementById('artworkArtist').value,
        Year: document.getElementById('artworkYear').value,
        Medium: document.getElementById('artworkMedium').value,
        Dimensions: document.getElementById('artworkDimensions').value,
        ImageURL: document.getElementById('artworkImageURL').value
    };

    try {
        const response = await axios.post(API_BASE_URL, newArtwork);

        // Hide the modal
        addArtworkModal.hide();

        // Reset the form
        addArtworkForm.reset();

        // Show success message
        showToast('Success', 'Artwork added successfully', 'success');

        // Reload artworks
        fetchArtworks(currentPage, currentFilters);
    } catch (error) {
        console.error('Error adding artwork:', error);
        showToast('Error', 'Failed to add artwork', 'danger');
    }
}

// Handle updating an artwork
async function handleUpdateArtwork() {
    const artworkId = document.getElementById('editArtworkId').value;

    const updatedArtwork = {
        Title: document.getElementById('editArtworkTitle').value,
        Artist: document.getElementById('editArtworkArtist').value,
        Year: document.getElementById('editArtworkYear').value,
        Medium: document.getElementById('editArtworkMedium').value,
        Dimensions: document.getElementById('editArtworkDimensions').value,
        ImageURL: document.getElementById('editArtworkImageURL').value
    };

    try {
        const response = await axios.put(`${API_BASE_URL}/${artworkId}`, updatedArtwork);

        // Hide the modal
        editArtworkModal.hide();

        // Show success message
        showToast('Success', 'Artwork updated successfully', 'success');

        // Update the artwork in the array
        artworks[currentArtworkIndex] = response.data;

        // Refresh the display
        displayCurrentArtwork();
        renderArtworkGrid();
    } catch (error) {
        console.error('Error updating artwork:', error);
        showToast('Error', 'Failed to update artwork', 'danger');
    }
}

// Handle deleting an artwork
async function handleDeleteArtwork() {
    const artworkId = document.getElementById('editArtworkId').value;

    if (confirm('Are you sure you want to delete this artwork?')) {
        try {
            await axios.delete(`${API_BASE_URL}/${artworkId}`);

            // Hide the modal
            editArtworkModal.hide();

            // Show success message
            showToast('Success', 'Artwork deleted successfully', 'success');

            // Reload artworks
            fetchArtworks(currentPage, currentFilters);
        } catch (error) {
            console.error('Error deleting artwork:', error);
            showToast('Error', 'Failed to delete artwork', 'danger');
        }
    }
}

// Show a toast notification
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast bg-${type} text-white`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="toast-header bg-${type} text-white">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toastEl);

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 5000
    });
    toast.show();

    // Remove toast element after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}