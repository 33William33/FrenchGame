//closure of index
let index = (function () {
    "use strict";
    window.addEventListener("load", function () {
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
                    
                    // Add user info to user details
                    const userDetails = document.querySelector('.user-details');
                    if (userDetails) {
                        // Add join date info
                        const joinDate = new Date(user.createdAt).toLocaleDateString();
                        const existingRole = userDetails.querySelector('.user-role');
                        if (existingRole) {
                            existingRole.textContent = `Joined ${joinDate}`;
                        }
                    }
                }
            });
        }

        // Image Modal Functions
        function openImageModal(imageData) {
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            const modalTitle = document.getElementById('modalTitle');
            const modalEnglish = document.getElementById('modalEnglish');
            const modalFrench = document.getElementById('modalFrench');
            const modalDate = document.getElementById('modalDate');

            // Populate modal with image data
            modalImage.src = imageData.url;
            modalTitle.textContent = `${imageData.imageName} - ${imageData.author}`;
            modalEnglish.textContent = imageData.imageName;
            
            // Add pronunciation button to French word in modal
            modalFrench.innerHTML = `
                ${imageData.author}
                <button class="pronunciation-btn modal-pronunciation" data-french-text="${imageData.author}" title="Listen to French pronunciation">
                    <i class="fas fa-volume-up"></i>
                </button>
            `;
            
            // Add event listener for modal pronunciation button
            const modalPronunciationBtn = modalFrench.querySelector('.pronunciation-btn');
            modalPronunciationBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const frenchText = this.getAttribute('data-french-text');
                playFrenchPronunciation(frenchText, this);
            });
            
            // Format date
            const dateStr = new Date(imageData.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            modalDate.textContent = `Created: ${dateStr}`;


            // Show modal
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        function closeImageModal() {
            const modal = document.getElementById('imageModal');
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scrolling
        }

        // Set up modal close handlers
        function setupModalHandlers() {
            const modal = document.getElementById('imageModal');
            const modalClose = document.getElementById('modalClose');

            // Close button
            modalClose.addEventListener('click', closeImageModal);

            // Click outside modal to close
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeImageModal();
                }
            });

            // ESC key to close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    closeImageModal();
                }
            });
        }

        async function createImage(title, id, author, url) {
            document.getElementById("display").innerHTML = ""
            
            // Calculate level based on image ID (groups of 30)
            const level = Math.floor((id - 1) / 30) + 1;
            
            let elmt = document.createElement("div");
            elmt.className = "img-format";
            elmt.innerHTML = `<div class="img-element">
                              <div class="img-metadata">
                                  <div class="img-id">📌 #${id}</div>
                                  <div class="img-level">🎯 Level: ${level}</div>
                              </div>
                              <div class="img-title">🏆French: ${author} 
                              <button class="pronunciation-btn" data-french-text="${author}" title="Listen to French pronunciation">
                                      <i class="fas fa-volume-up"></i>
                              </button>
                              </div>
                              <div class= "control">
                              <div class="left-icon icon"></div>
                              <div id="imageId" class="hide">${id}</div>
                              <img class="img-picture" src="${url}">
                              <div class="right-icon icon"></div>
                              </div>
                              <div class="below">
                              <div class="img-username">
                                  🍔English: ${title}
                              </div>
                              <div class="sentence-section">
                                  <div class="sentence-display" id="sentence-${id}">
                                      <div class="sentence-header">
                                          <div class="sentence-label">💬 Sentence:</div>
                                          <div class="sentence-actions">
                                              <button class="sentence-btn edit-sentence" data-image-id="${id}" data-french-word="${author}" title="Add/Edit sentence">
                                                  <i class="fas fa-edit"></i> Edit
                                              </button>
                                          </div>
                                      </div>
                                      <div class="sentence-text">Loading...</div>
                                  </div>
                              </div>
                              </div>
                              </div>`;
            
            // Add event listener for pronunciation button
            const pronunciationBtn = elmt.querySelector('.pronunciation-btn');
            pronunciationBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const frenchText = this.getAttribute('data-french-text');
                playFrenchPronunciation(frenchText, this);
            });
            
            // Add event listeners for sentence management
            const editSentenceBtn = elmt.querySelector('.edit-sentence');
            
            editSentenceBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const imageId = this.getAttribute('data-image-id');
                const frenchWord = this.getAttribute('data-french-word');
                showSentenceEditModal(imageId, frenchWord);
            });
            
            // Load existing sentence for this image
            loadSentence(id);
            
            // Add click handler for image maximization
            const imgElement = elmt.querySelector(".img-picture");
            imgElement.addEventListener("click", function(e) {
                // Stop event propagation to prevent navigation
                e.stopPropagation();
                
                // Get image data and open modal
                apiService.getGraph(id, function (err, img) {
                    if (err) {
                        onError("Failed to load image details");
                    } else {
                        openImageModal(img);
                    }
                });
            });
            
            elmt
                .querySelector(".left-icon")
                .addEventListener("click", function (e) {
                    let imgidPer = id
                    if (imgidPer === 1)
                        imgidPer = 2
                    displayImage(imgidPer - 1)
                });
            //update when click right
            elmt
                .querySelector(".right-icon")
                .addEventListener("click", function (e) {
                    let imgidPer = id
                    displayImage(imgidPer + 1)
                });
            document.querySelector("#display").prepend(elmt);
            // createCmtForm(id);
            // updateComments(id, 0)

        }



        function setEmptyImage(id) {
            document.getElementById("comments").innerHTML = ""
            let elmt = document.createElement("div");
            elmt.className = "img-format";
            elmt.innerHTML = `<div class="img-element">
                              <div class="img-title">Title:Empty Slot</div>
                              <div class= "control">
                              <div class="left-icon icon"></div>
                              <div id="imageId" class="hide">Empty Slot</div>
                              <img class="img-picture" src="media/empty.png">
                              <div class="right-icon icon"></div>
                              </div>
                              <div class="below">
                              <div class="img-username">Auther:Empty Slot</div>
                              </div>
                              </div>`;
            elmt
                .querySelector(".left-icon")
                .addEventListener("click", function (e) {
                    let imgidPer = id
                    if (imgidPer == 1)
                        imgidPer = 2
                    displayImage(imgidPer - 1)
                });
            //update when click right
            elmt
                .querySelector(".right-icon")
                .addEventListener("click", function (e) {
                    let imgidPer = id
                    displayImage(imgidPer + 1)
                });
            document.querySelector("#display").prepend(elmt);
        }

        async function displayImage(imgid) {
            apiService.getGraph(imgid, function (err, img) {
                if (err) {
                    displayImage(imgid - 1)
                } else {
                    createImage(img.imageName, img._id, img.author, img.url)
                }

            })
        }

        async function updateGraph() {
            apiService.getGraphs(function (err, imgts) {
                if (err) return onError(err);
                if (imgts.length > 0) {
                    imgts = imgts.reverse(); // Reverse the array to show newest first
                    var params = (new URL(document.location)).searchParams;
                    var imgid = params.get("img");
                    if (imgid !== undefined && imgid !== null) {
                        displayImage(imgid)
                    } else {
                        createImage(imgts[0].imageName, imgts[0]._id, imgts[0].author, imgts[0].url);
                    }
                } else {
                    document.getElementById("display").innerHTML = ""
                }
            });
        }

        async function translate() {
            apiService.getGraphs(function (err, imgts) {
                if (err) return onError(err);
                if (imgts.length > 0) {
                    for (let i = 0; i < imgts.length; i++) {
                        apiService.translate(i + 1);
                    }
                    console.log(imgts);
                }
            });
        }

        async function initializeGame() {
            try {
                window.location.href = '/group-select.html?game=match';
            } catch (error) {
                return onError(error);
            }
        }

        async function initializeSpell() {
            try {
                window.location.href = '/group-select.html?game=spell';
            } catch (error) {
                return onError(error);
            }
        }

        async function initializeDropGame() {
            try {
                window.location.href = '/group-select.html?game=drop';
            } catch (error) {
                return onError(error);
            }
        }

        async function initializeDropSentenceGame() {
            try {
                window.location.href = '/group-select.html?game=drop-sentence';
            } catch (error) {
                return onError(error);
            }
        }

        document.getElementById("check").addEventListener("click", function (e) {
            let check = document.getElementById("check");
            let elmt = document.getElementById("create-add-form");
            if (check.checked) {
                elmt.classList.add("show");
                elmt.style.display = "block";
            } else {
                elmt.classList.remove("show");
                elmt.style.display = "none";
            }
        });

        document.getElementById("game").addEventListener('click', initializeGame);

        document.getElementById("spell").addEventListener('click', initializeSpell);

        document.getElementById("drop-game").addEventListener('click', initializeDropGame);

        document.getElementById("drop-sentence-game").addEventListener('click', initializeDropSentenceGame);

        document
            .getElementById("create-add-form")
            .addEventListener("submit", function (e) {
                let title = document.getElementById("image-title").value;
                let author = document.getElementById("author-name").value;
                let id = apiService.addImage(title, author);
                document.getElementById("create-add-form").reset();
                let elmt = createImage(title, id, author);
                document.getElementById("display").prepend(elmt);
                updateImage(id);
            });

        // Sentence management functions
        function loadSentence(imageId) {
            apiService.getSentence(imageId, function(err, data) {
                const sentenceDisplay = document.getElementById(`sentence-${imageId}`);
                
                if (err || !data || !data.sentence) {
                    if (sentenceDisplay) {
                        sentenceDisplay.querySelector('.sentence-text').textContent = 'Click "Edit" to add sentence.';
                        sentenceDisplay.querySelector('.sentence-text').style.fontStyle = 'italic';
                        sentenceDisplay.querySelector('.sentence-text').style.color = '#6c757d';
                    }
                } else {
                    if (sentenceDisplay) {
                        sentenceDisplay.querySelector('.sentence-text').textContent = data.sentence;
                        sentenceDisplay.querySelector('.sentence-text').style.fontStyle = 'normal';
                        sentenceDisplay.querySelector('.sentence-text').style.color = '#2c3e50';
                    }
                }
            });
        }
        
        function showSentenceEditModal(imageId, frenchWord) {
            // Get current sentence
            apiService.getSentence(imageId, function(err, data) {
                const currentSentence = (data && data.sentence) ? data.sentence : '';
                
                // Create modal HTML
                const modalHtml = `
                    <div class="sentence-modal" id="sentenceModal">
                        <div class="sentence-modal-content">
                            <div class="sentence-modal-header">
                                <h3><i class="fas fa-edit"></i> Edit Sentence for "${frenchWord}"</h3>
                                <button class="sentence-modal-close">&times;</button>
                            </div>
                            <div class="sentence-modal-body">
                                <label for="sentenceInput">Enter a sentence using the French word "${frenchWord}":</label>
                                <textarea id="sentenceInput" placeholder="Example: Je mange une pomme rouge." maxlength="500">${currentSentence}</textarea>
                                <div class="sentence-modal-actions">
                                    <button class="sentence-save-btn">
                                        <i class="fas fa-save"></i> Save Sentence
                                    </button>
                                    <button class="sentence-cancel-btn">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to page
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const modal = document.getElementById('sentenceModal');
                const textarea = document.getElementById('sentenceInput');
                
                // Focus and select text
                setTimeout(() => {
                    textarea.focus();
                    if (currentSentence) {
                        textarea.select();
                    }
                }, 100);
                
                // Event listeners
                modal.querySelector('.sentence-modal-close').addEventListener('click', closeSentenceModal);
                modal.querySelector('.sentence-cancel-btn').addEventListener('click', closeSentenceModal);
                modal.querySelector('.sentence-save-btn').addEventListener('click', function() {
                    saveSentence(imageId, frenchWord, textarea.value.trim());
                });
                
                // Close on ESC key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && modal) {
                        closeSentenceModal();
                    }
                });
                
                // Close on background click
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeSentenceModal();
                    }
                });
            });
        }
        
        function closeSentenceModal() {
            const modal = document.getElementById('sentenceModal');
            if (modal) {
                modal.remove();
            }
        }
        
        function saveSentence(imageId, frenchWord, sentence) {
            if (!sentence) {
                onError('Please enter a sentence before saving.');
                return;
            }
            
            apiService.saveSentence(imageId, sentence, function(err, data) {
                if (err) {
                    onError('Failed to save sentence: ' + err);
                } else {
                    closeSentenceModal();
                    loadSentence(imageId); // Refresh the sentence display
                    
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #28a745;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        font-size: 14px;
                        z-index: 1000;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                        max-width: 300px;
                    `;
                    successMsg.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        Sentence saved successfully!
                    `;
                    document.body.appendChild(successMsg);
                    setTimeout(() => {
                        if (successMsg.parentNode) {
                            successMsg.remove();
                        }
                    }, 3000);
                }
            });
        }

        (function refresh() {
            // Load user information
            loadUserInfo();
            
            // Setup modal handlers
            setupModalHandlers();
            
            // Add event listener for logs button
            const logsBtn = document.getElementById('logs-btn');
            if (logsBtn) {
                logsBtn.addEventListener('click', function() {
                    window.location.href = '/logs';
                });
            }
            
            // Load images
            updateGraph();
            //setTimeout(refresh, 5000);
        }());

    });
})();

// Global function for French pronunciation using proxied Google Translate TTS
function playFrenchPronunciation(frenchText, buttonElement) {
    console.log(`[TTS] Starting pronunciation for: "${frenchText}"`);
    
    // Show loading state
    const originalIcon = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    buttonElement.disabled = true;
    
    // Function to restore button state
    const restoreButton = () => {
        buttonElement.innerHTML = originalIcon;
        buttonElement.disabled = false;
    };

    // Try Google TTS first, fallback to Web Speech API
    console.log('[TTS] Using proxied Google Translate TTS...');
    tryProxiedGoogleTTS(frenchText, restoreButton);

    function tryProxiedGoogleTTS(text, restoreButton) {
        console.log('[TTS] Google TTS: Starting proxied request...');
        try {
            // Use server proxy endpoint to avoid CORS issues
            const cleanText = encodeURIComponent(text.trim());
            const ttsUrl = `/api/tts/${cleanText}`;
            console.log('[TTS] Google TTS: URL -', ttsUrl);
            
            // Create audio element
            const audio = new Audio();
            let hasEnded = false; // Flag to prevent multiple calls
            
            audio.onloadstart = () => {
                console.log('[TTS] Google TTS: Audio loading started');
            };
            audio.oncanplay = () => {
                console.log('[TTS] Google TTS: Audio can play, attempting to start...');
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('[TTS] Google TTS: Audio playing successfully');
                    }).catch(error => {
                        console.log('[TTS] Google TTS: Play failed -', error);
                        if (!hasEnded) {
                            hasEnded = true;
                            clearTimeout(loadTimeout);
                            tryWebSpeechAPI(text, restoreButton);
                        }
                    });
                }
            };
            audio.onended = () => {
                console.log('[TTS] Google TTS: Success - pronunciation completed');
                if (!hasEnded) {
                    hasEnded = true;
                    clearTimeout(loadTimeout);
                    restoreButton();
                }
            };
            audio.onerror = (e) => {
                console.log('[TTS] Google TTS: Audio error -', e);
                if (!hasEnded) {
                    hasEnded = true;
                    clearTimeout(loadTimeout);
                    tryWebSpeechAPI(text, restoreButton);
                }
            };
            // Set timeout for loading
            const loadTimeout = setTimeout(() => {
                console.log('[TTS] Google TTS: Timeout - taking too long to load');
                if (!hasEnded) {
                    hasEnded = true;
                    tryWebSpeechAPI(text, restoreButton);
                }
            }, 10000); // Increased timeout for server processing
            audio.onload = () => {
                console.log('[TTS] Google TTS: Audio loaded successfully');
                // Don't clear timeout here, let onended handle it
            };
            audio.src = ttsUrl;
            audio.load();
        } catch (error) {
            console.log('[TTS] Google TTS: Exception -', error);
            tryWebSpeechAPI(text, restoreButton);
        }
    }

    function tryWebSpeechAPI(text, restoreButton) {
        console.log('[TTS] Web Speech API: Starting browser TTS...');
        try {
            if (!('speechSynthesis' in window)) {
                console.log('[TTS] Web Speech API: Not supported in this browser');
                showPronunciationError(restoreButton);
                return;
            }

            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR'; // French language
            utterance.rate = 0.8; // Slightly slower for clarity
            utterance.volume = 1;
            
            utterance.onstart = () => {
                console.log('[TTS] Web Speech API: Speech started');
            };
            
            utterance.onend = () => {
                console.log('[TTS] Web Speech API: Success - pronunciation completed');
                restoreButton();
            };
            
            utterance.onerror = (event) => {
                console.log('[TTS] Web Speech API: Error -', event.error);
                showPronunciationError(restoreButton);
            };
            
            // Try to get a French voice
            const voices = speechSynthesis.getVoices();
            const frenchVoice = voices.find(voice => 
                voice.lang.startsWith('fr') || 
                voice.name.toLowerCase().includes('french') ||
                voice.name.toLowerCase().includes('francais')
            );
            
            if (frenchVoice) {
                utterance.voice = frenchVoice;
                console.log('[TTS] Web Speech API: Using French voice -', frenchVoice.name);
            } else {
                console.log('[TTS] Web Speech API: No French voice found, using default');
            }
            
            speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.log('[TTS] Web Speech API: Exception -', error);
            showPronunciationError(restoreButton);
        }
    }
}

function showPronunciationError(restoreButton) {
    console.log('[TTS] All pronunciation methods failed - showing error message');
    // Show user-friendly error message
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        max-width: 300px;
    `;
    errorMsg.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        Pronunciation not available. Please check your internet connection or browser settings.
    `;
    document.body.appendChild(errorMsg);
    setTimeout(() => {
        if (errorMsg.parentNode) {
            errorMsg.remove();
        }
    }, 4000);
    restoreButton();
}