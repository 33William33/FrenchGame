//closure of index
let spell = (function () {
    "use strict";
    window.addEventListener("load", function () {

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

                    if (userAnswer === correctFrenchWord) {
                        feedback.textContent = "Correct! 🎉";
                        feedback.style.color = 'green';
                    } else {
                        feedback.textContent = `Incorrect😢. Answer: ${correctFrenchWord}/${img.imageName}`;
                        feedback.style.color = 'red';
                    }

                    // Clear input after check
                    input.value = '';
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

        async function newGame() {
            try {
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
                window.location.href = '/';
            } catch (error) {
                return onError(error);
            }
        }


        document.getElementById("bc").addEventListener('click', back);
        document.getElementById("ng").addEventListener('click', newGame);

        (function refresh() {

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