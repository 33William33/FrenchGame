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
                            <div class="game-entry clickable-game" data-game-id="${game._id}" data-game-type="match" style="cursor: pointer;">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                        <span class="game-level">Level ${(game.level !== undefined && game.level !== null) ? game.level + 1 : 1}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                    <div class="click-hint">Click to view details</div>
                                </div>
                            </div>
                        `).join('');
                        
                        // Add event listeners to clickable game entries
                        recentGamesContainer.querySelectorAll('.clickable-game').forEach(entry => {
                            entry.addEventListener('click', function() {
                                const gameId = this.dataset.gameId;
                                const gameType = this.dataset.gameType;
                                showGameDetails(gameId, gameType);
                            });
                        });
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
                            <div class="game-entry clickable-game" data-game-id="${game._id}" data-game-type="spelling" style="cursor: pointer;">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                        <span class="game-level">Level ${(game.level !== undefined && game.level !== null) ? game.level + 1 : 1}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                    <div class="click-hint">Click to view details</div>
                                </div>
                            </div>
                        `).join('');
                        
                        // Add event listeners to clickable game entries
                        recentGamesContainer.querySelectorAll('.clickable-game').forEach(entry => {
                            entry.addEventListener('click', function() {
                                const gameId = this.dataset.gameId;
                                const gameType = this.dataset.gameType;
                                showGameDetails(gameId, gameType);
                            });
                        });
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
                            <div class="game-entry clickable-game" data-game-id="${game._id}" data-game-type="drop" style="cursor: pointer;">
                                <div class="game-score ${game.score >= 80 ? 'excellent' : game.score >= 60 ? 'good' : 'needs-improvement'}">
                                    ${game.score}%
                                </div>
                                <div class="game-details">
                                    <div class="game-info">
                                        <span class="game-questions">${game.correctAnswers}/${game.totalQuestions} correct</span>
                                        <span class="game-time">${formatDuration(game.completionTime)}</span>
                                        <span class="game-level">Level ${(game.level !== undefined && game.level !== null) ? game.level + 1 : 1}</span>
                                    </div>
                                    <div class="game-date">${formatDate(game.date)}</div>
                                    <div class="click-hint">Click to view details</div>
                                </div>
                            </div>
                        `).join('');
                        
                        // Add event listeners to clickable game entries
                        recentGamesContainer.querySelectorAll('.clickable-game').forEach(entry => {
                            entry.addEventListener('click', function() {
                                const gameId = this.dataset.gameId;
                                const gameType = this.dataset.gameType;
                                showGameDetails(gameId, gameType);
                            });
                        });
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
            // Show visual feedback that refresh is happening
            const refreshBtn = document.getElementById('refresh-stats-btn');
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
            
            // Update user info and all game stats
            loadUserInfo();
            loadMatchGameStats();
            loadSpellingGameStats();
            loadDropGameStats();
            
            // Reset button after a short delay
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 1000);
        };
        
        // Add event listeners for navigation buttons
        document.getElementById('back-to-gallery-btn').addEventListener('click', function() {
            window.location.href = '/';
        });
        
        // Function to show detailed game information
        window.showGameDetails = function(gameId, gameType) {
            fetch(`/api/${gameType}-game/details/${gameId}`)
                .then(response => response.json())
                .then(game => {
                    if (game.error) {
                        throw new Error(game.error);
                    }
                    
                    const modal = createGameDetailsModal(game, gameType);
                    document.body.appendChild(modal);
                    modal.style.display = 'flex';
                })
                .catch(error => {
                    console.error('Error loading game details:', error);
                    onError('Failed to load game details');
                });
        };
        
        function createGameDetailsModal(game, gameType) {
            const modal = document.createElement('div');
            modal.className = 'game-details-modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const gameTypeLabel = gameType.charAt(0).toUpperCase() + gameType.slice(1);
            const levelText = (game.level !== undefined && game.level !== null) ? game.level + 1 : 1;
            
            // Get the appropriate icon for each game type
            const gameIcon = gameType === 'match' ? 'puzzle-piece' : gameType === 'spelling' ? 'keyboard' : 'meteor';
            
            modalContent.innerHTML = `
                <div class="modal-header">
                    <div>
                        <h2>
                            <i class="fas fa-${gameIcon}"></i>
                            ${gameTypeLabel} Game Details
                        </h2>
                        <p>Detailed breakdown of your performance</p>
                    </div>
                    <button class="close-modal-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="game-summary">
                        <h3>
                            <i class="fas fa-trophy"></i> Game Summary
                        </h3>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <div class="value">${game.score}%</div>
                                <div class="label">Score</div>
                            </div>
                            <div class="summary-card">
                                <div class="value medium">${game.correctAnswers}/${game.totalQuestions}</div>
                                <div class="label">Correct Answers</div>
                            </div>
                            <div class="summary-card">
                                <div class="value medium">${formatDuration(game.completionTime)}</div>
                                <div class="label">Completion Time</div>
                            </div>
                            <div class="summary-card">
                                <div class="value medium">
                                    <i class="fas fa-star"></i> ${levelText}
                                </div>
                                <div class="label">Level</div>
                            </div>
                            <div class="summary-card">
                                <div class="value small">${formatDate(game.date)}</div>
                                <div class="label">Date Played</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="questions-details">
                        <h3>
                            <i class="fas fa-list-ul"></i> Question Breakdown
                        </h3>
                        <div class="questions-list">
                            ${game.gameData && game.gameData.questions ? 
                                game.gameData.questions.map((question, index) => `
                                    <div class="question-item ${question.isCorrect ? 'correct' : 'incorrect'}">
                                        <div class="question-header">
                                            <div class="question-number">
                                                <div class="number-badge">${index + 1}</div>
                                                <span class="title">Question ${index + 1}</span>
                                            </div>
                                            <div class="question-status">
                                                <i class="fas fa-${question.isCorrect ? 'check' : 'times'}"></i>
                                                ${question.isCorrect ? 'Correct' : 'Incorrect'}
                                            </div>
                                        </div>
                                        
                                        <div class="question-content${gameType === 'drop' ? ' drop-game' : ''}">
                                            <div class="question-field">
                                                <strong>Question:</strong>
                                                <div class="value">${question.englishWord || question.question || 'N/A'}</div>
                                            </div>
                                            <div class="question-field">
                                                <strong>Correct Answer:</strong>
                                                <div class="value correct-answer">${question.correctAnswer}</div>
                                            </div>
                                            ${gameType !== 'drop' ? `
                                                <div class="question-field">
                                                    <strong>Your Answer:</strong>
                                                    <div class="value user-answer ${question.isCorrect ? 'correct' : 'incorrect'}">
                                                        ${question.selectedAnswer || question.userAnswer || 'No answer provided'}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                        
                                        ${question.timestamp ? `
                                            <div class="question-timestamp">
                                                <i class="fas fa-clock"></i>
                                                ${new Date(question.timestamp).toLocaleTimeString()}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('') 
                                : '<div class="no-data"><i class="fas fa-info-circle"></i> No question details available</div>'
                            }
                        </div>
                    </div>
                </div>
            `;
            
            modal.appendChild(modalContent);
            
            // Add event listeners
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            modalContent.querySelector('.close-modal-btn').addEventListener('click', function() {
                modal.remove();
            });
            
            return modal;
        }
        
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
