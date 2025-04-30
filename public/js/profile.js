// Show user profile
function showProfile() {
    if (!currentUser) {
        loginModal.show();
        return;
    }

    hideAllContainers();

    // Create profile container if it doesn't exist
    let profileContainer = document.getElementById('profileContainer');
    if (!profileContainer) {
        profileContainer = document.createElement('div');
        profileContainer.id = 'profileContainer';
        document.querySelector('.container').appendChild(profileContainer);
    } else {
        profileContainer.classList.remove('d-none');
    }

    profileContainer.innerHTML = `
    <div class="row mt-4">
      <div class="col-md-8 offset-md-2">
        <div class="card">
          <div class="card-header bg-dark text-white">
            <h4 class="mb-0">My Profile</h4>
          </div>
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Fetch latest user data
    const token = localStorage.getItem('token');

    fetch('/api/users/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(user => {
            profileContainer.innerHTML = `
      <div class="row mt-4">
        <div class="col-lg-12 offset-md-2">
          <div class="card">
            <div class="card-header bg-dark text-white">
              <h4 class="mb-0">My Profile</h4>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-10">
                  <strong>Username:</strong>
                </div>
                <div class="col-md-8">
                  ${user.username}
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <strong>Name:</strong>
                </div>
                <div class="col-md-8">
                  ${user.name}
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <strong>Email:</strong>
                </div>
                <div class="col-md-8">
                  ${user.email}
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <strong>Account Created:</strong>
                </div>
                <div class="col-md-8">
                  ${new Date(user.dateCreated).toLocaleDateString()}
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <strong>Favorites:</strong>
                </div>
                <div class="col-md-8">
                  ${user.favorites ? user.favorites.length : 0} artworks
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary" onclick="showFavorites()">
                <i class="bi bi-heart"></i> View My Favorites
              </button>
              <button class="btn btn-secondary" onclick="setCurrentView('artworks')">
                <i class="bi bi-arrow-left"></i> Back to Artworks
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            profileContainer.innerHTML = `
      <div class="alert alert-danger mt-4">
        Error loading profile. Please try again.
      </div>
    `;
        });
}

// Export profile functions
window.profile = {
    showProfile
};