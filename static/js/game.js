//closure of index
let game = (function () {
    "use strict";
    window.addEventListener("load", function () {
        const FRENCH_WORDS = [
            // Original Base Words (20)
            'logement', 'loyer', 'épicerie', 'hygiène', 'nettoyage',
            'aspirateur', 'cuisinière', 'frigidaire', 'douche', 'laverie',
            'stationnement', 'transports en commun', 'taxi', 'facture', 'déchets',

            // **Employment & Work**
            'emploi', 'collègue', 'salaire',
            'horaire', 'congé', 'formation', 'licenciement', 'démission',
            'bureau', 'réunion', 'contrat', 'syndicat', 'retraite',

            // **Government & Immigration**
            'permis de résidence', 'citoyenneté', 'passeport', 'visa', 'douane',
            'ambassade',
            'impôts',

            // **Healthcare**
            'hôpital', 'médecin', 'ordonnance', 'pharmacie',
            'urgence', 'vaccination', 'symptômes', 'dentiste', 'infirmière',

            // **Education**
            'diplôme', 'université', 'inscription', 'scolarité',
            'élève', 'professeur', 'devoir', 'examen', 'bibliothèque',

            // **Canadian Culture & Society**
            'diversité', 'bilingue', 'hiver', 'neige', 'patinage',
            'hockey', 'érablière', 'poutine',
            'parc national', 'réconciliation', 'autochtone',

            // **Practical Verbs**
            'remplir', 'signer', 'demander', 'répondre', 'comprendre',
            'expliquer', 'télécharger', 'soumettre', 'travailler', 'étudier',

            // **Adjectives for Descriptions**
            'obligatoire', 'légal', 'urgent', 'permanent', 'temporaire',
            'sécuritaire', 'culturel', 'officiel', 'gratuit', 'payant',

            // **Technology & Communication**
            'courriel', 'téléchargement',
            'application', 'imprimante', 'scanner',

            // **Shopping & Services**
            'panier', 'caisse', 'rabais', 'remboursement',
            'livraison', 'étiquette', 'facture', 'prospérité', 'authenticité', 'vertu', 'culpabilité', 'solitude',
            'revendication', 'foi', 'vérité', 'peur', 'paix', 'doute', 'sentiment',
            'confiance', 'connaissance', 'lumière', 'volonté',

            // Actions & Processes
            'traite', 'condamnation', 'découverte', 'lutte', 'mise', 'formation',
            'enseignement', 'gestion', 'recrutement', 'remise', 'traitement', 'enquête',
            'contrôle', 'comportement', 'rayonnement',

            // Objects & Concepts
            'toile', 'chronique', 'apparition', 'patrie', 'cible', 'sauvegarde',
            'configuration', 'racine', 'pierre', 'plume', 'œuvre', 'presse', 'preuve',
            'guerre', 'forme', 'loi', 'matière', 'affaire', 'vis', 'croissance', 'tête',
            'règle', 'santé', 'note', 'moyenne', 'moitié', 'montre', 'figure', 'valeur',
            'façon', 'époque', 'somme', 'faveur', 'rendement', 'trimestre', 'détour',
            'prétention', 'recueil', 'rédaction', 'or', 'poids', 'plan', 'plaisir', 'peuple',
            'intérêt', 'cadre', 'récit', 'cœur', 'roi', 'courant', 'compte', 'service',
            'sein', 'mouvement', 'niveau', 'réseau', 'risque', 'bois', 'sort', 'succès',
            'siècle', 'conseil', 'marque', 'chapitre', 'titre', 'voix', 'démarche',
            'propriété', 'conception', 'contenu', 'objectif', 'manque',
            'vers', 'traité', 'bas', 'taux', 'avis', 'intérieur', 'cas', 'personnage', 'juge',
            'sens', 'discours', 'four', 'ouvrage', 'fait', 'vol', 'état'
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
            document.getElementById("comt-form").innerHTML = "";
            document.getElementById("comments").innerHTML = "";

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

                elmt.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const isCorrect = this.dataset.correct === 'true';
                        feedback.textContent = isCorrect ? 'Correct! 🎉' : `Incorrect 😢 Answer: ${correctFrenchWord}/${img.imageName}`;
                        feedback.style.color = isCorrect ? 'green' : 'red';
                        btn.style.backgroundColor = isCorrect ? '#dfffdf' : '#ffe0e0';

                        // Disable buttons after selection
                        elmt.querySelectorAll('.quiz-option').forEach(b => {
                            b.disabled = true;
                        });
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
            document.getElementById("comt-form").innerHTML = ""
            document.getElementById("comments").innerHTML = ""
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

        async function newGame() {
            try {
                localStorage.setItem('index', JSON.stringify(0));
                apiService.getGraphs(function (err, imgts) {
                    if (err) return onError(err);
                    localStorage.setItem('random_list', JSON.stringify(generateRandomList(imgts.length)));
                });
                updateGraph();
            } catch (error) {
                return onError(error);
            }
        }
        async function back() {
            try {
                window.location.href = '/';
            } catch (error) {
                return onError(error);
            }
        }


        document.getElementById("bc").addEventListener('click', back);
        document.getElementById("ng").addEventListener('click', newGame);


        (function refresh() {

            let storedList = JSON.parse(localStorage.getItem('random_list')) || null;
            let idx = JSON.parse(localStorage.getItem('index')) || null;
            if (idx === null) {
                localStorage.setItem('index', JSON.stringify(0));
            }
            if (storedList === null) {
                apiService.getGraphs(function (err, imgts) {
                    if (err) return onError(err);
                    localStorage.setItem('random_list', JSON.stringify(generateRandomList(imgts.length)));
                });
            }

            updateGraph();
            console.log(JSON.parse(localStorage.getItem('random_list')));
            //setTimeout(refresh, 5000);
        }());

    });
})();