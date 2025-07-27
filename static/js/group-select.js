// Group Selection Page JavaScript
let groupSelect = (function () {
    "use strict";
    
    const WORDS_PER_GROUP = 30;
    let allImages = [];
    let gameType = '';
    
    window.addEventListener("load", function () {
        // Initialize the page
        init();
        
        function init() {
            // Get game type from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            gameType = urlParams.get('game') || 'match';
            
            // Update page title based on game type
            updatePageTitle();
            
            // Load user info
            loadUserInfo();
            
            // Show loading overlay
            showLoading();
            
            // Load all images and create groups
            loadImagesAndCreateGroups();
            
            // Setup event listeners
            setupEventListeners();
        }
        
        function updatePageTitle() {
            const titleElement = document.getElementById('game-type-title');
            const gameNames = {
                'match': 'Match Game',
                'spell': 'Spelling Game',
                'drop': 'Drop Game',
                'drop-sentence': 'Drop Sentence Game'
            };
            
            titleElement.textContent = `Select Level for ${gameNames[gameType] || 'Game'}`;
        }
        
        function loadUserInfo() {
            apiService.getCurrentUser(function (err, user) {
                if (err) {
                    console.error("Failed to load user info:", err);
                    return;
                }
                
                const usernameElement = document.getElementById("current-username");
                if (usernameElement && user) {
                    usernameElement.textContent = user.username;
                }
            });
        }
        
        function showLoading() {
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay.classList.add('show');
        }
        
        function hideLoading() {
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay.classList.remove('show');
        }
        
        function onError(err) {
            console.error("[error]", err);
            let error_box = document.querySelector("#error_box");
            let error_message = document.querySelector("#error_message");
            error_message.textContent = err;
            error_box.style.display = "flex";
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                error_box.style.display = "none";
            }, 5000);
            
            hideLoading();
        }
        
        function loadImagesAndCreateGroups() {
            apiService.getGraphs(function (err, images) {
                if (err) {
                    onError("Failed to load images: " + err);
                    return;
                }
                
                allImages = images || [];
                createGroupCards();
                hideLoading();
            });
        }
        
        function createGroupCards() {
            const levelGrid = document.getElementById('level-grid');
            const totalWordsElement = document.getElementById('total-words');
            
            levelGrid.innerHTML = '';
            totalWordsElement.textContent = allImages.length;
            
            if (allImages.length === 0) {
                levelGrid.innerHTML = `
                    <div class="roadmap-level locked">
                        <div class="level-circle">
                            <span class="level-number">0</span>
                        </div>
                        <div class="level-details">
                            <div class="level-name">No Words Available</div>
                            <div class="level-description">Add some words first!</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Calculate number of groups
            const totalGroups = Math.ceil(allImages.length / WORDS_PER_GROUP);
            
            // Create roadmap container
            levelGrid.className = 'roadmap-container';
            
            for (let i = 0; i < totalGroups; i++) {
                const groupNumber = i + 1;
                const startIndex = i * WORDS_PER_GROUP;
                const endIndex = Math.min(startIndex + WORDS_PER_GROUP, allImages.length);
                const wordCount = endIndex - startIndex;
                const isUnlocked = i === 0 || true; // For now, all levels are unlocked
                
                const levelCard = createLevelCard({
                    groupNumber,
                    startIndex: startIndex + 1,
                    endIndex,
                    wordCount,
                    isUnlocked,
                    progress: isUnlocked ? getGroupProgress(i, wordCount) : 0,
                    isLast: i === totalGroups - 1,
                    isFirst: i === 0
                });
                
                levelGrid.appendChild(levelCard);
            }
        }
        
        function createLevelCard(options) {
            const { groupNumber, startIndex, endIndex, wordCount, isUnlocked, progress, isLast, isFirst } = options;
            
            const card = document.createElement('div');
            card.className = `roadmap-level ${!isUnlocked ? 'locked' : ''} ${isLast ? 'last' : ''} ${isFirst ? 'first' : ''}`;
            card.dataset.group = groupNumber - 1; // 0-based index
            
            card.innerHTML = `
                <div class="level-circle ${isUnlocked ? 'unlocked' : 'locked'}">
                    <span class="level-number">${groupNumber}</span>
                    <div class="level-status">${isUnlocked ? '🎯' : '🔒'}</div>
                </div>
                <div class="level-details">
                    <div class="level-name">Level ${groupNumber}</div>
                    <div class="level-description">Words ${startIndex} - ${endIndex} (${wordCount} words)</div>
                    <div class="level-progress">
                        <div class="level-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                ${!isLast ? '<div class="roadmap-connector"></div>' : ''}
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', function() {
                    selectGroup(parseInt(card.dataset.group));
                });
            }
            
            return card;
        }
        
        function getGroupProgress(groupIndex, wordCount) {
            // Calculate progress based on how many words are in the group
            // Full group (30 words) = 100% progress
            // Partial group = percentage based on word count
            const progressPercent = Math.round((wordCount / WORDS_PER_GROUP) * 100);
            return Math.min(progressPercent, 100);
        }
        
        function selectGroup(groupIndex) {
            // Get the group's images
            const startIndex = groupIndex * WORDS_PER_GROUP;
            const endIndex = Math.min(startIndex + WORDS_PER_GROUP, allImages.length);
            const groupImages = allImages.slice(startIndex, endIndex);
            
            // Clear any existing game state before setting new level
            if (typeof LevelManager !== 'undefined') {
                LevelManager.resetGameState();
            }
            
            // Store level data in localStorage using LevelManager
            const levelData = {
                startIndex: startIndex + 1, // Convert to 1-based index
                endIndex: endIndex,
                gameType: gameType,
                groupIndex: groupIndex,
                images: groupImages,
                totalImages: allImages.length
            };
            
            if (typeof LevelManager !== 'undefined') {
                LevelManager.saveLevelData(levelData);
                // Start a new game for the selected level
                LevelManager.startNewGame(gameType);
            } else {
                // Fallback to direct localStorage if LevelManager not available
                localStorage.setItem('french_game_level_data', JSON.stringify(levelData));
                // Reset game index to start a new game
                const indexKey = gameType === 'spell' ? 'index1' : 'index';
                localStorage.setItem(indexKey, JSON.stringify(0));
            }
            
            console.log(`Selected Level ${groupIndex + 1}: ${levelData.startIndex}-${levelData.endIndex} for ${gameType} game - Starting new game`);
            
            // Show loading and redirect to the game
            showLoading();
            
            setTimeout(() => {
                const gameUrls = {
                    'match': '/game.html',
                    'spell': '/spell.html',
                    'drop': '/drop.html?newLevel=true',
                    'drop-sentence': '/drop-sentence.html?newLevel=true'
                };
                
                window.location.href = gameUrls[gameType] || '/game.html';
            }, 500);
        }
        
        function setupEventListeners() {
            // Back button
            const backBtn = document.getElementById('back-btn');
            backBtn.addEventListener('click', function() {
                window.location.href = '/';
            });
            
            // Logs button
            const logsBtn = document.getElementById('logs-btn');
            if (logsBtn) {
                logsBtn.addEventListener('click', function() {
                    window.location.href = '/logs.html';
                });
            }
            
            // ESC key to go back
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    window.location.href = '/';
                }
            });
        }
    });
})();
