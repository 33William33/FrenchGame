let dropGame = (function() {
    "use strict";

    // Game state
    let gameState = {
        isPlaying: false,
        fallingWords: [],
        currentWords: [],
        correctAnswers: 0,
        incorrectAnswers: 0,
        gameTimer: null,
        wordDropTimer: null,
        wordIndex: 0,
        gameStartTime: null,
        totalWords: 5,
        wordSpeed: 0.25, // pixels per frame
        currentBatch: 0,
        wordsPerBatch: 5,
        allGameWords: [], // All words for the entire session
        gameCompleted: false,
        currentLogId: null, // Track current log entry for updates
        questionResults: [] // Track individual question results
    };

    // This will be populated from the database
    let VOCABULARY = [];

    // Audio recording variables
    let mediaRecorder = null;
    let recordedAudioBlob = null;
    let isRecording = false;

    window.addEventListener("load", function() {
        const canvas = document.getElementById('game-canvas');
        const frenchInput = document.getElementById('french-input');
        const startBtn = document.getElementById('start-game-btn');
        const restartBtn = document.getElementById('restart-game-btn');
        const backBtn = document.getElementById('bc'); // Updated to match new ID
        const dropLogsBtn = document.getElementById('drop-logs-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const backToMenuBtn = document.getElementById('back-to-menu-btn');

        // Initialize game
        initializeGame();

        // Event listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);
        frenchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkInput();
                // Clear input on every Enter press, regardless of correctness
                frenchInput.value = '';
            }
        });

        backBtn.addEventListener('click', function() {
            window.location.href = '/';
        });

        // Add event listener for level select button
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', function() {
                window.location.href = '/group-select.html?game=drop&returnTo=drop';
            });
        }



        dropLogsBtn.addEventListener('click', function() {
            window.location.href = '/logs';
        });

        playAgainBtn.addEventListener('click', function() {
            hideGameOverModal();
            newGame(); // Use newGame instead of restartGame to get fresh level data
        });

        backToMenuBtn.addEventListener('click', function() {
            window.location.href = '/';
        });

        // Add event listener for new game button if it exists
        // const newGameBtn = document.getElementById('ng');
        // if (newGameBtn) {
        //     newGameBtn.addEventListener('click', newGame);
        // }

        // Load user info
        loadUserInfo();

        // Load vocabulary from database
        function loadVocabulary() {
            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for drop game
                if (!LevelManager.initializeLevel('drop')) {
                    return; // Will redirect to level selection if needed
                }
                
                // Get level data and use level-specific images
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.images) {
                    // Convert level images to vocabulary format
                    VOCABULARY = levelData.images.map(image => ({
                        english: image.imageName,
                        french: image.author
                    }));
                    
                    console.log('Loaded level-specific vocabulary:', VOCABULARY.length, 'words from level', levelData.groupIndex + 1);
                    
                    // Enable the start button
                    const startBtn = document.getElementById('start-game-btn');
                    if (startBtn) {
                        startBtn.disabled = false;
                        startBtn.textContent = 'Start Game';
                    }
                    
                    return;
                }
            }
            
            // Fallback to loading all images if LevelManager not available
            apiService.getGraphs(function(err, images) {
                if (err) {
                    console.error('Error loading vocabulary:', err);
                    onError('Failed to load vocabulary from database');
                    return;
                }
                
                // Convert images to vocabulary format
                VOCABULARY = images.map(image => ({
                    english: image.imageName,
                    french: image.author
                }));
                
                console.log('Loaded vocabulary:', VOCABULARY.length, 'words from database');
                
                // Enable the start button only after vocabulary is loaded
                const startBtn = document.getElementById('start-game-btn');
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start Game';
                }
            });
        }

        // Shuffle array using Fisher-Yates algorithm
        function shuffleArray(array) {
            const shuffled = [...array]; // Create a copy to avoid modifying original
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        // New game function that resets everything for a fresh start
        function newGame() {
            // Before clearing everything, ensure current game is properly logged if it was completed
            if (gameState.gameCompleted && gameState.currentLogId && gameState.questionResults.length > 0) {
                console.log('Saving completed game before starting new game...');
                
                // Calculate final stats
                const totalWordsProcessed = gameState.correctAnswers + gameState.incorrectAnswers;
                const score = totalWordsProcessed > 0 ? Math.round((gameState.correctAnswers / totalWordsProcessed) * 100) : 0;
                const completionTime = gameState.gameStartTime ? Math.round((new Date() - gameState.gameStartTime) / 1000) : 0;
                
                // Save the completed game log one final time
                logDropGame(score, completionTime, true);
            }
            
            // Now reset everything for a completely fresh start
            gameState.allGameWords = [];
            gameState.currentBatch = 0;
            gameState.correctAnswers = 0;
            gameState.incorrectAnswers = 0;
            gameState.gameStartTime = null;
            gameState.gameCompleted = false;
            gameState.currentLogId = null; // Reset log ID for new game session
            gameState.questionResults = []; // Reset individual question tracking
            // Clear any drop game specific data
            localStorage.removeItem('drop_game_data');
            
            // Use LevelManager if available to start a new game
            if (typeof LevelManager !== 'undefined') {
                // Start new drop game
                LevelManager.startNewGame('drop');
                
                console.log('Drop game new game started with level:', LevelManager.getCurrentLevelInfo());
            }
            
            // Reload vocabulary for the new game/level and prepare for user to start
            loadVocabularyAndStart();
        }

        // Function to load vocabulary and prepare for new game
        function loadVocabularyAndStart() {
            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for drop game
                if (!LevelManager.initializeLevel('drop')) {
                    return; // Will redirect to level selection if needed
                }
                
                // Get level data and use level-specific images
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.images) {
                    // Convert level images to vocabulary format
                    VOCABULARY = levelData.images.map(image => ({
                        english: image.imageName,
                        french: image.author
                    }));
                    
                    console.log('Loaded level-specific vocabulary:', VOCABULARY.length, 'words from level', levelData.groupIndex + 1);
                    
                    // Reset game state but don't start automatically
                    resetGameState();
                    
                    // Update UI buttons - show start button, hide restart button
                    const startBtn = document.getElementById('start-game-btn');
                    const restartBtn = document.getElementById('restart-game-btn');
                    
                    if (startBtn) {
                        startBtn.disabled = false;
                        startBtn.textContent = 'Start Game';
                        startBtn.style.display = 'inline-flex';
                    }
                    
                    if (restartBtn) {
                        restartBtn.style.display = 'none';
                    }
                    
                    // Show level information message
                    showLevelMessage(`Level ${levelData.groupIndex + 1} loaded! ${VOCABULARY.length} words ready. Click "Start Game" to begin.`);
                    
                    return;
                }
            }
            
            // Fallback to loading all images if LevelManager not available
            apiService.getGraphs(function(err, images) {
                if (err) {
                    console.error('Error loading vocabulary:', err);
                    onError('Failed to load vocabulary from database');
                    return;
                }
                
                // Convert images to vocabulary format
                VOCABULARY = images.map(image => ({
                    english: image.imageName,
                    french: image.author
                }));
                
                console.log('Loaded vocabulary:', VOCABULARY.length, 'words from database');
                
                // Reset game state but don't start automatically
                resetGameState();
                
                // Update UI buttons - show start button, hide restart button
                const startBtn = document.getElementById('start-game-btn');
                const restartBtn = document.getElementById('restart-game-btn');
                
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start Game';
                    startBtn.style.display = 'inline-flex';
                }
                
                if (restartBtn) {
                    restartBtn.style.display = 'none';
                }
                
                // Show general message for fallback
                showLevelMessage(`All vocabulary loaded! ${VOCABULARY.length} words ready. Click "Start Game" to begin.`);
            });
        }

        // Function to show a temporary level message
        function showLevelMessage(message) {
            // Remove any existing level message
            const existingMessage = document.getElementById('level-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // Create new message element
            const messageElement = document.createElement('div');
            messageElement.id = 'level-message';
            messageElement.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #27ae60;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: slideInDown 0.3s ease-out;
            `;
            messageElement.textContent = message;
            
            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Add to document
            document.body.appendChild(messageElement);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (messageElement && messageElement.parentNode) {
                    messageElement.style.animation = 'slideInDown 0.3s ease-out reverse';
                    setTimeout(() => {
                        messageElement.remove();
                    }, 300);
                }
            }, 4000);
        }

        // Initialize vocabulary loading
        loadVocabulary();

        // Initialize UI - disable start button until vocabulary loads
        const initialStartBtn = document.getElementById('start-game-btn');
        if (initialStartBtn) {
            initialStartBtn.disabled = true;
            initialStartBtn.textContent = 'Loading...';
        }

        function initializeGame() {
            updateScoreDisplay();
            resetGameState();
        }

        function resetGameState() {
            gameState.isPlaying = false;
            gameState.fallingWords = [];
            gameState.currentWords = [];
            gameState.wordIndex = 0;

            // Clear any existing timers
            if (gameState.gameTimer) {
                cancelAnimationFrame(gameState.gameTimer);
                gameState.gameTimer = null;
            }
            if (gameState.wordDropTimer) {
                clearInterval(gameState.wordDropTimer);
                gameState.wordDropTimer = null;
            }

            // Clear falling words from DOM
            const existingWords = canvas.querySelectorAll('.falling-word');
            existingWords.forEach(word => word.remove());

            // Clear missed words container
            const missedContainer = document.getElementById('missed-words-container');
            if (missedContainer) {
                missedContainer.remove();
            }

            // Clear fireworks
            const fireworksContainer = document.getElementById('fireworks-container');
            fireworksContainer.innerHTML = '';

            updateScoreDisplay();
        }

        function startGame() {
            if (VOCABULARY.length === 0) {
                onError('Vocabulary not loaded yet. Please wait...');
                return;
            }

            // Clear any level message when starting the game
            const levelMessage = document.getElementById('level-message');
            if (levelMessage) {
                levelMessage.remove();
            }

            // Initialize game session on first start
            if (gameState.allGameWords.length === 0) {
                gameState.allGameWords = shuffleArray(VOCABULARY);
                gameState.currentBatch = 0;
                gameState.gameCompleted = false;
                gameState.gameStartTime = new Date();
                console.log('🎲 Words shuffled for random order!');
            }

            resetGameState();
            gameState.isPlaying = true;
            
            // Get next batch of words
            gameState.currentWords = getNextBatch();
            
            // Update UI
            startBtn.style.display = 'none';
            restartBtn.style.display = 'inline-flex';
            frenchInput.disabled = false;
            frenchInput.focus();

            // Start dropping words
            startWordDropping();
            
            // Start game loop
            gameLoop();
        }

        function restartGame() {
            // Reset everything for a completely new game session
            gameState.allGameWords = [];
            gameState.currentBatch = 0;
            gameState.correctAnswers = 0;
            gameState.incorrectAnswers = 0;
            gameState.gameStartTime = null;
            gameState.gameCompleted = false;
            gameState.currentLogId = null; // Reset log ID for new game session
            gameState.questionResults = []; // Reset individual question tracking
            
            // Clear drop game specific data
            localStorage.removeItem('drop_game_data');
            
            startGame();
        }

        function getNextBatch() {
            const startIndex = gameState.currentBatch * gameState.wordsPerBatch;
            const endIndex = Math.min(startIndex + gameState.wordsPerBatch, gameState.allGameWords.length);
            
            if (startIndex >= gameState.allGameWords.length) {
                return [];
            }
            
            const batch = gameState.allGameWords.slice(startIndex, endIndex);
            console.log(`📚 Loading batch ${gameState.currentBatch + 1}: words ${startIndex + 1}-${endIndex} of ${gameState.allGameWords.length}`);
            return batch;
        }

        function getRandomWords(count) {
            const shuffled = shuffleArray(VOCABULARY);
            return shuffled.slice(0, count);
        }

        function startWordDropping() {
            let dropDelay = 3000; // 3 seconds between words
            gameState.wordDropTimer = setInterval(() => {
                if (gameState.wordIndex < gameState.currentWords.length) {
                    dropWord(gameState.currentWords[gameState.wordIndex]);
                    gameState.wordIndex++;
                } else {
                    clearInterval(gameState.wordDropTimer);
                    gameState.wordDropTimer = null;
                }
            }, dropDelay);

            // Drop the first word immediately
            if (gameState.currentWords.length > 0) {
                dropWord(gameState.currentWords[0]);
                gameState.wordIndex = 1;
            }
        }

        function dropWord(wordData) {
            const wordElement = document.createElement('div');
            wordElement.className = 'falling-word';
            wordElement.textContent = wordData.english;
            wordElement.setAttribute('data-french', wordData.french);
            
            // Random horizontal position
            const canvasRect = canvas.getBoundingClientRect();
            const maxX = canvasRect.width - 150; // Account for word width
            const randomX = Math.random() * maxX;
            
            wordElement.style.left = randomX + 'px';
            wordElement.style.top = '0px';
            
            canvas.appendChild(wordElement);
            gameState.fallingWords.push({
                element: wordElement,
                y: 0,
                french: wordData.french,
                english: wordData.english,
                matched: false
            });
        }

        function gameLoop() {
            if (!gameState.isPlaying) return;

            // Update falling words - iterate backwards to safely remove elements
            for (let i = gameState.fallingWords.length - 1; i >= 0; i--) {
                const wordObj = gameState.fallingWords[i];
                if (!wordObj.matched) {
                    wordObj.y += gameState.wordSpeed;
                    wordObj.element.style.top = wordObj.y + 'px';

                    // Check if word has fallen off screen
                    const canvasHeight = canvas.offsetHeight;
                    if (wordObj.y > canvasHeight - 50) {
                        // Word missed - add to missed words stack
                        addMissedWord(wordObj.french);
                        playFalseSound();
                        
                        wordObj.element.remove();
                        gameState.fallingWords.splice(i, 1);
                        gameState.incorrectAnswers++;
                        
                        // Track individual question result
                        gameState.questionResults.push({
                            englishWord: wordObj.english,
                            correctAnswer: wordObj.french,
                            isCorrect: false,
                            timestamp: new Date().toISOString()
                        });
                        
                        updateScoreDisplay();
                        showIndicator('incorrect');
                        
                        // Check if game should end
                        checkGameEnd();
                    }
                }
            }

            // Continue game loop
            gameState.gameTimer = requestAnimationFrame(gameLoop);
        }

        function checkInput() {
            if (!gameState.isPlaying) return;

            const userInput = frenchInput.value.trim().toLowerCase();
            if (userInput === '') return;

            // Function to remove French articles
            function removeArticles(word) {
                const cleanWord = word.toLowerCase().trim();
                // Remove common French articles
                if (cleanWord.startsWith('le ')) {
                    return cleanWord.substring(3);
                } else if (cleanWord.startsWith('la ')) {
                    return cleanWord.substring(3);
                } else if (cleanWord.startsWith('les ')) {
                    return cleanWord.substring(4);
                } else if (cleanWord.startsWith('l\' ') || cleanWord.startsWith('l\'')) {
                    return cleanWord.replace(/^l['\s]*\s*/, '');
                }
                return cleanWord;
            }

            // Check against all falling words - iterate backwards to safely handle removal
            let matchFound = false;
            for (let i = gameState.fallingWords.length - 1; i >= 0; i--) {
                const wordObj = gameState.fallingWords[i];
                const cleanCorrectAnswer = removeArticles(wordObj.french);
                if (!wordObj.matched && cleanCorrectAnswer === userInput) {
                    // Match found!
                    matchFound = true;
                    wordObj.matched = true;
                    
                    // Visual effects
                    wordObj.element.classList.add('matched');
                    playCorrectSound();
                    
                    // Store the index for removal after animation
                    const wordIndex = i;
                    setTimeout(() => {
                        wordObj.element.classList.add('exploding');
                        createFireworks(wordObj.element);
                        setTimeout(() => {
                            if (wordObj.element.parentNode) {
                                wordObj.element.remove();
                            }
                            // Find and remove the word object safely
                            const currentIndex = gameState.fallingWords.indexOf(wordObj);
                            if (currentIndex !== -1) {
                                gameState.fallingWords.splice(currentIndex, 1);
                            }
                            checkGameEnd();
                        }, 600);
                    }, 200);

                    // Update score
                    gameState.correctAnswers++;
                    
                    // Track individual question result
                    gameState.questionResults.push({
                        englishWord: wordObj.english,
                        correctAnswer: wordObj.french,
                        isCorrect: true,
                        timestamp: new Date().toISOString()
                    });
                    
                    updateScoreDisplay();
                    showIndicator('correct');
                    
                    // Only match the first occurrence
                    break;
                }
            }

            if (!matchFound) {
                // Wrong answer - shake input
                frenchInput.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    frenchInput.style.animation = '';
                }, 500);
            }
        }

        function createFireworks(wordElement) {
            console.log('🎆 Creating spectacular fireworks!');
            
            const rect = wordElement.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const centerX = rect.left - canvasRect.left + rect.width / 2;
            const centerY = rect.top - canvasRect.top + rect.height / 2;

            console.log('🎆 Fireworks position:', centerX, centerY);

            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa726', '#66bb6a', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
            
            const fireworksContainer = document.getElementById('fireworks-container');
            if (!fireworksContainer) {
                console.error('🎆 Fireworks container not found!');
                return;
            }
            
            // Create multiple layers of fireworks for spectacular effect
            
            // Layer 1: Main explosion (large particles)
            for (let i = 0; i < 16; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle large';
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.cssText = `
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff 0%, ${color} 30%, transparent 80%);
                    color: ${color};
                    left: ${centerX - 8}px;
                    top: ${centerY - 8}px;
                    pointer-events: none;
                    z-index: 101;
                `;
                
                fireworksContainer.appendChild(particle);

                // Main explosion animation
                const angle = (i / 16) * Math.PI * 2;
                const velocity = 120 + Math.random() * 80;
                const vx = Math.cos(angle) * velocity;
                const vy = Math.sin(angle) * velocity;

                particle.animate([
                    { 
                        transform: 'translate(0, 0) scale(0.5)', 
                        opacity: 1,
                        filter: 'brightness(2)'
                    },
                    { 
                        transform: `translate(${vx * 0.7}px, ${vy * 0.7}px) scale(1.2)`, 
                        opacity: 0.8,
                        filter: 'brightness(1.5)',
                        offset: 0.3
                    },
                    { 
                        transform: `translate(${vx}px, ${vy}px) scale(0.2)`, 
                        opacity: 0,
                        filter: 'brightness(0.5)'
                    }
                ], {
                    duration: 1200,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }).onfinish = () => {
                    particle.remove();
                };
            }
            
            // Layer 2: Secondary sparkles (medium particles)
            setTimeout(() => {
                for (let i = 0; i < 24; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'firework-particle';
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    sparkle.style.cssText = `
                        position: absolute;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: radial-gradient(circle, #fff 0%, ${color} 30%, transparent 80%);
                        color: ${color};
                        left: ${centerX - 6}px;
                        top: ${centerY - 6}px;
                        pointer-events: none;
                        z-index: 102;
                    `;
                    
                    fireworksContainer.appendChild(sparkle);

                    const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
                    const velocity = 80 + Math.random() * 60;
                    const vx = Math.cos(angle) * velocity;
                    const vy = Math.sin(angle) * velocity;

                    sparkle.animate([
                        { 
                            transform: 'translate(0, 0) scale(0)', 
                            opacity: 1,
                            filter: 'brightness(3)'
                        },
                        { 
                            transform: `translate(${vx}px, ${vy}px) scale(1)`, 
                            opacity: 0,
                            filter: 'brightness(1)'
                        }
                    ], {
                        duration: 1000,
                        easing: 'ease-out'
                    }).onfinish = () => {
                        sparkle.remove();
                    };
                }
            }, 200);
            
            // Layer 3: Tiny sparkles (small particles)
            setTimeout(() => {
                for (let i = 0; i < 32; i++) {
                    const tiny = document.createElement('div');
                    tiny.className = 'firework-particle sparkle';
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    tiny.style.cssText = `
                        position: absolute;
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: radial-gradient(circle, #fff 0%, ${color} 50%, transparent 90%);
                        color: ${color};
                        left: ${centerX - 3}px;
                        top: ${centerY - 3}px;
                        pointer-events: none;
                        z-index: 103;
                    `;
                    
                    fireworksContainer.appendChild(tiny);

                    const angle = Math.random() * Math.PI * 2;
                    const velocity = 40 + Math.random() * 40;
                    const vx = Math.cos(angle) * velocity;
                    const vy = Math.sin(angle) * velocity;

                    tiny.animate([
                        { 
                            transform: 'translate(0, 0) scale(1) rotate(0deg)', 
                            opacity: 1,
                            filter: 'brightness(4)'
                        },
                        { 
                            transform: `translate(${vx}px, ${vy}px) scale(0.5) rotate(180deg)`, 
                            opacity: 0.5,
                            filter: 'brightness(2)',
                            offset: 0.7
                        },
                        { 
                            transform: `translate(${vx * 1.3}px, ${vy * 1.3}px) scale(0) rotate(360deg)`, 
                            opacity: 0,
                            filter: 'brightness(0)'
                        }
                    ], {
                        duration: 1500,
                        easing: 'ease-out'
                    }).onfinish = () => {
                        tiny.remove();
                    };
                }
            }, 400);
            
            // Layer 4: Ring explosion effect
            setTimeout(() => {
                for (let ring = 0; ring < 3; ring++) {
                    const ringParticles = 8 + ring * 4;
                    for (let i = 0; i < ringParticles; i++) {
                        const ringParticle = document.createElement('div');
                        ringParticle.className = 'firework-particle';
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        ringParticle.style.cssText = `
                            position: absolute;
                            width: ${8 + ring * 2}px;
                            height: ${8 + ring * 2}px;
                            border-radius: 50%;
                            background: radial-gradient(circle, transparent 30%, ${color} 50%, transparent 90%);
                            color: ${color};
                            left: ${centerX - (4 + ring)}px;
                            top: ${centerY - (4 + ring)}px;
                            pointer-events: none;
                            z-index: 100 + ring;
                        `;
                        
                        fireworksContainer.appendChild(ringParticle);

                        const angle = (i / ringParticles) * Math.PI * 2;
                        const radius = 60 + ring * 30;
                        const vx = Math.cos(angle) * radius;
                        const vy = Math.sin(angle) * radius;

                        ringParticle.animate([
                            { 
                                transform: 'translate(0, 0) scale(0)', 
                                opacity: 0
                            },
                            { 
                                transform: `translate(${vx * 0.3}px, ${vy * 0.3}px) scale(1)`, 
                                opacity: 1,
                                offset: 0.2
                            },
                            { 
                                transform: `translate(${vx}px, ${vy}px) scale(0.3)`, 
                                opacity: 0
                            }
                        ], {
                            duration: 800 + ring * 200,
                            easing: 'ease-out'
                        }).onfinish = () => {
                            ringParticle.remove();
                        };
                    }
                }
            }, 100);
            
            console.log('🎆 Spectacular fireworks show created!');
        }

        function showIndicator(type) {
            const indicator = document.getElementById(`${type}-indicator`);
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 1000);
        }

        function updateScoreDisplay() {
            document.getElementById('correct-count').textContent = gameState.correctAnswers;
            document.getElementById('incorrect-count').textContent = gameState.incorrectAnswers;
        }

        function checkGameEnd() {
            const allWordsDropped = gameState.wordIndex >= gameState.currentWords.length;
            const noMoreFallingWords = gameState.fallingWords.length === 0;

            if (allWordsDropped && noMoreFallingWords) {
                // Check if there are more words to play
                const nextBatchStart = (gameState.currentBatch + 1) * gameState.wordsPerBatch;
                const hasMoreWords = nextBatchStart < gameState.allGameWords.length;
                
                if (hasMoreWords) {
                    showContinueModal();
                } else {
                    gameState.gameCompleted = true;
                    endGame();
                }
            }
        }

        function endGame() {
            gameState.isPlaying = false;
            
            // Clear timers
            if (gameState.gameTimer) {
                cancelAnimationFrame(gameState.gameTimer);
                gameState.gameTimer = null;
            }
            if (gameState.wordDropTimer) {
                clearInterval(gameState.wordDropTimer);
                gameState.wordDropTimer = null;
            }

            // Calculate final score based on entire session
            const totalWordsProcessed = gameState.correctAnswers + gameState.incorrectAnswers;
            const totalWordsAttempted = Math.min(gameState.allGameWords.length, (gameState.currentBatch + 1) * gameState.wordsPerBatch);
            const score = totalWordsProcessed > 0 ? Math.round((gameState.correctAnswers / totalWordsProcessed) * 100) : 0;
            const completionTime = Math.round((new Date() - gameState.gameStartTime) / 1000);

            // Update UI
            frenchInput.disabled = true;
            startBtn.style.display = 'inline-flex';
            restartBtn.style.display = 'none';

            // Show appropriate modal
            if (gameState.gameCompleted) {
                showGameCompleteModal(score, completionTime, totalWordsAttempted);
            } else {
                showGameOverModal(score, completionTime);
            }

            // Always log the game (create new log or update existing one)
            logDropGame(score, completionTime, gameState.gameCompleted);
        }

        function showGameOverModal(score, completionTime) {
            document.getElementById('final-correct').textContent = gameState.correctAnswers;
            document.getElementById('final-incorrect').textContent = gameState.incorrectAnswers;
            document.getElementById('final-score').textContent = score;
            
            const modal = document.getElementById('game-over-modal');
            modal.style.display = 'flex';
        }

        function hideGameOverModal() {
            const modal = document.getElementById('game-over-modal');
            modal.style.display = 'none';
        }

        function showContinueModal() {
            gameState.isPlaying = false;
            frenchInput.disabled = true;
            
            // Calculate current progress
            const wordsCompleted = (gameState.currentBatch + 1) * gameState.wordsPerBatch;
            const totalWords = gameState.allGameWords.length;
            const remainingWords = totalWords - wordsCompleted;
            
            // Create or update continue modal
            let continueModal = document.getElementById('continue-modal');
            if (!continueModal) {
                continueModal = document.createElement('div');
                continueModal.id = 'continue-modal';
                continueModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                `;
                
                const modalContent = document.createElement('div');
                modalContent.style.cssText = `
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                `;
                
                modalContent.innerHTML = `
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">🎯 Great Progress!</h2>
                    <div id="continue-stats" style="margin-bottom: 25px; font-size: 18px;">
                        <p><strong>Correct:</strong> <span id="continue-correct">${gameState.correctAnswers}</span></p>
                        <p><strong>Incorrect:</strong> <span id="continue-incorrect">${gameState.incorrectAnswers}</span></p>
                        <p><strong>Words completed:</strong> <span id="continue-completed">${wordsCompleted}</span> / ${totalWords}</p>
                        <p><strong>Remaining:</strong> <span id="continue-remaining">${remainingWords}</span> words</p>
                    </div>
                    <p style="margin-bottom: 25px; color: #7f8c8d;">
                        You've completed another batch! Would you like to continue with the next ${Math.min(remainingWords, gameState.wordsPerBatch)} words?
                    </p>
                    <div>
                        <button id="continue-yes-btn" style="
                            background: #27ae60;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            margin: 5px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: bold;
                        ">🚀 Continue Playing</button>
                        <button id="continue-no-btn" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            margin: 5px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: bold;
                        ">🏁 Finish Game</button>
                    </div>
                `;
                
                continueModal.appendChild(modalContent);
                document.body.appendChild(continueModal);
                
                // Add event listeners
                document.getElementById('continue-yes-btn').addEventListener('click', function() {
                    hideContinueModal();
                    
                    // Update log with current progress before continuing
                    const totalWordsProcessed = gameState.correctAnswers + gameState.incorrectAnswers;
                    const score = totalWordsProcessed > 0 ? Math.round((gameState.correctAnswers / totalWordsProcessed) * 100) : 0;
                    const completionTime = Math.round((new Date() - gameState.gameStartTime) / 1000);
                    
                    // If no log exists yet, create one (this happens after first batch)
                    if (!gameState.currentLogId) {
                        logDropGame(score, completionTime, false); // This will create the initial log
                    } else {
                        logDropGame(score, completionTime, false); // This will update existing log
                    }
                    
                    gameState.currentBatch++;
                    startGame();
                });
                
                document.getElementById('continue-no-btn').addEventListener('click', function() {
                    hideContinueModal();
                    gameState.gameCompleted = true;
                    endGame();
                });
            } else {
                // Update existing modal with current stats
                document.getElementById('continue-correct').textContent = gameState.correctAnswers;
                document.getElementById('continue-incorrect').textContent = gameState.incorrectAnswers;
                document.getElementById('continue-completed').textContent = wordsCompleted;
                document.getElementById('continue-remaining').textContent = remainingWords;
            }
            
            continueModal.style.display = 'flex';
        }

        function hideContinueModal() {
            const modal = document.getElementById('continue-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function showGameCompleteModal(score, completionTime, totalWordsAttempted) {
            // Use the existing game over modal but update the message
            document.getElementById('final-correct').textContent = gameState.correctAnswers;
            document.getElementById('final-incorrect').textContent = gameState.incorrectAnswers;
            document.getElementById('final-score').textContent = score;
            
            const modal = document.getElementById('game-over-modal');
            
            // Add completion message
            let completionMessage = modal.querySelector('.completion-message');
            if (!completionMessage) {
                completionMessage = document.createElement('div');
                completionMessage.className = 'completion-message';
                completionMessage.style.cssText = 'margin-bottom: 15px; font-size: 18px; color: #27ae60; font-weight: bold;';
                modal.querySelector('.modal-content') ? 
                    modal.querySelector('.modal-content').insertBefore(completionMessage, modal.querySelector('.modal-content').firstChild) :
                    modal.insertBefore(completionMessage, modal.firstChild);
            }
            
            completionMessage.innerHTML = `🎉 Congratulations! You completed all ${totalWordsAttempted} words!`;
            modal.style.display = 'flex';
        }

        function logDropGame(score, completionTime, isGameCompleted) {
            // Calculate total words attempted across all batches
            const totalWordsAttempted = Math.min(gameState.allGameWords.length, (gameState.currentBatch + 1) * gameState.wordsPerBatch);
            
            // Prepare game data using actual question results
            const gameData = {
                questions: gameState.questionResults.map((result, index) => ({
                    questionId: index + 1,
                    englishWord: result.englishWord,
                    correctAnswer: result.correctAnswer,
                    isCorrect: result.isCorrect,
                    timestamp: result.timestamp
                })),
                gameType: 'drop'
            };

            // Get current level information
            let level = 0; // Default level if no level manager or level data
            if (typeof LevelManager !== 'undefined') {
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.groupIndex !== undefined) {
                    level = levelData.groupIndex;
                }
            }

            const logData = {
                totalQuestions: gameState.questionResults.length,
                correctAnswers: gameState.correctAnswers,
                incorrectAnswers: gameState.incorrectAnswers,
                score: score,
                completionTime: completionTime,
                level: level,
                gameData: gameData,
                gameType: 'drop'
            };

            if (gameState.currentLogId) {
                // Update existing log (for any continuation or completion of the current session)
                apiService.updateDropGame(gameState.currentLogId, logData, function(err, result) {
                    if (err) {
                        console.error('Failed to update drop game log:', err);
                    } else {
                        console.log('Drop game log updated successfully - Total words attempted:', totalWordsAttempted);
                    }
                });
            } else {
                // Create new log (only when starting a completely new game session)
                apiService.logDropGame(logData, function(err, result) {
                    if (err) {
                        console.error('Failed to log drop game:', err);
                    } else {
                        console.log('Drop game logged successfully - Total words attempted:', totalWordsAttempted);
                        if (result && result.logId) {
                            // Store the log ID for future updates in this session
                            gameState.currentLogId = result.logId;
                        }
                    }
                });
            }
        }

        function addMissedWord(frenchWord) {
            // Get or create the missed words container
            let missedContainer = document.getElementById('missed-words-container');
            if (!missedContainer) {
                missedContainer = document.createElement('div');
                missedContainer.id = 'missed-words-container';
                missedContainer.className = 'missed-words-stack';
                canvas.appendChild(missedContainer);
            }

            // Create missed word element
            const missedWordElement = document.createElement('div');
            missedWordElement.className = 'missed-word-item';
            missedWordElement.textContent = frenchWord;
            
            // Add fade-in animation
            missedWordElement.style.opacity = '0';
            missedWordElement.style.transform = 'translateY(20px)';
            
            // Insert at the top of the stack (most recent first)
            missedContainer.insertBefore(missedWordElement, missedContainer.firstChild);
            
            // Animate in
            setTimeout(() => {
                missedWordElement.style.opacity = '1';
                missedWordElement.style.transform = 'translateY(0)';
            }, 50);
            
            // Limit the number of visible missed words (keep only last 5)
            const missedWords = missedContainer.children;
            if (missedWords.length > 5) {
                // Remove oldest items with fade out
                for (let i = 5; i < missedWords.length; i++) {
                    const oldWord = missedWords[i];
                    oldWord.style.opacity = '0';
                    oldWord.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (oldWord.parentNode) {
                            oldWord.remove();
                        }
                    }, 300);
                }
            }
        }

        function playCorrectSound() {
            // Create audio context for generating a pleasant success sound
            try {
                console.log('🎵 Playing custom M4A audio file...');
                
                // First try: Use URL with cache busting
                const audio = new Audio();
                const audioUrl = 'media/me.mp3?' + Date.now(); // Cache busting
                
                // Set up comprehensive event handling
                let hasLoaded = false;
                
                audio.onloadstart = () => {
                    console.log('🎵 Audio loading started...');
                };
                
                audio.onloadeddata = () => {
                    console.log('🎵 MP3 file data loaded successfully');
                    hasLoaded = true;
                };
                
                audio.oncanplay = () => {
                    console.log('🎵 MP3 file can play');
                    if (hasLoaded) {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('🎵 Successfully playing me.mp3 for false sound');
                            }).catch(error => {
                                console.log('🎵 Playback failed:', error.message);
                                fallbackToDefault();
                            });
                        }
                    }
                };
                
                audio.onerror = (e) => {
                    console.log('🎵 MP3 file failed to load, trying alternative approach...');
                    console.log('🎵 Error details:', e);
                    fallbackToDefault();
                };
                
                // Add timeout for safety
                const loadTimeout = setTimeout(() => {
                    if (!hasLoaded) {
                        console.log('🎵 Audio loading timeout, trying alternative...');
                        fallbackToDefault();
                    }
                }, 3000);
                
                audio.onload = () => {
                    clearTimeout(loadTimeout);
                };
                
                // Set properties and load
                audio.volume = 0.6;
                audio.preload = 'auto';
                audio.src = audioUrl;
                audio.load();
                
            } catch (error) {
                console.log('🎵 Audio setup failed:', error.message);
                fallbackToDefault();
            }
        }

        function playFalseSound() {
            // Try multiple approaches to play the audio file
            try {
                console.log('🎵 Playing custom M4A audio file...');
                
                // First try: Use URL with cache busting
                const audio = new Audio();
                const audioUrl = 'media/true.mp3?' + Date.now(); // Cache busting
                
                // Set up comprehensive event handling
                let hasLoaded = false;
                
                audio.onloadstart = () => {
                    console.log('🎵 Audio loading started...');
                };
                
                audio.onloadeddata = () => {
                    console.log('🎵 MP3 file data loaded successfully');
                    hasLoaded = true;
                };
                
                audio.oncanplay = () => {
                    console.log('🎵 MP3 file can play');
                    if (hasLoaded) {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('🎵 Successfully playing true.mp3 for false sound');
                            }).catch(error => {
                                console.log('🎵 Playback failed:', error.message);
                                fallbackToDefault();
                            });
                        }
                    }
                };
                
                audio.onerror = (e) => {
                    console.log('🎵 MP3 file failed to load, trying alternative approach...');
                    console.log('🎵 Error details:', e);
                    fallbackToDefault();
                };
                
                // Add timeout for safety
                const loadTimeout = setTimeout(() => {
                    if (!hasLoaded) {
                        console.log('🎵 Audio loading timeout, trying alternative...');
                        fallbackToDefault();
                    }
                }, 3000);
                
                audio.onload = () => {
                    clearTimeout(loadTimeout);
                };
                
                // Set properties and load
                audio.volume = 0.6;
                audio.preload = 'auto';
                audio.src = audioUrl;
                audio.load();
                
            } catch (error) {
                console.log('🎵 Audio setup failed:', error.message);
                fallbackToDefault();
            }
        }
        
        function playCuteKidSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create a sequence of gentle, cute tones
                const playTone = (frequency, startTime, duration, volume = 0.15) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.frequency.setValueAtTime(frequency, startTime);
                    oscillator.type = 'sine'; // Soft sine wave
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Gentle envelope
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                };
                
                // Create a cute "oops" melody pattern (like a gentle giggle)
                const currentTime = audioContext.currentTime;
                
                // First note: higher pitch (like "oh")
                playTone(520, currentTime, 0.15, 0.12); // C5
                
                // Second note: lower pitch (like "oops")
                playTone(415, currentTime + 0.12, 0.2, 0.1); // G#4
                
                // Third note: even lower (like a gentle sigh)
                playTone(349, currentTime + 0.25, 0.25, 0.08); // F4
                
                // Add a subtle vibrato effect to the last note
                setTimeout(() => {
                    try {
                        const vibratoOsc = audioContext.createOscillator();
                        const vibratoGain = audioContext.createGain();
                        
                        vibratoOsc.frequency.setValueAtTime(330, currentTime + 0.3);
                        vibratoOsc.frequency.setValueAtTime(340, currentTime + 0.35);
                        vibratoOsc.frequency.setValueAtTime(330, currentTime + 0.4);
                        vibratoOsc.type = 'sine';
                        
                        vibratoOsc.connect(vibratoGain);
                        vibratoGain.connect(audioContext.destination);
                        
                        vibratoGain.gain.setValueAtTime(0.05, currentTime + 0.3);
                        vibratoGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.45);
                        
                        vibratoOsc.start(currentTime + 0.3);
                        vibratoOsc.stop(currentTime + 0.45);
                    } catch (e) {
                        // Vibrato failed, but main sound still works
                    }
                }, 100);
                
            } catch (error) {
                console.log('🔊 CUTE KID SOUND! 👶 (Audio not available)');
            }
        }
        
        // Audio recording functions
        async function startRecording() {
            try {
                console.log('🎙️ Requesting microphone access...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    } 
                });
                
                console.log('🎙️ Microphone access granted!');
                
                // Try different formats in order of compatibility
                let mimeType = 'audio/wav';
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                    mimeType = 'audio/ogg;codecs=opus';
                }
                
                console.log('🎙️ Using format:', mimeType);
                
                mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
                const audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    console.log('🎙️ Audio data received, size:', event.data.size);
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    console.log('🎙️ Recording stopped, creating blob...');
                    recordedAudioBlob = new Blob(audioChunks, { type: mimeType });
                    console.log('🎙️ Recorded blob created, size:', recordedAudioBlob.size, 'type:', mimeType);
                    
                    // Stop all tracks to free up the microphone
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log('🎙️ Microphone track stopped');
                    });
                    
                    console.log('🎙️ Recording saved! You can now use your custom sound.');
                    showRecordingStatus('Recording saved! Press T to test ✓');
                };
                
                mediaRecorder.onerror = (event) => {
                    console.error('🎙️ MediaRecorder error:', event.error);
                    showRecordingStatus('Recording failed ❌');
                };
                
                mediaRecorder.start(100); // Collect data every 100ms
                isRecording = true;
                console.log('🎙️ Recording started... Speak now!');
                
            } catch (error) {
                console.error('Error accessing microphone:', error);
                showRecordingStatus('Microphone access denied ❌');
                alert('Could not access microphone. Please make sure you allow microphone access and refresh the page.');
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                console.log('🎙️ Recording stopped!');
            }
        }
        
        function playRecordedSound() {
            console.log('🎙️ Attempting to play recorded sound...');
            console.log('🎙️ Recording blob available:', !!recordedAudioBlob);
            
            if (recordedAudioBlob) {
                console.log('🎙️ Blob type:', recordedAudioBlob.type, 'size:', recordedAudioBlob.size);
                
                // Try Web Audio API first (more reliable for blob playback)
                if (recordedAudioBlob.size > 0) {
                    tryWebAudioPlayback();
                } else {
                    console.error('🎙️ Recorded audio blob is empty');
                    fallbackToDefault();
                }
            } else {
                console.log('🎙️ No recorded sound available. Please record a sound first.');
                console.log('🔊 Use: Press R to record, S to stop, T to test, D to download');
                fallbackToDefault();
            }
        }
        
        function tryWebAudioPlayback() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const fileReader = new FileReader();
                
                fileReader.onload = function(e) {
                    console.log('🎙️ File read complete, decoding audio...');
                    
                    audioContext.decodeAudioData(e.target.result).then(function(buffer) {
                        console.log('🎙️ Audio decoded successfully! Duration:', buffer.duration, 'seconds');
                        
                        const source = audioContext.createBufferSource();
                        const gainNode = audioContext.createGain();
                        
                        source.buffer = buffer;
                        source.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Set volume
                        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
                        
                        // Play
                        source.start(0);
                        console.log('🎙️ Playing recorded sound via Web Audio API');
                        
                        source.onended = () => {
                            console.log('🎙️ Recorded sound finished playing');
                        };
                        
                    }).catch(function(error) {
                        console.error('🎙️ Audio decoding failed:', error);
                        console.log('🎙️ Trying HTML Audio element instead...');
                        tryHTMLAudioPlayback();
                    });
                };
                
                fileReader.onerror = function(error) {
                    console.error('🎙️ FileReader error:', error);
                    tryHTMLAudioPlayback();
                };
                
                fileReader.readAsArrayBuffer(recordedAudioBlob);
                
            } catch (error) {
                console.error('🎙️ Web Audio API error:', error);
                tryHTMLAudioPlayback();
            }
        }
        
        function tryHTMLAudioPlayback() {
            try {
                console.log('🎙️ Creating HTML Audio element...');
                const audioUrl = URL.createObjectURL(recordedAudioBlob);
                const audio = new Audio();
                
                // Set up event listeners first
                audio.onloadstart = () => console.log('🎙️ Audio loading started...');
                audio.onloadeddata = () => console.log('🎙️ Audio data loaded');
                audio.oncanplay = () => {
                    console.log('🎙️ Audio can play! Duration:', audio.duration);
                    // Try to play now that we know it can play
                    audio.play().then(() => {
                        console.log('🎙️ HTML Audio playback started successfully');
                    }).catch(e => {
                        console.error('🎙️ HTML Audio play() failed:', e);
                        fallbackToDefault();
                    });
                };
                
                audio.onplay = () => console.log('🎙️ Audio started playing!');
                audio.onended = () => {
                    console.log('🎙️ Audio finished playing!');
                    URL.revokeObjectURL(audioUrl); // Clean up
                };
                
                audio.onerror = (e) => {
                    console.error('🎙️ HTML Audio error:', e);
                    console.error('🎙️ Error code:', audio.error ? audio.error.code : 'unknown');
                    URL.revokeObjectURL(audioUrl);
                    fallbackToDefault();
                };
                
                // Set properties
                audio.volume = 0.8;
                audio.preload = 'auto';
                
                // Set source and load
                audio.src = audioUrl;
                audio.load(); // Force load
                
            } catch (error) {
                console.error('🎙️ HTML Audio setup error:', error);
                fallbackToDefault();
            }
        }
        
        function fallbackToDefault() {
            console.log('🔊 Falling back to cute kid sound');
            playCuteKidSound();
        }
        
        function downloadRecording() {
            if (!recordedAudioBlob) {
                console.log('💾 No recording to download. Please record something first.');
                showRecordingStatus('No recording available ❌');
                return;
            }
            
            console.log('💾 Starting download of recorded audio...');
            
            try {
                // Create download link
                const url = URL.createObjectURL(recordedAudioBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Generate filename with timestamp
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const extension = recordedAudioBlob.type.includes('webm') ? 'webm' : 
                                recordedAudioBlob.type.includes('mp4') ? 'mp4' : 'wav';
                a.download = `my-voice-${timestamp}.${extension}`;
                
                // Add to DOM, click, and remove
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Clean up URL after a delay
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                console.log('💾 Download started for file:', a.download);
                showRecordingStatus(`Downloaded: ${a.download} ✓`);
                
            } catch (error) {
                console.error('💾 Download failed:', error);
                showRecordingStatus('Download failed ❌');
            }
        }
        
        // Add keyboard shortcuts for recording
        document.addEventListener('keydown', function(e) {
            // Press R to start recording
            if (e.key.toLowerCase() === 'r' && !isRecording && !gameState.isPlaying) {
                startRecording();
                showRecordingStatus('Recording... Press S to stop');
            }
            // Press S to stop recording
            else if (e.key.toLowerCase() === 's' && isRecording) {
                stopRecording();
                showRecordingStatus('Recording saved! ✓');
            }
            // Press T to test recorded sound
            else if (e.key.toLowerCase() === 't' && !gameState.isPlaying) {
                playRecordedSound();
            }
            // Press D to download recorded sound
            else if (e.key.toLowerCase() === 'd' && !gameState.isPlaying) {
                downloadRecording();
            }
        });
        
        function showRecordingStatus(message) {
            // Create or update status message
            let statusDiv = document.getElementById('recording-status');
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.id = 'recording-status';
                statusDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    z-index: 1000;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(statusDiv);
            }
            
            statusDiv.textContent = message;
            statusDiv.style.opacity = '1';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (statusDiv && statusDiv.parentNode) {
                            statusDiv.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }
        

        function onError(err) {
            console.error(err);
            // You can add visual error display here if needed
            alert('Error: ' + err);
        }

        function loadUserInfo() {
            apiService.getCurrentUser(function(err, user) {
                if (err) {
                    console.error('Failed to load user info:', err);
                    return;
                }
                
                const usernameElement = document.getElementById("current-username");
                if (usernameElement && user) {
                    usernameElement.textContent = user.username;
                }
            });
        }

        // Initialize level system and load appropriate vocabulary
        (function refresh() {
            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for drop game
                if (!LevelManager.initializeLevel('drop')) {
                    return; // Will redirect to level selection if needed
                }
                
                console.log('Drop game initialized with level:', LevelManager.getCurrentLevelInfo());
                
                // Check if we need to start a new game after level selection
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.images) {
                    // Check if this is a fresh level selection by looking at URL params
                    const urlParams = new URLSearchParams(window.location.search);
                    const fromLevelSelect = urlParams.get('newLevel') === 'true';
                    
                    if (fromLevelSelect) {
                        // Remove the parameter from URL for clean state
                        const url = new URL(window.location);
                        url.searchParams.delete('newLevel');
                        window.history.replaceState({}, document.title, url.pathname + url.search);
                        
                        // Start a new game with the selected level
                        console.log('New level selected, starting fresh game...');
                        setTimeout(() => {
                            newGame();
                        }, 100); // Small delay to ensure UI is ready
                        return; // Exit early to avoid double loading
                    }
                }
            }
            
            // Load vocabulary (this will handle level-specific loading)
            // This will be called after LevelManager setup only if not starting a new game
            loadVocabulary();
        }());
    });

    return {};
})();
