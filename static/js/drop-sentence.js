let dropSentenceGame = (function() {
    "use strict";

    // Game state
    let gameState = {
        isPlaying: false,
        fallingSentences: [],
        currentSentences: [],
        correctAnswers: 0,
        incorrectAnswers: 0,
        gameTimer: null,
        sentenceDropTimer: null,
        sentenceIndex: 0,
        gameStartTime: null,
        totalSentences: 5,
        sentenceSpeed: 0.25, // pixels per frame (slower than words)
        currentBatch: 0,
        sentencesPerBatch: 5,
        allGameSentences: [], // All sentences for the entire session
        gameCompleted: false,
        currentLogId: null, // Track current log entry for updates
        questionResults: [], // Track individual question results
        currentSentenceData: null, // Current sentence being played
        selectedWord: null, // Currently selected word option
        globalQuestionCounter: 0 // Global counter for question IDs across all batches
    };

    // This will be populated from the database
    let SENTENCES = [];
    let VOCABULARY = []; // For getting additional words

    window.addEventListener("load", function() {
        const canvas = document.getElementById('game-canvas');
        const startBtn = document.getElementById('start-game-btn');
        const restartBtn = document.getElementById('restart-game-btn');
        const backBtn = document.getElementById('bc');
        const dropSentenceLogsBtn = document.getElementById('drop-sentence-logs-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const backToMenuBtn = document.getElementById('back-to-menu-btn');

        // Initialize game
        initializeGame();

        // Event listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);

        backBtn.addEventListener('click', function() {
            window.location.href = '/';
        });

        // Add event listener for level select button
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', function() {
                window.location.href = '/group-select.html?game=drop-sentence&returnTo=drop-sentence';
            });
        }

        dropSentenceLogsBtn.addEventListener('click', function() {
            window.location.href = '/logs';
        });

        playAgainBtn.addEventListener('click', function() {
            hideGameOverModal();
            newGame();
        });

        backToMenuBtn.addEventListener('click', function() {
            window.location.href = '/';
        });

        // Load user info
        loadUserInfo();

        // Load sentences and vocabulary from database
        function loadSentencesAndVocabulary() {
            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for drop sentence game
                if (!LevelManager.initializeLevel('drop-sentence')) {
                    return; // Will redirect to level selection if needed
                }

                // Get the current level's image IDs
                const currentLevelImages = LevelManager.getCurrentLevelImages();
                if (!currentLevelImages || currentLevelImages.length === 0) {
                    console.error('No images found for current level');
                    showError('No images found for this level. Please select a different level.');
                    return;
                }

                // Load sentences for current level
                loadSentencesForLevel(currentLevelImages);
            } else {
                console.error('LevelManager not available');
                showError('Level management system not available.');
            }
        }

        function loadSentencesForLevel(imageIds) {
            let loadedSentences = [];
            let completedRequests = 0;
            const totalRequests = imageIds.length;

            if (totalRequests === 0) {
                console.error('No images to load sentences for');
                showError('No sentences available for this level.');
                return;
            }

            // Load all images data first, then check sentences
            apiService.getGraphs(function(imagesErr, allImages) {
                if (imagesErr) {
                    console.error('Error loading images:', imagesErr);
                    showError('Error loading images data.');
                    return;
                }

                VOCABULARY = allImages || []; // Store vocabulary globally

                // Load sentences for each image
                imageIds.forEach(imageId => {
                    apiService.getSentence(imageId, function(err, sentence) {
                        completedRequests++;
                        
                        if (!err && sentence && sentence.sentence && sentence.sentence.trim()) {
                            // Find the word for this image
                            const imageData = allImages.find(img => img._id === imageId);
                            if (imageData && imageData.author) { // Use 'author' field which contains the French word
                                loadedSentences.push({
                                    sentence: sentence.sentence,
                                    correctWord: imageData.author,
                                    imageId: imageId
                                });
                                console.log(`Loaded sentence for image ${imageId}: "${imageData.author}"`);
                            }
                        } else {
                            // This image doesn't have a sentence (404 or empty) - that's okay
                            console.log(`No sentence found for image ${imageId} (expected for images without sentences)`);
                        }
                        
                        if (completedRequests === totalRequests) {
                            processSentencesData(loadedSentences, imageIds);
                        }
                    });
                });
            });
        }

        function processSentencesData(sentences, allImageIds) {
            console.log(`Found ${sentences.length} sentences out of ${allImageIds.length} images in this level`);
            
            if (sentences.length === 0) {
                console.error('No sentences with content found');
                showError('No sentences found for this level. Please add sentences to images first by visiting the gallery and clicking on images to add sentences.');
                return;
            }

            if (sentences.length < 3) {
                console.warn('Very few sentences available for this level');
                // Still allow the game to continue, just show a warning
                console.log(`Continuing with ${sentences.length} sentences available.`);
            }

            // VOCABULARY is already loaded in loadSentencesForLevel
            SENTENCES = sentences;
            
            console.log(`Loaded ${SENTENCES.length} sentences and ${VOCABULARY.length} vocabulary words`);
            
            // Enable start button
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'Start Game';
            }
        }

        // Load sentences and vocabulary
        loadSentencesAndVocabulary();

        function initializeGame() {
            // Reset game state
            gameState.isPlaying = false;
            gameState.fallingSentences = [];
            gameState.currentSentences = [];
            gameState.correctAnswers = 0;
            gameState.incorrectAnswers = 0;
            gameState.sentenceIndex = 0;
            gameState.gameCompleted = false;
            gameState.currentLogId = null;
            gameState.questionResults = [];
            gameState.currentSentenceData = null;
            gameState.selectedWord = null;
            gameState.currentBatch = 0;
            gameState.allGameSentences = [];
            gameState.globalQuestionCounter = 0;

            // Update UI
            updateScore();
            clearCanvas();
            clearWordOptions();
            hideSentencePrompt();

            // Disable start button until data is loaded
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = 'Loading...';
            }
        }

        function startGame() {
            if (SENTENCES.length === 0) {
                showError('No sentences available. Please select a level with sentences.');
                return;
            }

            // Initialize all game sentences on first start
            if (gameState.currentBatch === 0 && gameState.allGameSentences.length === 0) {
                gameState.allGameSentences = [...SENTENCES].sort(() => Math.random() - 0.5); // Randomize
                if (gameState.allGameSentences.length === 0) {
                    showError('No sentences to play with.');
                    return;
                }
            }

            // Load current batch of sentences
            gameState.currentSentences = getCurrentBatch();
            
            if (gameState.currentSentences.length === 0) {
                showError('No more sentences available.');
                return;
            }

            // Reset sentence tracking for this batch
            gameState.isPlaying = true;
            gameState.sentenceIndex = 0;
            
            // Only reset score/time on first batch
            if (gameState.currentBatch === 0) {
                gameState.correctAnswers = 0;
                gameState.incorrectAnswers = 0;
                gameState.gameStartTime = new Date();
                gameState.questionResults = [];
            }

            // Update UI
            startBtn.style.display = 'none';
            restartBtn.style.display = 'inline-flex';
            updateScore();

            // Start the first sentence of this batch
            nextSentence();

            // Note: We don't log at game start anymore, only when there's actual game data
        }

        function getCurrentBatch() {
            const startIndex = gameState.currentBatch * gameState.sentencesPerBatch;
            const endIndex = Math.min(startIndex + gameState.sentencesPerBatch, gameState.allGameSentences.length);
            
            if (startIndex >= gameState.allGameSentences.length) {
                return [];
            }
            
            const batch = gameState.allGameSentences.slice(startIndex, endIndex);
            console.log(`📚 Loading batch ${gameState.currentBatch + 1}: sentences ${startIndex + 1}-${endIndex} of ${gameState.allGameSentences.length}`);
            return batch;
        }

        function nextSentence() {
            if (gameState.sentenceIndex >= gameState.currentSentences.length) {
                checkGameEnd();
                return;
            }

            const sentenceData = gameState.currentSentences[gameState.sentenceIndex];
            gameState.currentSentenceData = sentenceData;

            // Generate word options
            generateWordOptions(sentenceData.correctWord);

            // Start dropping this sentence with blanks
            dropSentence(sentenceData.sentence);
        }

        function checkGameEnd() {
            // Check if there are more sentences to play
            const nextBatchStart = (gameState.currentBatch + 1) * gameState.sentencesPerBatch;
            const hasMoreSentences = nextBatchStart < gameState.allGameSentences.length;
            
            if (hasMoreSentences) {
                showContinueModal();
            } else {
                gameState.gameCompleted = true;
                endGame();
            }
        }

        function createSentenceWithBlank(sentence, correctWord) {
            // Replace the correct word with a blank placeholder
            // Use case-insensitive replacement and handle word boundaries
            const regex = new RegExp(`\\b${correctWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            return sentence.replace(regex, '___');
        }

        function displaySentencePrompt(sentenceWithBlank) {
            // The sentence with blank will be shown in the falling sentence itself
            // No need for a separate display area
        }

        function hideSentencePrompt() {
            // No prompt area to hide since sentences fall directly
        }

        function generateWordOptions(correctWord) {
            const container = document.getElementById('word-buttons-container');
            if (!container) return;

            // Clear previous options
            container.innerHTML = '';
            gameState.selectedWord = null;

            // Get wrong options from vocabulary (different from correct word)
            const wrongOptions = VOCABULARY
                .filter(item => item.author && item.author.toLowerCase() !== correctWord.toLowerCase())
                .map(item => item.author)
                .sort(() => Math.random() - 0.5)
                .slice(0, 7); // Get 7 wrong options

            // Combine with correct word and shuffle
            const allOptions = [correctWord, ...wrongOptions].sort(() => Math.random() - 0.5);

            // Create buttons for each option
            allOptions.forEach(word => {
                const button = document.createElement('button');
                button.className = 'word-option-btn';
                button.textContent = word;
                button.onclick = () => selectWordOption(button, word);
                container.appendChild(button);
            });
        }

        function selectWordOption(button, word) {
            if (!gameState.isPlaying || !gameState.currentSentenceData) return;

            // Remove previous selection
            document.querySelectorAll('.word-option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // Select this option
            button.classList.add('selected');
            gameState.selectedWord = word;

            // Check if answer is correct
            const isCorrect = word.toLowerCase() === gameState.currentSentenceData.correctWord.toLowerCase();
            
            if (isCorrect) {
                handleCorrectAnswer(button);
            } else {
                handleIncorrectAnswer(button);
            }
        }

        function handleCorrectAnswer(button) {
            button.classList.add('correct');
            gameState.correctAnswers++;
            
            // Stop the falling sentence animation by marking it as matched
            markFallingSentenceMatched();
            
            // Play correct sound effect (same as drop word game)
            playCorrectSound();
            
            // Increment global question counter and record detailed result
            gameState.globalQuestionCounter++;
            gameState.questionResults.push({
                questionId: gameState.globalQuestionCounter,
                sentence: gameState.currentSentenceData.sentence,
                correctAnswer: gameState.currentSentenceData.correctWord,
                selectedAnswer: gameState.selectedWord,
                isCorrect: true,
                timestamp: new Date()
            });

            // Show correct indicator
            showIndicator('correct');

            // Create fireworks effect
            createFireworks();

            // Update score and continue
            updateScore();
            setTimeout(() => {
                disableAllWordOptions();
                setTimeout(() => {
                    clearWordOptions();
                    gameState.sentenceIndex++;
                    nextSentence();
                }, 1500);
            }, 1000);
        }

        function handleIncorrectAnswer(button) {
            button.classList.add('incorrect');
            gameState.incorrectAnswers++;

            // Stop the falling sentence animation and turn it red instead of green explosion
            markFallingSentenceIncorrect();

            // Same effect as drop out - add to missed stack and play false sound
            addMissedSentence(gameState.currentSentenceData);
            playFalseSound();

            // Increment global question counter and record detailed result
            gameState.globalQuestionCounter++;
            gameState.questionResults.push({
                questionId: gameState.globalQuestionCounter,
                sentence: gameState.currentSentenceData.sentence,
                correctAnswer: gameState.currentSentenceData.correctWord,
                selectedAnswer: gameState.selectedWord,
                isCorrect: false,
                timestamp: new Date()
            });

            // Show incorrect indicator
            showIndicator('incorrect');

            // Display correct answer in bottom-left corner like drop word game
            showCorrectAnswer(gameState.currentSentenceData.correctWord);

            // Highlight correct answer in the word options
            setTimeout(() => {
                document.querySelectorAll('.word-option-btn').forEach(btn => {
                    if (btn.textContent.toLowerCase() === gameState.currentSentenceData.correctWord.toLowerCase()) {
                        btn.classList.add('correct');
                    }
                });
            }, 500);

            // Update score and continue
            updateScore();
            setTimeout(() => {
                disableAllWordOptions();
                setTimeout(() => {
                    clearWordOptions();
                    gameState.sentenceIndex++;
                    nextSentence();
                }, 2000);
            }, 1500);
        }

        function disableAllWordOptions() {
            document.querySelectorAll('.word-option-btn').forEach(btn => {
                btn.disabled = true;
            });
        }

        function clearWordOptions() {
            const container = document.getElementById('word-buttons-container');
            if (container) {
                container.innerHTML = '';
            }
        }

        function dropSentence(sentence) {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return;

            // Create sentence with blank to show as it falls
            const sentenceWithBlank = createSentenceWithBlank(sentence, gameState.currentSentenceData.correctWord);

            const sentenceElement = document.createElement('div');
            sentenceElement.className = 'falling-sentence';
            sentenceElement.id = 'sentence-with-blank'; // Add the ID as requested
            sentenceElement.innerHTML = sentenceWithBlank.replace('___', '<span class="sentence-blank">___</span>');
            
            // Calculate proper position to keep sentence within canvas bounds
            const canvasRect = canvas.getBoundingClientRect();
            const sentenceMaxWidth = 400; // Max width from CSS
            const padding = 20; // Safety padding
            const maxX = Math.max(padding, canvasRect.width - sentenceMaxWidth - padding);
            const startX = Math.random() * maxX + padding;
            
            sentenceElement.style.left = startX + 'px';
            sentenceElement.style.top = '-50px';
            
            canvas.appendChild(sentenceElement);
            gameState.fallingSentences.push({
                element: sentenceElement,
                y: -50,
                matched: false
            });

            // Start falling animation
            animateFallingSentence(sentenceElement);
        }

        function animateFallingSentence(element) {
            let y = -50;
            const canvasHeight = document.getElementById('game-canvas').offsetHeight;
            
            function fall() {
                // Check if game is still playing and sentence is not stopped
                if (!gameState.isPlaying || element.getAttribute('data-stopped') === 'true') {
                    return;
                }
                
                y += gameState.sentenceSpeed;
                element.style.top = y + 'px';
                
                // Check if sentence reached bottom
                if (y > canvasHeight - 50) {
                    // Sentence missed - same effect as drop word game
                    addMissedSentence(gameState.currentSentenceData);
                    playFalseSound();
                    
                    element.remove();
                    // Remove from tracking array
                    gameState.fallingSentences = gameState.fallingSentences.filter(s => s.element !== element);
                    
                    // Increment incorrect answers and global question counter, track detailed result
                    gameState.incorrectAnswers++;
                    gameState.globalQuestionCounter++;
                    gameState.questionResults.push({
                        questionId: gameState.globalQuestionCounter,
                        sentence: gameState.currentSentenceData.sentence,
                        correctAnswer: gameState.currentSentenceData.correctWord,
                        selectedAnswer: null, // No word was selected
                        isCorrect: false,
                        timestamp: new Date()
                    });
                    
                    // Update score and move to next sentence
                    updateScore();
                    showIndicator('incorrect');
                    
                    setTimeout(() => {
                        clearWordOptions();
                        gameState.sentenceIndex++;
                        nextSentence();
                    }, 1500);
                } else {
                    requestAnimationFrame(fall);
                }
            }
            
            requestAnimationFrame(fall);
        }

        function markFallingSentenceMatched() {
            gameState.fallingSentences.forEach(sentence => {
                if (!sentence.matched) {
                    sentence.element.classList.add('matched');
                    sentence.matched = true;
                    
                    // Stop the animation by setting a flag that the animation function will check
                    sentence.element.setAttribute('data-stopped', 'true');
                    
                    // Remove after animation
                    setTimeout(() => {
                        sentence.element.classList.add('exploding');
                        setTimeout(() => {
                            sentence.element.remove();
                            // Remove from tracking array
                            gameState.fallingSentences = gameState.fallingSentences.filter(s => s.element !== sentence.element);
                        }, 600);
                    }, 500);
                }
            });
        }

        function markFallingSentenceIncorrect() {
            gameState.fallingSentences.forEach(sentence => {
                if (!sentence.matched) {
                    sentence.element.classList.add('incorrect-sentence');
                    sentence.matched = true;
                    
                    // Stop the animation by setting a flag that the animation function will check
                    sentence.element.setAttribute('data-stopped', 'true');
                    
                    // Turn red and fade away instead of exploding
                    setTimeout(() => {
                        sentence.element.style.color = '#ff4757';
                        sentence.element.style.opacity = '0';
                        sentence.element.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            sentence.element.remove();
                            // Remove from tracking array
                            gameState.fallingSentences = gameState.fallingSentences.filter(s => s.element !== sentence.element);
                        }, 800);
                    }, 200);
                }
            });
        }

        function showIndicator(type) {
            const indicator = document.getElementById(type + '-indicator');
            if (indicator) {
                indicator.style.display = 'flex';
                indicator.classList.add('show');
                
                setTimeout(() => {
                    indicator.classList.remove('show');
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 300);
                }, 1000);
            }
        }

        function createFireworks() {
            const container = document.getElementById('fireworks-container');
            if (!container) return;

            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
            const centerX = container.offsetWidth / 2;
            const centerY = container.offsetHeight / 2;

            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle';
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.color = color;
                
                const angle = (Math.PI * 2 * i) / 20;
                const velocity = 100 + Math.random() * 100;
                const endX = centerX + Math.cos(angle) * velocity;
                const endY = centerY + Math.sin(angle) * velocity;
                
                particle.style.left = centerX + 'px';
                particle.style.top = centerY + 'px';
                
                container.appendChild(particle);
                
                // Animate particle
                setTimeout(() => {
                    particle.style.transition = 'all 1s ease-out';
                    particle.style.left = endX + 'px';
                    particle.style.top = endY + 'px';
                    particle.style.opacity = '0';
                    
                    setTimeout(() => {
                        particle.remove();
                    }, 1000);
                }, 10);
            }
        }

        function updateScore() {
            const correctElement = document.getElementById('correct-count');
            const incorrectElement = document.getElementById('incorrect-count');
            
            if (correctElement) correctElement.textContent = gameState.correctAnswers;
            if (incorrectElement) incorrectElement.textContent = gameState.incorrectAnswers;
        }

        function clearCanvas() {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                // Remove all falling sentences
                canvas.querySelectorAll('.falling-sentence').forEach(el => el.remove());
                
                // Clear fireworks
                const fireworksContainer = document.getElementById('fireworks-container');
                if (fireworksContainer) {
                    fireworksContainer.innerHTML = '';
                }
                
                // Clear missed sentences container
                const missedContainer = document.getElementById('missed-sentences-container');
                if (missedContainer) {
                    missedContainer.remove();
                }
                
                // Clear correct answer display container
                const correctAnswerContainer = document.getElementById('correct-answer-display');
                if (correctAnswerContainer) {
                    correctAnswerContainer.remove();
                }
            }
            
            gameState.fallingSentences = [];
        }

        function addMissedSentence(sentenceData) {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return;
            
            // Get or create the missed sentences container
            let missedContainer = document.getElementById('missed-sentences-container');
            if (!missedContainer) {
                missedContainer = document.createElement('div');
                missedContainer.id = 'missed-sentences-container';
                missedContainer.className = 'missed-words-stack'; // Reuse the same CSS class
                canvas.appendChild(missedContainer);
            }

            // Create missed sentence element - show the word that was supposed to be filled
            const missedSentenceElement = document.createElement('div');
            missedSentenceElement.className = 'missed-word-item'; // Reuse the same CSS class
            missedSentenceElement.textContent = sentenceData.correctWord;
            
            // Add fade-in animation
            missedSentenceElement.style.opacity = '0';
            missedSentenceElement.style.transform = 'translateY(20px)';
            
            // Insert at the top of the stack (most recent first)
            missedContainer.insertBefore(missedSentenceElement, missedContainer.firstChild);
            
            // Animate in
            setTimeout(() => {
                missedSentenceElement.style.opacity = '1';
                missedSentenceElement.style.transform = 'translateY(0)';
            }, 10);
            
            // Keep only last 5 missed sentences to avoid clutter
            const missedItems = missedContainer.querySelectorAll('.missed-word-item');
            if (missedItems.length > 5) {
                missedItems[missedItems.length - 1].remove();
            }
        }

        function playFalseSound() {
            // Try to play the false sound (same as drop word game)
            try {
                console.log('🎵 Playing miss sound for dropped sentence...');
                
                const audio = new Audio();
                const audioUrl = 'media/true.mp3?' + Date.now(); // Using the same sound file
                
                let hasLoaded = false;
                
                audio.onloadstart = () => {
                    console.log('🎵 Audio loading started...');
                };

                audio.oncanplay = () => {
                    if (!hasLoaded) {
                        hasLoaded = true;
                        console.log('🎵 Audio can play, attempting playback...');
                        
                        // Set volume and play
                        audio.volume = 0.5;
                        const playPromise = audio.play();
                        
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('🎵 Audio playback successful!');
                            }).catch(error => {
                                console.log('🎵 Audio playback failed:', error);
                            });
                        }
                    }
                };

                audio.onerror = (error) => {
                    console.log('🎵 Audio error:', error);
                };

                audio.src = audioUrl;
                audio.load();
                
            } catch (error) {
                console.log('🎵 Error setting up audio:', error);
            }
        }

        function playCorrectSound() {
            // Play the same correct sound as drop word game
            try {
                console.log('🎵 Playing correct answer sound...');
                
                const audio = new Audio();
                const audioUrl = 'media/me.mp3?' + Date.now(); // Same sound file as drop word game
                
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
                        audio.volume = 0.7; // Slightly louder for positive feedback
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('🎵 Successfully playing me.mp3 for correct answer');
                            }).catch(error => {
                                console.log('🎵 Playback failed:', error.message);
                            });
                        }
                    }
                };

                audio.onerror = (error) => {
                    console.log('🎵 Audio error:', error);
                };

                audio.src = audioUrl;
                audio.load();
                
            } catch (error) {
                console.log('🎵 Error setting up correct sound audio:', error);
            }
        }

        function showCorrectAnswer(correctWord) {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return;
            
            // Get or create the correct answer display container
            let correctAnswerContainer = document.getElementById('correct-answer-display');
            if (!correctAnswerContainer) {
                correctAnswerContainer = document.createElement('div');
                correctAnswerContainer.id = 'correct-answer-display';
                correctAnswerContainer.className = 'correct-answer-display';
                canvas.appendChild(correctAnswerContainer);
            }

            // Create correct answer element
            // const correctAnswerElement = document.createElement('div');
            // correctAnswerElement.className = 'correct-answer-item';
            // correctAnswerElement.textContent = `Correct: ${correctWord}`;
            
            // Add fade-in animation
            // correctAnswerElement.style.opacity = '0';
            // correctAnswerElement.style.transform = 'translateY(-20px)';
            
            // Insert at the top of the container (most recent first)
            // correctAnswerContainer.insertBefore(correctAnswerElement, correctAnswerContainer.firstChild);
            
            // // Animate in
            // setTimeout(() => {
            //     correctAnswerElement.style.opacity = '1';
            //     correctAnswerElement.style.transform = 'translateY(0)';
            // }, 10);
            
            // // Auto-remove after 4 seconds
            // setTimeout(() => {
            //     correctAnswerElement.style.opacity = '0';
            //     correctAnswerElement.style.transform = 'translateY(-20px)';
            //     setTimeout(() => {
            //         if (correctAnswerElement.parentElement) {
            //             correctAnswerElement.remove();
            //         }
            //     }, 300);
            // }, 4000);
            
            // Keep only last 3 correct answers to avoid clutter
            // const correctAnswerItems = correctAnswerContainer.querySelectorAll('.correct-answer-item');
            // if (correctAnswerItems.length > 3) {
            //     correctAnswerItems[correctAnswerItems.length - 1].remove();
            // }
        }

        function showContinueModal() {
            gameState.isPlaying = false;
            
            // Calculate current progress
            const sentencesCompleted = (gameState.currentBatch + 1) * gameState.sentencesPerBatch;
            const totalSentences = gameState.allGameSentences.length;
            const remainingSentences = totalSentences - sentencesCompleted;
            
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
                        <p><strong>Sentences completed:</strong> <span id="continue-completed">${sentencesCompleted}</span> / ${totalSentences}</p>
                        <p><strong>Remaining:</strong> <span id="continue-remaining">${remainingSentences}</span> sentences</p>
                    </div>
                    <p style="margin-bottom: 25px; color: #7f8c8d;">
                        You've completed another batch! Would you like to continue with the next ${Math.min(remainingSentences, gameState.sentencesPerBatch)} sentences?
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
                    const totalQuestionsProcessed = gameState.correctAnswers + gameState.incorrectAnswers;
                    const correctCount = Number(gameState.correctAnswers) || 0;
                    const totalCount = Number(totalQuestionsProcessed) || 0;
                    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
                    const completionTime = Math.round((new Date() - gameState.gameStartTime) / 1000);
                    
                    // If no log exists yet, create one (this happens after first batch)
                    if (!gameState.currentLogId) {
                        logGameProgress(score, completionTime); // This will create the initial log
                    } else {
                        logGameProgress(score, completionTime); // This will update existing log
                    }
                    
                    // Clear the canvas to reset missed words and other game elements
                    clearCanvas();
                    clearWordOptions();
                    
                    gameState.currentBatch++;
                    startGame();
                });
                
                document.getElementById('continue-no-btn').addEventListener('click', function() {
                    hideContinueModal();
                    gameState.gameCompleted = true;
                    endGame();
                });
            } else {
                // Update existing modal content
                document.getElementById('continue-correct').textContent = gameState.correctAnswers;
                document.getElementById('continue-incorrect').textContent = gameState.incorrectAnswers;
                document.getElementById('continue-completed').textContent = sentencesCompleted;
                document.getElementById('continue-remaining').textContent = remainingSentences;
                continueModal.style.display = 'flex';
            }
        }

        function hideContinueModal() {
            const continueModal = document.getElementById('continue-modal');
            if (continueModal) {
                continueModal.style.display = 'none';
            }
        }

        function endGame() {
            gameState.isPlaying = false;
            gameState.gameCompleted = true;
            
            // Clear any remaining animations
            clearCanvas();
            clearWordOptions();
            hideSentencePrompt();
            
            // Calculate final score
            const totalQuestions = gameState.correctAnswers + gameState.incorrectAnswers;
            const correctCount = Number(gameState.correctAnswers) || 0;
            const totalCount = Number(totalQuestions) || 0;
            const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
            
            // Update final results modal
            document.getElementById('final-correct').textContent = gameState.correctAnswers;
            document.getElementById('final-incorrect').textContent = gameState.incorrectAnswers;
            document.getElementById('final-score').textContent = scorePercentage;
            
            // Log game completion
            logGameEnd();
            
            // Show game over modal
            showGameOverModal();
            
            // Reset UI
            startBtn.style.display = 'inline-flex';
            restartBtn.style.display = 'none';
        }

        function showGameOverModal() {
            const modal = document.getElementById('game-over-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        }

        function hideGameOverModal() {
            const modal = document.getElementById('game-over-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function restartGame() {
            hideGameOverModal();
            initializeGame();
            startGame();
        }

        function newGame() {
            hideGameOverModal();
            initializeGame();
            // Will need to reload sentences if level changed
            loadSentencesAndVocabulary();
        }

        function logGameProgress(score, completionTime) {
            const totalQuestions = gameState.correctAnswers + gameState.incorrectAnswers;

            // Only log if there's actual game data (questions answered)
            if (totalQuestions === 0) {
                console.log('No questions answered, skipping progress log');
                return;
            }

            // Get current level information
            let level = 0; // Default level if no level manager or level data
            if (typeof LevelManager !== 'undefined') {
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.groupIndex !== undefined) {
                    level = levelData.groupIndex;
                }
            }

            const gameData = {
                questions: gameState.questionResults,
                gameType: 'drop-sentence'
            };

            const logData = {
                userId: getCurrentUserId(),
                totalQuestions: totalQuestions,
                correctAnswers: gameState.correctAnswers,
                incorrectAnswers: gameState.incorrectAnswers,
                score: score,
                completionTime: completionTime,
                duration: (new Date() - gameState.gameStartTime),
                level: level,
                gameData: gameData,
                gameType: 'drop-sentence'
            };

            if (gameState.currentLogId) {
                // Update existing log
                apiService.updateDropSentenceGame(gameState.currentLogId, logData, function(err, result) {
                    if (err) {
                        console.error('Error updating drop sentence game log:', err);
                    } else {
                        console.log('Drop sentence game log updated successfully');
                    }
                });
            } else {
                // Create new log
                apiService.logDropSentenceGame(logData, function(err, result) {
                    if (err) {
                        console.error('Error logging drop sentence game progress:', err);
                    } else {
                        console.log('Drop sentence game progress logged successfully');
                        if (result && result.logId) {
                            gameState.currentLogId = result.logId;
                        }
                    }
                });
            }
        }

        function logGameEnd() {
            const gameEndTime = new Date();
            const duration = gameEndTime - gameState.gameStartTime;
            const totalQuestions = gameState.correctAnswers + gameState.incorrectAnswers;
            
            // Ensure we're working with numbers and calculate score properly
            const correctCount = Number(gameState.correctAnswers) || 0;
            const totalCount = Number(totalQuestions) || 0;
            const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

            // Only log if there's actual game data (questions answered)
            if (totalQuestions === 0) {
                console.log('No questions answered, skipping game log');
                return;
            }

            // Get current level information
            let level = 0; // Default level if no level manager or level data
            if (typeof LevelManager !== 'undefined') {
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.groupIndex !== undefined) {
                    level = levelData.groupIndex;
                }
            }

            const gameData = {
                questions: gameState.questionResults,
                gameType: 'drop-sentence'
            };

            const logData = {
                userId: getCurrentUserId(),
                totalQuestions: totalQuestions,
                correctAnswers: gameState.correctAnswers,
                incorrectAnswers: gameState.incorrectAnswers,
                score: scorePercentage,
                completionTime: Math.round(duration / 1000), // Convert to seconds
                duration: duration,
                level: level,
                gameData: gameData,
                gameType: 'drop-sentence'
            };

            if (gameState.currentLogId) {
                // Update existing log (final update when game completes)
                apiService.updateDropSentenceGame(gameState.currentLogId, logData, function(err, result) {
                    if (err) {
                        console.error('Error updating drop sentence game final log:', err);
                    } else {
                        console.log('Drop sentence game final log updated successfully');
                    }
                });
            } else {
                // Create new log (only if no session was tracked - should rarely happen)
                apiService.logDropSentenceGame(logData, function(err, result) {
                    if (err) {
                        console.error('Error logging drop sentence game:', err);
                    } else {
                        console.log('Drop sentence game logged successfully');
                        if (result && result.logId) {
                            gameState.currentLogId = result.logId;
                        }
                    }
                });
            }
        }

        function getCurrentUserId() {
            // Return the current user ID - this will be set when user info is loaded
            return window.currentUser ? window.currentUser._id : null;
        }

        function loadUserInfo() {
            // Load and display current user information
            apiService.getCurrentUser(function(err, user) {
                if (err) {
                    console.error('Failed to load user info:', err);
                    return;
                }
                
                // Store user info globally for access by other functions
                window.currentUser = user;
                
                const usernameElement = document.getElementById('current-username');
                if (usernameElement && user) {
                    usernameElement.textContent = user.username;
                }
            });
        }

        function showError(message) {
            // Create and show error notification
            const notification = document.createElement('div');
            notification.className = 'error-notification';
            notification.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button class="close-error" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            document.body.appendChild(notification);
            notification.style.display = 'flex';
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    });

    return {
        // Public API if needed
        getGameState: function() {
            return gameState;
        }
    };
})();
