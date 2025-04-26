// API Base URLs
const ARTWORKS_API_URL = 'http://localhost:8080/api/artworks';
const ARTISTS_API_URL = 'http://localhost:8080/api/artists';

// State
let currentPage = 1;
let totalPages = 1;
let artworks = [];
let artists = [];
let currentArtworkIndex = 0;
let currentFilters = {};
let currentView = 'artworks'; 

// DOM Elements
const artworkGrid = document.getElementById('artworkGrid');
const artistsGrid = document.getElementById('artistsGrid');
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
const viewArtworksBtn = document.getElementById('viewArtworksBtn');
const viewArtistsBtn = document.getElementById('viewArtistsBtn');

// Bootstrap Modals
const addArtworkModal = new bootstrap.Modal(document.getElementById('addArtworkModal'));
const editArtworkModal = new bootstrap.Modal(document.getElementById('editArtworkModal'));
let artistDetailsModal = document.getElementById('artistDetailsModal')
    ? new bootstrap.Modal(document.getElementById('artistDetailsModal'))
    : null;

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

    // View toggling
    if (viewArtworksBtn) {
        viewArtworksBtn.addEventListener('click', () => {
            setCurrentView('artworks');
        });
    }

    if (viewArtistsBtn) {
        viewArtistsBtn.addEventListener('click', () => {
            setCurrentView('artists');
        });
    }
});

// Set current view (artworks or artists)
function setCurrentView(view) {
    currentView = view;

    if (view === 'artworks') {
        document.getElementById('artworksContainer').classList.remove('d-none');
        if (document.getElementById('artistsContainer')) {
            document.getElementById('artistsContainer').classList.add('d-none');
        }
        viewArtworksBtn.classList.add('active');
        viewArtistsBtn.classList.remove('active');
        fetchArtworks(1);
    } else {
        document.getElementById('artworksContainer').classList.add('d-none');
        if (document.getElementById('artistsContainer')) {
            document.getElementById('artistsContainer').classList.remove('d-none');
        }
        viewArtworksBtn.classList.remove('active');
        viewArtistsBtn.classList.add('active');
        fetchArtists(1);
    }
}

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

        let url = `${ARTWORKS_API_URL}?page=${page}&limit=10`;

        // Add filters to URL if they exist
        if (filters.search) {
            url = `${ARTWORKS_API_URL}/search/query?term=${encodeURIComponent(filters.search)}`;
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

// Fetch artists from the API
async function fetchArtists(page = 1, searchTerm = '') {
    try {
        if (!artistsGrid) return;

        artistsGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading artists...</p>
            </div>
        `;

        let url = `${ARTISTS_API_URL}?page=${page}&limit=20`;

        // Add search term if it exists
        if (searchTerm) {
            url = `${ARTISTS_API_URL}/search/query?term=${encodeURIComponent(searchTerm)}`;
        }

        const response = await axios.get(url);

        if (searchTerm) {
            // Search results
            artists = response.data;
            totalPages = 1;
        } else {
            // Regular results
            artists = response.data.data;
            currentPage = response.data.page;
            totalPages = response.data.totalPages;
        }

        // Display the artists
        renderArtistsGrid();
        renderPagination();
    } catch (error) {
        console.error('Error fetching artists:', error);
        if (artistsGrid) {
            artistsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading artists. Please try again later.
                    </div>
                </div>
            `;
        }
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
                    <img src="${artwork.ImageURL || artwork.ThumbnailURL || 'https://placeholder.co/300x200?text=No+Image'}" 
                        class="card-img-top artwork-image" 
                        alt="${artwork.Title}">
                    <div class="card-body">
                        <h5 class="card-title">${artwork.Title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${artwork.Artist || 'Unknown Artist'}</h6>
                        <p class="card-text">${artwork.Year || artwork.Date || 'Date unknown'}</p>
                    </div>
                </div>
            </div>
        `;
    });

    artworkGrid.innerHTML = gridHTML;
}

// Render the artists grid
function renderArtistsGrid() {
    if (!artistsGrid) return;

    if (artists.length === 0) {
        artistsGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">No artists found</div>
            </div>
        `;
        return;
    }

    let gridHTML = '';

    artists.forEach((artist, index) => {
        gridHTML += `
            <div class="col-md-3 mb-4">
                <div class="card artist-card h-100" onclick="showArtistDetails(${artist.ConstituentID})">
                    <div class="card-body">
                        <h5 class="card-title">${artist.DisplayName || 'Unknown Artist'}</h5>
                        <p class="card-text">
                            ${artist.Nationality ? `<strong>Nationality:</strong> ${artist.Nationality}<br>` : ''}
                            ${artist.Gender ? `<strong>Gender:</strong> ${artist.Gender}<br>` : ''}
                            ${artist.BeginDate ? `<strong>Born:</strong> ${artist.BeginDate}<br>` : ''}
                            ${artist.EndDate ? `<strong>Died:</strong> ${artist.EndDate}` : ''}
                        </p>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); fetchArtistArtworks(${artist.ConstituentID})">
                            View Artworks
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    artistsGrid.innerHTML = gridHTML;
}

// Show artist details and artworks
async function showArtistDetails(constituentId) {
    try {
        // Check if modal exists in DOM
        if (!document.getElementById('artistDetailsModal')) {
            createArtistModal();
        }

        const artistModalContent = document.getElementById('artistModalContent');
        artistModalContent.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading artist information...</p>
            </div>
        `;

        // Show the modal
        if (artistDetailsModal) {
            artistDetailsModal.show();
        } else {
            // create the modal fist if doesn't exist
            if (!document.getElementById('artistDetailsModal')) {
                createArtistModal();
            }

            artistDetailsModal = new bootstrap.Modal(document.getElementById('artistDetailsModal'));
            artistDetailsModal.show();
        }

        // Fetch artist details
        const response = await axios.get(`${ARTISTS_API_URL}/constituent/${constituentId}`);
        const artist = response.data;

        // Fetch artist's artworks
        const artworksResponse = await axios.get(`${ARTISTS_API_URL}/${constituentId}/artworks`);
        const artistArtworks = artworksResponse.data.artworks;

        // Build content for modal
        let modalContent = `
            <div class="row">
                <div class="col-12">
                    <h2>${artist.DisplayName}</h2>
                    <p>
                        ${artist.Nationality ? `<strong>Nationality:</strong> ${artist.Nationality}<br>` : ''}
                        ${artist.Gender ? `<strong>Gender:</strong> ${artist.Gender}<br>` : ''}
                        ${artist.BeginDate ? `<strong>Born:</strong> ${artist.BeginDate}<br>` : ''}
                        ${artist.EndDate ? `<strong>Died:</strong> ${artist.EndDate}<br>` : ''}
                        ${artist.ArtistBio ? `<strong>Bio:</strong> ${artist.ArtistBio}` : ''}
                    </p>
                </div>
            </div>
            
            <h3 class="mt-4">Artworks by ${artist.DisplayName}</h3>
        `;

        if (artistArtworks.length === 0) {
            modalContent += `<p>No artworks found for this artist.</p>`;
        } else {
            modalContent += `<div class="row">`;

            artistArtworks.forEach(artwork => {
                modalContent += `
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <img src="${artwork.ImageURL || artwork.ThumbnailURL || 'https://placeholder.co/300x200?text=No+Image'}" 
                                class="card-img-top" 
                                alt="${artwork.Title}" 
                                style="height: 150px; object-fit: contain;">
                            <div class="card-body">
                                <h5 class="card-title">${artwork.Title}</h5>
                                <p class="card-text">${artwork.Date || artwork.Year || 'Date unknown'}</p>
                            </div>
                        </div>
                    </div>
                `;
            });

            modalContent += `</div>`;
        }

        artistModalContent.innerHTML = modalContent;

    } catch (error) {
        console.error('Error fetching artist details:', error);
        if (document.getElementById('artistModalContent')) {
            document.getElementById('artistModalContent').innerHTML = `
                <div class="alert alert-danger">
                    Error loading artist details. Please try again later.
                </div>
            `;
        }
    }
}

// Create artist modal if it doesn't exist
function createArtistModal() {
    const modalHTML = `
        <div class="modal fade" id="artistDetailsModal" tabindex="-1" aria-labelledby="artistDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="artistDetailsModalLabel">Artist Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="artistModalContent">
                        <!-- Content will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    artistDetailsModal = new bootstrap.Modal(document.getElementById('artistDetailsModal'));
}

// Fetch artworks by an artist
async function fetchArtistArtworks(constituentId) {
    try {
        event.stopPropagation(); // Prevent the card click event

        showArtistDetails(constituentId);
    } catch (error) {
        console.error('Error fetching artist artworks:', error);
        showToast('Error', 'Failed to load artist artworks', 'danger');
    }
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

    if (currentView === 'artworks') {
        fetchArtworks(currentPage, currentFilters);
    } else {
        fetchArtists(currentPage);
    }
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

    // Check if artwork has ConstituentID to potentially display artist info
    let artistButton = '';
    if (artwork.ConstituentID) {
        const constituentId = Array.isArray(artwork.ConstituentID)
            ? artwork.ConstituentID[0]
            : artwork.ConstituentID;

        artistButton = `
            <button class="btn btn-outline-secondary ms-2" onclick="showArtistDetails(${constituentId})">
                View Artist
            </button>
        `;
    }

    currentArtworkDisplay.innerHTML = `
        <div class="row">
            <div class="col-md-6 text-center">
                <img src="${artwork.ImageURL || artwork.ThumbnailURL || 'https://placeholder.co/300x200?text=No+Image'}" 
                    class="img-fluid current-artwork-image" 
                    alt="${artwork.Title}">
            </div>
            <div class="col-md-6">
                <h3>${artwork.Title}</h3>
                <h5>${artwork.Artist || 'Unknown Artist'}</h5>
                <p>${artwork.Year || artwork.Date || 'Date unknown'}</p>
                
                <dl class="row artwork-details">
                    <dt class="col-sm-3">Medium</dt>
                    <dd class="col-sm-9">${artwork.Medium || 'Not specified'}</dd>
                    
                    <dt class="col-sm-3">Dimensions</dt>
                    <dd class="col-sm-9">${artwork.Dimensions || 'Not specified'}</dd>
                    
                    ${artwork.Department ? `
                    <dt class="col-sm-3">Department</dt>
                    <dd class="col-sm-9">${artwork.Department}</dd>
                    ` : ''}
                    
                    ${artwork.Classification ? `
                    <dt class="col-sm-3">Classification</dt>
                    <dd class="col-sm-9">${artwork.Classification}</dd>
                    ` : ''}
                </dl>
                
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="editArtwork(${currentArtworkIndex})">
                        Edit Artwork
                    </button>
                    ${artistButton}
                </div>
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
        if (currentView === 'artworks') {
            currentFilters = {
                search: searchTerm
            };
            fetchArtworks(1, currentFilters);
        } else {
            fetchArtists(1, searchTerm);
        }
    } else {
        currentFilters = {};
        if (currentView === 'artworks') {
            fetchArtworks(1);
        } else {
            fetchArtists(1);
        }
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
    document.getElementById('editArtworkYear').value = artwork.Year || artwork.Date || '';
    document.getElementById('editArtworkMedium').value = artwork.Medium || '';
    document.getElementById('editArtworkDimensions').value = artwork.Dimensions || '';
    document.getElementById('editArtworkImageURL').value = artwork.ImageURL || artwork.ThumbnailURL || '';

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
        const response = await axios.post(ARTWORKS_API_URL, newArtwork);

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
        const response = await axios.put(`${ARTWORKS_API_URL}/${artworkId}`, updatedArtwork);

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
            await axios.delete(`${ARTWORKS_API_URL}/${artworkId}`);

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

    // Remove toast element 
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}