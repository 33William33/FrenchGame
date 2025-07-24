//closure of index
let game = (function () {
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
        const FRENCH_WORDS = [
            // Original Base Words (20)
            'le logement', 'le loyer', "l'épicerie", "l'hygiène", 'le nettoyage',
            "l'aspirateur", 'la cuisinière', 'le frigidaire', 'la douche', 'la laverie',
            'le stationnement', 'les transports en commun', 'le taxi', 'la facture', 'les déchets',

            // **Employment & Work**
            "l'emploi", 'le collègue', 'le salaire',
            "l'horaire", 'le congé', 'la formation', 'le licenciement', 'la démission',
            'le bureau', 'la réunion', 'le contrat', 'le syndicat', 'la retraite',

            // **Government & Immigration**
            'le permis de résidence', 'la citoyenneté', 'le passeport', 'le visa', 'la douane',
            "l'ambassade",
            'les impôts',

            // **Healthcare**
            "l'hôpital", 'le médecin', "l'ordonnance", 'la pharmacie',
            "l'urgence", 'la vaccination', 'les symptômes', 'le dentiste', "l'infirmière",

            // **Education**
            'le diplôme', "l'université", "l'inscription", 'la scolarité',
            "l'élève", 'le professeur', 'le devoir', "l'examen", 'la bibliothèque',

            // **Canadian Culture & Society**
            'la diversité', 'bilingue', "l'hiver", 'la neige', 'le patinage',
            'le hockey', "l'érablière", 'la poutine',
            'la réconciliation', "l'autochtone",

            // **Practical Verbs**
            'remplir', 'signer', 'demander', 'répondre', 'comprendre',
            'expliquer', 'télécharger', 'soumettre', 'travailler', 'étudier',

            // **Adjectives for Descriptions**
            'obligatoire', 'légal', 'urgent', 'permanent', 'temporaire',
            'sécuritaire', 'culturel', 'officiel', 'gratuit', 'payant',

            // **Technology & Communication**
            'le courriel', 'le téléchargement',
            "l'application", "l'imprimante", 'le scanner',

            // **Shopping & Services**
            'le panier', 'la caisse', 'le rabais', 'le remboursement',
            'la livraison', "l'étiquette", 'la facture', 'la prospérité', "l'authenticité", 'la vertu', 'la culpabilité', 'la solitude',
            'la revendication', 'la foi', 'la vérité', 'la peur', 'la paix', 'le doute', 'le sentiment',
            'la confiance', 'la connaissance', 'la lumière', 'la volonté',

            // Actions & Processes
            'la traite', 'la condamnation', 'la découverte', 'la lutte', 'la mise', 'la formation',
            "l'enseignement", 'la gestion', 'le recrutement', 'la remise', 'le traitement', "l'enquête",
            'le contrôle', 'le comportement', 'le rayonnement',

            // Objects & Concepts
            'la toile', 'la chronique', "l'apparition", 'la patrie', 'la cible', 'la sauvegarde',
            'la configuration', 'la racine', 'la pierre', 'la plume', "l'œuvre", 'la presse', 'la preuve',
            'la guerre', 'la forme', 'la loi', 'la matière', "l'affaire", 'la vis', 'la croissance', 'la tête',
            'la règle', 'la santé', 'la note', 'la moyenne', 'la moitié', 'la montre', 'la figure', 'la valeur',
            'la façon', "l'époque", 'la somme', 'la faveur', 'le rendement', 'le trimestre', 'le détour',
            'la prétention', 'le recueil', 'la rédaction', "l'or", 'le poids', 'le plan', 'le plaisir', 'le peuple',
            "l'intérêt", 'le cadre', 'le récit', 'le cœur', 'le roi', 'le courant', 'le compte', 'le service',
            'le sein', 'le mouvement', 'le niveau', 'le réseau', 'le risque', 'le bois', 'le sort', 'le succès',
            'le siècle', 'le conseil', 'la marque', 'le chapitre', 'le titre', 'la voix', 'la démarche',
            'la propriété', 'la conception', 'le contenu', "l'objectif", 'le manque',
            'vers', 'le traité', 'le bas', 'le taux', "l'avis", "l'intérieur", 'le cas', 'le personnage', 'le juge',
            'le sens', 'le discours', 'le four', "l'ouvrage", 'le fait', 'le vol', "l'état"
        ];

        function onError(err) {
            console.error("[error]", err);
            let error_box = document.querySelector("#error_box");
            error_box.innerHTML = err;
            error_box.style.visibility = "visible";
            alert(err)
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

        // Functions to manage selected answers
        function getSelectedAnswers() {
            const stored = localStorage.getItem('match_game_answers');
            return stored ? JSON.parse(stored) : {};
        }

        function saveSelectedAnswer(questionId, selectedAnswer, isCorrect, correctAnswer) {
            const answers = getSelectedAnswers();
            answers[questionId] = {
                selectedAnswer: selectedAnswer,
                isCorrect: isCorrect,
                correctAnswer: correctAnswer,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('match_game_answers', JSON.stringify(answers));
        }

        function clearSelectedAnswers() {
            localStorage.removeItem('match_game_answers');
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
                // Get correct answer from API first
                const img = await new Promise((resolve, reject) => {
                    apiService.getGraph(id, (err, imgData) => {
                        if (err) reject(err);
                        else resolve(imgData);
                    });
                });

                const correctFrenchWord = img.author;

                // Verify correct answer exists in word list
                // if (!FRENCH_WORDS.includes(correctFrenchWord)) {
                //     console.error('Correct word not in vocabulary list:', correctFrenchWord);
                //     throw new Error('Missing valid answer');
                // }

                // Generate quiz options after API response
                const randomWords = FRENCH_WORDS
                    .filter(word => word !== correctFrenchWord)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 7);

                const allOptions = [...randomWords, correctFrenchWord]
                    .sort(() => Math.random() - 0.5);

                // Create main element
                const elmt = document.createElement("div");
                elmt.className = "img-format";

                // Add HTML structure with quiz
                elmt.innerHTML = `
                    <div class="img-element">
                        <div class="control">
                            <div id="imageId" class="hide">${id}</div>
                            <img class="img-picture" src="${url}">
                        </div>
                        <div class="below">
                            <div class="quiz-section">
                                <h3>${JSON.parse(localStorage.getItem('index')) + 1}/${JSON.parse(localStorage.getItem('random_list')).length} What is this in French?</h3>
                                <div class="quiz-options">
                                    ${allOptions.map(word => `
                                        <button class="quiz-option" data-correct="${word === correctFrenchWord}">
                                            ${word}
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="quiz-feedback"></div>
                                <button class="prev-question">Previous Question</button>
                                <button class="next-question">Next Question →</button>
                            </div>
                        </div>
                    </div>
                `;

                // Add quiz interaction
                const feedback = elmt.querySelector('.quiz-feedback');
                const nextBtn = elmt.querySelector('.next-question');
                const prevBtn = elmt.querySelector('.prev-question');

                // Check if this question was already answered
                const selectedAnswers = getSelectedAnswers();
                const previousAnswer = selectedAnswers[id];
                let questionAlreadyAnswered = false;

                if (previousAnswer) {
                    // Question was already answered, restore the state
                    questionAlreadyAnswered = true;
                    feedback.textContent = previousAnswer.isCorrect ? 'Correct! 🎉' : `Incorrect 😢 Answer: ${previousAnswer.correctAnswer}/${img.imageName}`;
                    feedback.style.color = previousAnswer.isCorrect ? 'green' : 'red';
                    
                    // Find and highlight the selected button
                    elmt.querySelectorAll('.quiz-option').forEach(btn => {
                        btn.disabled = true; // Disable all buttons
                        if (btn.textContent.trim() === previousAnswer.selectedAnswer) {
                            btn.style.backgroundColor = previousAnswer.isCorrect ? '#dfffdf' : '#ffe0e0';
                        }
                    });
                    
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
                            selectedAnswer: previousAnswer.selectedAnswer,
                            isCorrect: previousAnswer.isCorrect,
                            timestamp: new Date(previousAnswer.timestamp)
                        });
                        
                        gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
                    }
                }

                elmt.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function () {
                        // Prevent selection if already answered
                        if (questionAlreadyAnswered) {
                            return;
                        }

                        const isCorrect = this.dataset.correct === 'true';
                        const selectedAnswer = this.textContent.trim();
                        
                        // Save the selected answer to localStorage
                        saveSelectedAnswer(id, selectedAnswer, isCorrect, correctFrenchWord);
                        
                        // Check if this question was already counted in the current session
                        const alreadyInSession = gameSession.questionsData.some(q => q.questionId === id);
                        
                        if (!alreadyInSession) {
                            // Track the answer (only if not already counted)
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
                                selectedAnswer: selectedAnswer,
                                isCorrect: isCorrect,
                                timestamp: new Date()
                            });
                            
                            gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
                        }
                        
                        feedback.textContent = isCorrect ? 'Correct! 🎉' : `Incorrect 😢 Answer: ${correctFrenchWord}/${img.imageName}`;
                        feedback.style.color = isCorrect ? 'green' : 'red';
                        btn.style.backgroundColor = isCorrect ? '#dfffdf' : '#ffe0e0';

                        // Disable buttons after selection
                        elmt.querySelectorAll('.quiz-option').forEach(b => {
                            b.disabled = true;
                        });
                        
                        // Mark as answered
                        questionAlreadyAnswered = true;
                        
                        // Check if this was the last question in the set
                        const currentIndex = JSON.parse(localStorage.getItem('index')) || 0;
                        const randomList = JSON.parse(localStorage.getItem('random_list')) || [];
                        
                        if (currentIndex + 1 >= randomList.length) {
                            // This was the last question, show completion message after delay
                            setTimeout(() => {
                                if (gameSession.totalQuestions > 0) {
                                    logGameSession();
                                    alert(`Match Game Completed!\n\nFinal Score: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nClick "New Game" to play again!`);
                                }
                            }, 2000); // 2 second delay to show feedback
                        }
                    });
                });

                prevBtn.addEventListener('click', () => {
                    const index = JSON.parse(localStorage.getItem('index')) || 0;
                    displayImage(index - 1);
                    if (index > 0) {
                        localStorage.setItem('index', JSON.stringify(index - 1));
                    }else{
                        displayImage(0);
                        localStorage.setItem('index', JSON.stringify(0));
                    }
                    console.log(index - 1);
                });

                nextBtn.addEventListener('click', () => {
                    const index = JSON.parse(localStorage.getItem('index')) || 0;
                    const randomList = JSON.parse(localStorage.getItem('random_list')) || [];
                    
                    // Check if we've reached the end of the game
                    if (index + 1 >= randomList.length) {
                        // Game completed, log the session
                        if (gameSession.totalQuestions > 0) {
                            logGameSession();
                            alert(`Game Completed!\n\nScore: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nStarting a new game...`);
                        }
                        // Start a new game
                        newGame();
                        return;
                    }
                    
                    displayImage(index + 1);
                    localStorage.setItem('index', JSON.stringify(index + 1));
                });
                document.querySelector("#display").prepend(elmt);

            } catch (error) {
                console.error('Error creating image:', error);
                localStorage.clear();
            }
        }


        async function displayImage(index) {
            if (index >= 0) {
                let l = JSON.parse(localStorage.getItem('random_list'));
                
                // Check if we've gone beyond the available questions
                if (index >= l.length) {
                    // Game completed
                    if (gameSession.totalQuestions > 0) {
                        logGameSession();
                        alert(`Game Completed!\n\nScore: ${gameSession.correctAnswers}/${gameSession.totalQuestions} (${Math.round((gameSession.correctAnswers/gameSession.totalQuestions)*100)}%)\n\nStarting a new game...`);
                    }
                    newGame();
                    return;
                }
                
                let imgid = l[index];
                apiService.getGraph(imgid, function (err, img) {
                    if (err) {
                        localStorage.setItem('index', null);
                        localStorage.setItem('random_list', null);
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
                    let imgid = JSON.parse(localStorage.getItem('index'))
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
                totalQuestions: gameSession.questionsData.length,
                correctAnswers: gameSession.questionsData.filter(q => q.isCorrect).length,
                incorrectAnswers: gameSession.questionsData.filter(q => !q.isCorrect).length,
                completionTime: completionTime,
                level: level,
                gameData: {
                    questions: gameSession.questionsData,
                    gameType: 'match'
                }
            };
            
            fetch('/api/match-game/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Game session logged successfully. Questions recorded:', gameSession.questionsData.length, 'Score:', data.score + '%');
                } else {
                    console.error('Error logging game session:', data.error);
                }
            })
            .catch(error => {
                console.error('Error logging game session:', error);
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
            const randomList = JSON.parse(localStorage.getItem('random_list')) || [];
            
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
                            selectedAnswer: answer.selectedAnswer,
                            isCorrect: answer.isCorrect,
                            timestamp: new Date(answer.timestamp)
                        });
                    }
                }
            });
            
            gameSession.totalQuestions = gameSession.correctAnswers + gameSession.incorrectAnswers;
            
            if (gameSession.totalQuestions > 0) {
                console.log(`Loaded ${gameSession.totalQuestions} existing answers from localStorage`);
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
                    // Initialize for match game
                    if (!LevelManager.initializeLevel('match')) {
                        return; // Will redirect to level selection if needed
                    }
                    
                    // Reset index and generate new random list for current level
                    localStorage.setItem('index', JSON.stringify(0));
                    LevelManager.generateRandomListForLevel('match');
                } else {
                    // Fallback to old method
                    localStorage.setItem('index', JSON.stringify(0));
                    apiService.getGraphs(function (err, imgts) {
                        if (err) return onError(err);
                        // Use generateRandomList to create random order of questions
                        const randomIndices = generateRandomList(imgts.length);
                        const randomizedIds = randomIndices.map(index => imgts[index - 1]._id);
                        localStorage.setItem('random_list', JSON.stringify(randomizedIds));
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
        
        // Add event listener for level select button
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', function() {
                if (gameSession.totalQuestions > 0) {
                    logGameSession();
                }
                window.location.href = '/group-select.html?game=match';
            });
        }


        document.getElementById("bc").addEventListener('click', back);
        document.getElementById("ng").addEventListener('click', newGame);

        // Add event listener for logs button
        const gameLogsBtn = document.getElementById('game-logs-btn');
        if (gameLogsBtn) {
            gameLogsBtn.addEventListener('click', function() {
                window.location.href = '/logs';
            });
        }

        // Function to load and display current user information
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

        // Load user info when page loads
        loadUserInfo();

        (function refresh() {
            // Initialize game session if starting fresh
            if (!gameSession.startTime) {
                initializeGameSession();
            }

            // Use LevelManager if available
            if (typeof LevelManager !== 'undefined') {
                // Initialize for match game
                if (!LevelManager.initializeLevel('match')) {
                    return; // Will redirect to level selection if needed
                }
                
                // Check if we need to initialize index (fresh start)
                let currentIndex = localStorage.getItem('index');
                if (currentIndex === null) {
                    localStorage.setItem('index', JSON.stringify(0));
                }
                
                console.log('Match game initialized with level:', LevelManager.getCurrentLevelInfo());
            } else {
                // Fallback to old method
                let storedList = JSON.parse(localStorage.getItem('random_list')) || null;
                let idx = JSON.parse(localStorage.getItem('index')) || null;
                if (idx === null) {
                    localStorage.setItem('index', JSON.stringify(0));
                }
                if (storedList === null) {
                    apiService.getGraphs(function (err, imgts) {
                        if (err) return onError(err);
                        // Use generateRandomList to create random order of questions
                        const randomIndices = generateRandomList(imgts.length);
                        const randomizedIds = randomIndices.map(index => imgts[index - 1]._id);
                        localStorage.setItem('random_list', JSON.stringify(randomizedIds));
                    });
                }
                console.log(JSON.parse(localStorage.getItem('random_list')));
            }

            // Load existing answers into the current session
            loadExistingAnswersToSession();

            updateGraph();
        }());

    });
})();