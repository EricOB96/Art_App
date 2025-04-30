// Fetch user's favorites
function fetchUserFavorites() {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetch('/api/users/favorites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        userFavorites = data.map(item => item._id);
        // Update any visible favorite buttons
        updateFavoriteButtons();
        // Update favorites count if exists
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
          favoritesCount.textContent = userFavorites.length;
        }
      }
    })
    .catch(error => {
      console.error('Error fetching favorites:', error);
    });
}

// Toggle favorite status
function toggleFavorite(artworkId) {
  if (!currentUser) {
    loginModal.show();
    return;
  }

  const token = localStorage.getItem('token');
  const isFavorite = userFavorites.includes(artworkId);
  const method = isFavorite ? 'DELETE' : 'POST';
  const url = isFavorite ?
    `/api/users/favorites/${artworkId}` :
    '/api/users/favorites';

  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: isFavorite ? null : JSON.stringify({ artworkId })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showToast('Error', data.error, 'danger');
      } else {
        if (isFavorite) {
          userFavorites = userFavorites.filter(id => id !== artworkId);
          showToast('Success', 'Removed from favorites', 'success');

          // If in the favorites view, refresh it
          if (document.getElementById('favoritesContainer') &&
            !document.getElementById('favoritesContainer').classList.contains('d-none')) {
            showFavorites();
          }
        } else {
          userFavorites.push(artworkId);
          showToast('Success', 'Added to favorites', 'success');
        }
        updateFavoriteButtons();

        // Update favorites count
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
          favoritesCount.textContent = userFavorites.length;
        }
      }
    })
    .catch(error => {
      console.error('Error toggling favorite:', error);
      showToast('Error', 'Failed to update favorites', 'danger');
    });
}

// Update favorite buttons
function updateFavoriteButtons() {
  // Update the current displayed artwork
  if (artworks.length > 0 && currentArtworkIndex >= 0) {
    const artwork = artworks[currentArtworkIndex];
    const favoriteBtn = document.getElementById(`favoriteBtn`);

    if (favoriteBtn && artwork._id) {
      if (userFavorites.includes(artwork._id)) {
        favoriteBtn.classList.remove('btn-outline-danger');
        favoriteBtn.classList.add('btn-danger');
        favoriteBtn.innerHTML = `<i class="bi bi-heart-fill"></i> Remove from Favorites`;
      } else {
        favoriteBtn.classList.add('btn-outline-danger');
        favoriteBtn.classList.remove('btn-danger');
        favoriteBtn.innerHTML = `<i class="bi bi-heart"></i> Add to Favorites`;
      }
    }
  }
}

// View a single favorite artwork in detail
function viewFavoriteDetail(artworkId) {
  const token = localStorage.getItem('token');

  // Make sure the modal exists
  if (!document.getElementById('favoriteDetailModal')) {
    createFavoriteDetailModal();
  }

  // Fetch the specific artwork details
  fetch(`/api/artworks/${artworkId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(artwork => {
      const detailContent = document.getElementById('favoriteDetailContent');

      detailContent.innerHTML = `
            <div class="row">
                <div class="col-md-6 text-center mb-3">
                    <img src="${artwork.ImageURL || artwork.ThumbnailURL || '/images/no-image.png'}" 
                        class="img-fluid" style="max-height: 300px;" alt="${artwork.Title}">
                </div>
                <div class="col-md-6">
                    <h4>${artwork.Title}</h4>
                    <p class="text-muted">${artwork.Artist || 'Unknown Artist'}</p>
                    <p>${artwork.Year || artwork.Date || 'Date unknown'}</p>
                    
                    <dl class="row">
                        <dt class="col-sm-4">Medium</dt>
                        <dd class="col-sm-8">${artwork.Medium || 'Not specified'}</dd>
                        
                        <dt class="col-sm-4">Dimensions</dt>
                        <dd class="col-sm-8">${artwork.Dimensions || 'Not specified'}</dd>
                        
                        ${artwork.Department ? `
                        <dt class="col-sm-4">Department</dt>
                        <dd class="col-sm-8">${artwork.Department}</dd>
                        ` : ''}
                    </dl>
                    
                    <button class="btn btn-danger" onclick="toggleFavorite('${artwork._id}'); bootstrap.Modal.getInstance(document.getElementById('favoriteDetailModal')).hide();">
                        <i class="bi bi-heart-fill"></i> Remove from Favorites
                    </button>
                </div>
            </div>
        `;

      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById('favoriteDetailModal'));
      modal.show();
    })
    .catch(error => {
      console.error('Error fetching artwork details:', error);
      showToast('Error', 'Failed to load artwork details', 'danger');
    });
}

// Create the favorite detail modal if it doesn't exist
function createFavoriteDetailModal() {
  const modalHTML = `
        <div class="modal fade" id="favoriteDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">Favorite Artwork</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="favoriteDetailContent">
                        <!-- Content will be dynamically inserted here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Show favorites view
function showFavorites() {
  if (!currentUser) {
    loginModal.show();
    return;
  }

  // Make sure using the main container
  const mainContainer = document.querySelector('.container');

  // Hide all other containers
  hideAllContainers();

  // Create favorites container if it doesn't exist
  let favoritesContainer = document.getElementById('favoritesContainer');
  if (!favoritesContainer) {
    favoritesContainer = document.createElement('div');
    favoritesContainer.id = 'favoritesContainer';
    mainContainer.appendChild(favoritesContainer);
  } else {
    favoritesContainer.classList.remove('d-none');
  }

  // Set full-width display
  favoritesContainer.className = 'container-fluid px-0';
  mainContainer.style.maxWidth = '100%';

  // Add content
  favoritesContainer.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-lg-10">
                <h2 class="mt-4 mb-3">My Favorite Artworks</h2>
                <div class="row" id="favoritesGrid">
                    <div class="col-12 text-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading favorites...</p>
                    </div>
                </div>
                <div class="mt-3 mb-4">
                    <button class="btn btn-primary" onclick="handleBackToArtworks()">
                        <i class="bi bi-arrow-left"></i> Back to All Artworks
                    </button>
                </div>
            </div>
        </div>
    `;

  // Add a handler for the back button to restore container style
  window.handleBackToArtworks = function () {
    mainContainer.style.maxWidth = '';
    setCurrentView('artworks');
  };

  // Fetch favorites
  const token = localStorage.getItem('token');

  fetch('/api/users/favorites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(favorites => {
      const favoritesGrid = document.getElementById('favoritesGrid');

      if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        You don't have any favorite artworks yet. Browse the collection and add some!
                    </div>
                </div>
            `;
        return;
      }

      let gridHTML = '';

      favorites.forEach((artwork) => {
        gridHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card artwork-card h-100 shadow-sm">
                        <div class="card-img-top-container" style="height: 180px; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; overflow: hidden;">
                            <img src="${artwork.ImageURL || artwork.ThumbnailURL || '/images/no-image.png'}" 
                                class="img-fluid" style="max-height: 100%; max-width: 100%; object-fit: contain;"
                                alt="${artwork.Title}">
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-truncate" title="${artwork.Title}" style="font-size: 1rem;">${artwork.Title}</h5>
                            <p class="card-subtitle mb-1 text-muted text-truncate" style="font-size: 0.9rem;">${artwork.Artist || 'Unknown Artist'}</p>
                            <p class="card-text small text-muted">${artwork.Year || artwork.Date || 'Date unknown'}</p>
                            <div class="mt-auto d-flex gap-2">
                                <button class="btn btn-sm btn-danger flex-grow-1" onclick="toggleFavorite('${artwork._id}')">
                                    <i class="bi bi-heart-fill"></i> Remove
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewFavoriteDetail('${artwork._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      });

      favoritesGrid.innerHTML = gridHTML;
    })
    .catch(error => {
      console.error('Error fetching favorites:', error);
      document.getElementById('favoritesGrid').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Error loading favorites. Please try again.
                </div>
            </div>
        `;
    });
}

// Export favorites functions
window.favorites = {
  fetchUserFavorites,
  toggleFavorite,
  updateFavoriteButtons,
  showFavorites,
  viewFavoriteDetail,
  createFavoriteDetailModal
};