//closure of index
let spell = (function () {
    "use strict";
    
    // Game tracking variables
    let gameSession = {
        startTime: null,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        questionsData: []
    };
    
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

        function generateRandomList(n) {
            // Create array from 1 to n
            const arr = Array.from({ length: n }, (_, i) => i + 1);

            // Fisher-Yates shuffle algorithm
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Functions to manage selected answers for spelling game
        function getSelectedAnswers() {
            const stored = localStorage.getItem('spell_game_answers');
            return stored ? JSON.parse(stored) : {};
        }

        function saveSelectedAnswer(questionId, userAnswer, isCorrect, correctAnswer) {
            const answers = getSelectedAnswers();
            answers[questionId] = {
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                correctAnswer: correctAnswer,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('spell_game_answers', JSON.stringify(answers));
        }

        function clearSelectedAnswers() {
            localStorage.removeItem('spell_game_answers');
        }

        function setRandomListCookie(cookieName, list, daysToExpire = 7) {
            const expiration = new Date();
            expiration.setDate(expiration.getDate() + daysToExpire);

            document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(list))}; 
              expires=${expiration.toUTCString()}; 
              path=/`;
        }

        async function createImage(id, url) {
            // Clear previous content
            document.getElementById("display").innerHTML = "";
            try {
                // Get correct answer from API
                const img = await new Promise((resolve, reject) => {
                    apiService.getGraph(id, (err, imgData) => {
                        if (err) reject(err);
                        else resolve(imgData);
                    });
                });

                const correctFrenchWord = img.author.toLowerCase().trim(); // Normalize answer

                // Create main element
                const elmt = document.createElement("div");
                elmt.className = "img-format";

                // Add HTML structure with input
                elmt.innerHTML = `
                    <div class="img-element">
                        <div class="control">
                            <div id="imageId" class="hide">${id}</div>
                            <img class="img-picture" src="${url}">
                        </div>
                        <div class="navigation-controls">
                            <button class="prev-question nav-btn nav-left">← Previous</button>
                            <span class="question-counter">${JSON.parse(localStorage.getItem('index1')) + 1}/${JSON.parse(localStorage.getItem('random_list1')).length}</span>
                            <button class="next-question nav-btn nav-right">Next →</button>
                        </div>
                        <div class="below compact">
                            <div class="quiz-section">
                                <h3>What is this in French?</h3>
                                <div class="quiz">
                                    <form id="answer-form">
                                        <input type="text" 
                                               autocomplete="off"
                                               id="french-answer" 
                                               class="answer-input"
                                               placeholder="Type your answer...">
                                        <button type="submit">Check Answer</button>
                                    </form>
                                    <div class="quiz-feedback"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Add validation logic
                const form = elmt.querySelector('#answer-form');
                const input = elmt.querySelector('#french-answer');
                const feedback = elmt.querySelector('.quiz-feedback');
                const nextBtn = elmt.querySelector('.next-question');
                const prevBtn = elmt.querySelector('.prev-question');

                // Update button states based on current position
                const currentIndex = JSON.parse(localStorage.getItem('index1')) || 0;
                const randomList = JSON.parse(localStorage.getItem('random_list1')) || [];
                
                // Disable previous button if at first question
                if (currentIndex === 0) {
                    prevBtn.disabled = true;
                }
                
                // Disable next button if at last question
                if (currentIndex >= randomList.length - 1) {
                    nextBtn.disabled = true;
                }

                // Check if this question was already answered
                const selectedAnswers = getSelectedAnswers();
                const previousAnswer = selectedAnswers[id];
                let questionAlreadyAnswered = false;

                if (previousAnswer) {
                    // Question was already answered, restore the state but keep input enabled
                    questionAlreadyAnswered = true;
                    input.value = previousAnswer.userAnswer;
                    // Don't disable input - allow user to continue typing
                    // input.disabled = true;
                    // form.querySelector('button[type="submit"]').disabled = true;
                    
                    feedback.textContent = previousAnswer.isCorrect 
                        ? "Correct! 🎉 (Already recorded)" 
                        : `Incorrect😢. Answer: ${previousAnswer.correctAnswer}/${img.imageName} (Already recorded)`;
                    feedback.style.color = previousAnswer.isCorrect ? 'green' : 'red';
                    
                    // Update game session counters if this answer hasn't been counted yet
                    const alreadyInSession = gameSession.questionsData.some(q => q.questionId === id);
                    if (!alreadyInSession) {
                        if (previousAnswer.isCorrect) {
                            gameSession.correctAnswers++;
                        } else {
                            gameSession.incorrectAnswers++;
                        }
                        
                        // Add to session data
                        gameSession.questionsData.push({
                            questionId: id,
                            englishWord: img.imageName,
                            correctAnswer: previousAnswer.correctAnswer,
                            userAnswer: previousAnswer.userAnswer,
                            isCorrect: previousAnswer.isCorrect,
                            timestamp: new Date(previousAnswer.timestamp)
                        });
                        
                        gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
                    }
                }

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const userAnswer = input.value.toLowerCase().trim();
                    const isCorrect = userAnswer === correctFrenchWord;

                    // Always provide feedback for current answer
                    if (isCorrect) {
                        feedback.textContent = questionAlreadyAnswered 
                            ? "Correct! 🎉 (Already recorded)" 
                            : "Correct! 🎉";
                        feedback.style.color = 'green';
                    } else {
                        feedback.textContent = questionAlreadyAnswered 
                            ? `Incorrect😢. Answer: ${correctFrenchWord}/${img.imageName} (Already recorded)`
                            : `Incorrect😢. Answer: ${correctFrenchWord}/${img.imageName}`;
                        feedback.style.color = 'red';
                    }

                    // Only save and log if this is the first submission for this question
                    if (!questionAlreadyAnswered) {
                        // Save the selected answer to localStorage
                        saveSelectedAnswer(id, userAnswer, isCorrect, correctFrenchWord);
                        
                        // Check if this question was already counted in the current session
                        const alreadyInSession = gameSession.questionsData.some(q => q.questionId === id);
                        
                        if (!alreadyInSession) {
                            // Track the answer (only if not already counted)
                            if (isCorrect) {
                                gameSession.correctAnswers++;
                            } else {
                                gameSession.incorrectAnswers++;
                            }
                            
                            gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
                            
                            // Store question data
                            gameSession.questionsData.push({
                                questionId: id,
                                englishWord: img.imageName,
                                correctAnswer: correctFrenchWord,
                                userAnswer: userAnswer,
                                isCorrect: isCorrect,
                                timestamp: new Date()
                            });
                        }
                        
                        // Mark as answered after first submission
                        questionAlreadyAnswered = true;
                        
                        // Check if this was the last question in the set
                        const currentIndex = JSON.parse(localStorage.getItem('index1')) || 0;
                        const randomList = JSON.parse(localStorage.getItem('random_list1')) || [];
                        
                        if (currentIndex + 1 >= randomList.length) {
                            // This was the last question, show completion message after delay
                            setTimeout(() => {
                                if (gameSession.totalQuestions > 0) {
                                    logGameSession();
                                    alert(`Spelling Game Completed!\n\nFinal Score: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nClick "New Game" to play again!`);
                                }
                            }, 2000); // 2 second delay to show feedback
                        }
                    }
                });

                // Append to DOM
                document.getElementById("display").appendChild(elmt);
                prevBtn.addEventListener('click', () => {
                    const index = JSON.parse(localStorage.getItem('index1')) || 0;
                    displayImage(index - 1);
                    if (index > 0) {
                        localStorage.setItem('index1', JSON.stringify(index - 1));
                    }else{
                        localStorage.setItem('index', JSON.stringify(0));
                    }
                });
                nextBtn.addEventListener('click', () => {
                    const index = JSON.parse(localStorage.getItem('index1')) || 0;
                    const randomList = JSON.parse(localStorage.getItem('random_list1')) || [];
                    
                    // Check if we've reached the end of the game
                    if (index + 1 >= randomList.length) {
                        // Game completed, log the session
                        if (gameSession.totalQuestions > 0) {
                            logGameSession();
                            alert(`Spelling Game Completed!\n\nScore: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nStarting a new game...`);
                        }
                        // Start a new game
                        newGame();
                        return;
                    }
                    
                    displayImage(index + 1);
                    localStorage.setItem('index1', JSON.stringify(index + 1));
                });

            } catch (err) {
                console.error('Error loading image:', err);
            }
        }

        async function displayImage(index) {
            if (index >= 0) {
                let l = JSON.parse(localStorage.getItem('random_list1'));
                
                // Check if we've gone beyond the available questions
                if (index >= l.length) {
                    // Game completed
                    if (gameSession.totalQuestions > 0) {
                        logGameSession();
                        alert(`Spelling Game Completed!\n\nScore: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nStarting a new game...`);
                    }
                    newGame();
                    return;
                }
                
                let imgid = l[index];
                apiService.getGraph(imgid, function (err, img) {
                    if (err) {
                        localStorage.setItem('index1', null);
                        localStorage.setItem('random_list1', null);
                        window.location.href = '/'
                    } else {
                        createImage(img._id, img.url)
                    }
                })
            }
        }

        function setEmptyImage() {
            document.getElementById("display").innerHTML = ""
            let elmt = document.createElement("div");
            elmt.className = "img-format";
            elmt.innerHTML = `<div class="img-element">
                              <div class="img-title">Title:Empty Slot</div>
                              <div class= "control">
                              <div id="imageId" class="hide">Empty Slot</div>
                              <img class="img-picture" src="media/empty.png">
                              </div>
                              <div class="below">
                              <div class="img-username">Auther:Empty Slot</div>
                              </div>
                              </div>`;
            document.querySelector("#display").prepend(elmt);
        }

        async function updateGraph() {
            apiService.getGraphs(function (err, imgts) {
                if (err) return onError(err);
                if (imgts.length > 0) {
                    let imgid = JSON.parse(localStorage.getItem('index1'))
                    if (imgid !== undefined && imgid !== null) {
                        displayImage(imgid)
                    } else

                        setEmptyImage();

                } else {
                    document.getElementById("display").innerHTML = ""
                }
            });
        }

        // Game logging functions
        function logGameSession() {
            if (gameSession.totalQuestions === 0) return; // No questions answered
            
            const completionTime = gameSession.startTime ? 
                Math.round((new Date().getTime() - gameSession.startTime.getTime()) / 1000) : null;
            
            // Get current level information
            let level = 0; // Default level if no level manager or level data
            if (typeof LevelManager !== 'undefined') {
                const levelData = LevelManager.getLevelData();
                if (levelData && levelData.groupIndex !== undefined) {
                    level = levelData.groupIndex;
                }
            }
            
            const logData = {
                totalQuestions: gameSession.totalQuestions,
                correctAnswers: gameSession.correctAnswers,
                incorrectAnswers: gameSession.incorrectAnswers,
                completionTime: completionTime,
                level: level,
                gameData: {
                    questions: gameSession.questionsData,
                    gameType: 'spelling'
                }
            };
            
            fetch('/api/spelling-game/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Spelling game session logged successfully. Score:', data.score + '%');
                } else {
                    console.error('Error logging spelling game session:', data.error);
                }
            })
            .catch(error => {
                console.error('Error logging spelling game session:', error);
            });
        }
        
        function initializeGameSession() {
            gameSession = {
                startTime: new Date(),
                totalQuestions: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                questionsData: []
            };
        }

        function loadExistingAnswersToSession() {
            const selectedAnswers = getSelectedAnswers();
            const randomList = JSON.parse(localStorage.getItem('random_list1')) || [];
            
            // Only load answers for questions in the current random list
            Object.keys(selectedAnswers).forEach(questionId => {
                if (randomList.includes(questionId)) {
                    const answer = selectedAnswers[questionId];
                    
                    // Check if already in session to avoid duplicates
                    const alreadyInSession = gameSession.questionsData.some(q => q.questionId === questionId);
                    if (!alreadyInSession) {
                        if (answer.isCorrect) {
                            gameSession.correctAnswers++;
                        } else {
                            gameSession.incorrectAnswers++;
                        }
                        
                        gameSession.questionsData.push({
                            questionId: questionId,
                            englishWord: 'loaded', // Will be updated when question is displayed
                            correctAnswer: answer.correctAnswer,
                            userAnswer: answer.userAnswer,
                            isCorrect: answer.isCorrect,
                            timestamp: new Date(answer.timestamp)
                        });
                    }
                }
            });
            
            gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
            
            if (gameSession.totalQuestions > 0) {
                console.log(`Loaded ${gameSession.totalQuestions} existing spelling answers from localStorage`);
            }
        }

        async function newGame() {
            try {
                // Log previous session if it exists
                if (gameSession.totalQuestions > 0) {
                    logGameSession();
                }
                
                // Initialize new session
                initializeGameSession();
                
                // Clear previously selected answers
                clearSelectedAnswers();
                
                // Use LevelManager if available
                if (typeof LevelManager !== 'undefined') {
                    // Initialize for spell game
                    if (!LevelManager.initializeLevel('spell')) {
                        return; // Will redirect to level selection if needed
                    }
                    
                    // Reset index and generate new random list for current level
                    localStorage.setItem('index1', JSON.stringify(0));
                    LevelManager.generateRandomListForLevel('spell');
                } else {
                    // Fallback to old method
                    localStorage.setItem('index1', JSON.stringify(0));
                    apiService.getGraphs(function (err, imgts) {
                        if (err) return onError(err);
                        localStorage.setItem('random_list1', JSON.stringify(generateRandomList(imgts.length)));
                    });
                }
                
                updateGraph();
            } catch (error) {
                return onError(error);
            }
        }
        async function back() {
            try {
                // Log current session before leaving
                if (gameSession.totalQuestions > 0) {
                    logGameSession();
                }
                window.location.href = '/';
            } catch (error) {
                return onError(error);
            }
        }


        document.getElementById("bc").addEventListener('click', back);
        document.getElementById("ng").addEventListener('click', newGame);


        // Add event listener for level select button
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', function() {
                if (gameSession.totalQuestions > 0) {
                    logGameSession();
                }
                window.location.href = '/group-select.html?game=spell';
            });
        }

        // Add event listener for logs button
        const spellLogsBtn = document.getElementById('spell-logs-btn');
        if (spellLogsBtn) {
            spellLogsBtn.addEventListener('click', function() {
                window.location.href = '/logs';
            });
        }

        // Load user information
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

        // Load user info on page load
        loadUserInfo();

        (function refresh() {
            // Initialize game session if starting fresh
            if (!gameSession.startTime) {
                initializeGameSession();
            }

            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for spell game
                if (!LevelManager.initializeLevel('spell')) {
                    return; // Will redirect to level selection if needed
                }
                
                // Check if we need to initialize index (fresh start)
                let currentIndex = localStorage.getItem('index1');
                if (currentIndex === null) {
                    localStorage.setItem('index1', JSON.stringify(0));
                }
                
                console.log('Spell game initialized with level:', LevelManager.getCurrentLevelInfo());
            } else {
                // Fallback to old method
                let storedList = JSON.parse(localStorage.getItem('random_list1')) || null;
                let idx = JSON.parse(localStorage.getItem('index1')) || null;
                if (idx === null) {
                    localStorage.setItem('index1', JSON.stringify(0));
                }
                if (storedList === null) {
                    apiService.getGraphs(function (err, imgts) {
                        if (err) return onError(err);
                        localStorage.setItem('random_list1', JSON.stringify(generateRandomList(imgts.length)));
                    });
                }
                console.log(JSON.parse(localStorage.getItem('random_list1')));
            }

            // Load existing answers into the current session
            loadExistingAnswersToSession();

            updateGraph();
        }());

    });
})();