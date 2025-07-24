// Logout script - clears localStorage and redirects
(function() {
    "use strict";
    
    console.log('Logout script loaded');
    
    // Clear all localStorage data on logout
    if (typeof LevelManager !== 'undefined') {
        LevelManager.clearAllData();
        console.log('LevelManager data cleared on logout');
    } else {
        // Fallback clearing if LevelManager not available
        localStorage.clear();
        console.log('localStorage cleared on logout (fallback)');
    }
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
})();
