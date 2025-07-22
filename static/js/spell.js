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
                        <div class="below">
                            <div class="quiz-section">
                                <h3>${JSON.parse(localStorage.getItem('index1')) + 1}/${JSON.parse(localStorage.getItem('random_list1')).length} What is this in French?</h3>
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
                                    <button class="prev-question">Previous Question</button>
                                    <button class="next-question">Next Question →</button>
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

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const userAnswer = input.value.toLowerCase().trim();
                    const isCorrect = userAnswer === correctFrenchWord;

                    // Track the answer
                    if (isCorrect) {
                        gameSession.correctAnswers++;
                    } else {
                        gameSession.incorrectAnswers++;
                    }
                    
                    // Store question data
                    gameSession.questionsData.push({
                        questionId: id,
                        englishWord: img.imageName,
                        correctAnswer: correctFrenchWord,
                        userAnswer: userAnswer,
                        isCorrect: isCorrect,
                        timestamp: new Date()
                    });
                    
                    gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;

                    if (isCorrect) {
                        feedback.textContent = "Correct! 🎉";
                        feedback.style.color = 'green';
                    } else {
                        feedback.textContent = `Incorrect😢. Answer: ${correctFrenchWord}/${img.imageName}`;
                        feedback.style.color = 'red';
                    }

                    // Clear input after check
                    input.value = '';
                    
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
            
            const logData = {
                totalQuestions: gameSession.totalQuestions,
                correctAnswers: gameSession.correctAnswers,
                incorrectAnswers: gameSession.incorrectAnswers,
                completionTime: completionTime,
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

        async function newGame() {
            try {
                // Log previous session if it exists
                if (gameSession.totalQuestions > 0) {
                    logGameSession();
                }
                
                // Initialize new session
                initializeGameSession();
                
                localStorage.setItem('index1', JSON.stringify(0));
                apiService.getGraphs(function (err, imgts) {
                    if (err) return onError(err);
                    localStorage.setItem('random_list1', JSON.stringify(generateRandomList(imgts.length)));
                });
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

            updateGraph();
            console.log(JSON.parse(localStorage.getItem('random_list1')));
            //setTimeout(refresh, 5000);
        }());

    });
})();