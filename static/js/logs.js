//closure for logs
let logs = (function () {
    "use strict";
    
    window.addEventListener("load", function () {
        
        function onError(err) {
            console.error("[error]", err);
            const errorBox = document.querySelector("#error_box");
            const errorMessage = document.querySelector("#error_message");
            if (errorBox && errorMessage) {
                errorMessage.textContent = err;
                errorBox.style.display = "flex";
            }
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        
        function formatDuration(seconds) {
            if (!seconds) return 'N/A';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        }
        
        function loadMatchGameStats() {
            fetch('/api/match-game/stats')
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    // Update overview stats
                    document.getElementById('match-total-games').textContent = data.totalGames;
                    document.getElementById('match-average-score').textContent = data.averageScore + '%';
                    document.getElementById('match-best-score').textContent = data.bestScore + '%';
                    document.getElementById('match-total-correct').textContent = data.totalCorrectAnswers;
                    
                    // Update recent games
                    const recentGamesContainer = document.getElementById('match-recent-games');
                    if (data.recentGames && data.recentGames.length > 0) {
                        recentGamesContainer.innerHTML = data.recentGames.map(game => `
                            <div class="game-entry">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        recentGamesContainer.innerHTML = '<div class="no-games">No match games played yet</div>';
                    }
                })
                .catch(error => {
                    console.error('Error loading match game stats:', error);
                    onError('Failed to load match game statistics');
                });
        }
        
        function loadSpellingGameStats() {
            fetch('/api/spelling-game/stats')
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    // Update overview stats
                    document.getElementById('spelling-total-games').textContent = data.totalGames;
                    document.getElementById('spelling-average-score').textContent = data.averageScore + '%';
                    document.getElementById('spelling-best-score').textContent = data.bestScore + '%';
                    document.getElementById('spelling-total-correct').textContent = data.totalCorrectAnswers;
                    
                    // Update recent games
                    const recentGamesContainer = document.getElementById('spelling-recent-games');
                    if (data.recentGames && data.recentGames.length > 0) {
                        recentGamesContainer.innerHTML = data.recentGames.map(game => `
                            <div class="game-entry">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        recentGamesContainer.innerHTML = '<div class="no-games">No spelling games played yet</div>';
                    }
                })
                .catch(error => {
                    console.error('Error loading spelling game stats:', error);
                    onError('Failed to load spelling game statistics');
                });
        }
        
        function loadDropGameStats() {
            fetch('/api/drop-game/stats')
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    // Update overview stats
                    document.getElementById('drop-total-games').textContent = data.totalGames;
                    document.getElementById('drop-average-score').textContent = data.averageScore + '%';
                    document.getElementById('drop-best-score').textContent = data.bestScore + '%';
                    document.getElementById('drop-total-correct').textContent = data.totalCorrectAnswers;
                    
                    // Update recent games
                    const recentGamesContainer = document.getElementById('drop-recent-games');
                    if (data.recentGames && data.recentGames.length > 0) {
                        recentGamesContainer.innerHTML = data.recentGames.map(game => `
                            <div class="game-entry">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        recentGamesContainer.innerHTML = '<div class="no-games">No drop games played yet</div>';
                    }
                })
                .catch(error => {
                    console.error('Error loading drop game stats:', error);
                    onError('Failed to load drop game statistics');
                });
        }
        
        function loadUserInfo() {
            apiService.getCurrentUser(function(err, user) {
                if (err) {
                    console.error('Error loading user info:', err);
                    document.getElementById('current-username').textContent = 'User';
                    return;
                }
                document.getElementById('current-username').textContent = user.username || 'User';
            });
        }
        
        // Global refresh function
        window.refreshStats = function() {
            loadMatchGameStats();
            loadSpellingGameStats();
            loadDropGameStats();
        };
        
        // Add event listeners for navigation buttons
        document.getElementById('back-to-gallery-btn').addEventListener('click', function() {
            window.location.href = '/';
        });
        
        document.getElementById('refresh-stats-btn').addEventListener('click', function() {
            refreshStats();
        });
        
        // Add event listener for error close button
        document.getElementById('close-error-btn').addEventListener('click', function() {
            document.getElementById('error_box').style.display = 'none';
        });
        
        // Load everything on page load
        loadUserInfo();
        loadMatchGameStats();
        loadSpellingGameStats();
        loadDropGameStats();
    });
})();
