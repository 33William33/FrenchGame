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
            const modalEdit = document.getElementById('modalEdit');
            const modalDelete = document.getElementById('modalDelete');

            // Populate modal with image data
            modalImage.src = imageData.url;
            modalTitle.textContent = `${imageData.imageName} - ${imageData.author}`;
            modalEnglish.textContent = imageData.imageName;
            modalFrench.textContent = imageData.author;
            
            // Format date
            const dateStr = new Date(imageData.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            modalDate.textContent = `Created: ${dateStr}`;

            // Set up action buttons
            modalEdit.onclick = function() {
                // TODO: Implement edit functionality
                closeImageModal();
                onError('Edit functionality coming soon!');
            };

            modalDelete.onclick = function() {
                if (confirm(`Are you sure you want to delete "${imageData.imageName}"?`)) {
                    apiService.deleteImage(imageData._id, function (err, res) {
                        if (err) return onError(err);
                        closeImageModal();
                        updateGraph();
                    });
                }
            };

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
            let elmt = document.createElement("div");
            elmt.className = "img-format";
            elmt.innerHTML = `<div class="img-element">
                              <div class="img-title">English: ${title}</div>
                              <div class= "control">
                              <div class="left-icon icon"></div>
                              <div id="imageId" class="hide">${id}</div>
                              <img class="img-picture" src="${url}">
                              <div class="right-icon icon"></div>
                              </div>
                              <div class="below">
                              <div class="img-username">French: ${author}</div>
                              <div class="delete-icon icon"></div>
                              </div>
                              </div>`;
            
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
            //update after delete with situations
            elmt
                .querySelector(".delete-icon")
                .addEventListener("click", function (e) {
                    apiService.deleteImage(id, function (err, res) {
                        if (err) return onError(err)
                        updateGraph()
                    });

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
                    var params = (new URL(document.location)).searchParams;
                    var imgid = params.get("img");
                    if (imgid !== undefined && imgid !== null) {
                        displayImage(imgid)
                    } else
                        createImage(imgts[0].imageName, imgts[0]._id, imgts[0].author, imgts[0].url);

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
                window.location.href = '/game.html';
            } catch (error) {
                return onError(error);
            }
        }

        async function initializeSpell() {
            try {
                window.location.href = '/spell.html';
            } catch (error) {
                return onError(error);
            }
        }

        async function initializeDropGame() {
            try {
                window.location.href = '/drop.html';
            } catch (error) {
                return onError(error);
            }
        }

        // Add click handler properly

        // function updateComments(imgid, page) {
        //     document.getElementById("comments").innerHTML = ""
        //     apiService.getComments(imgid, page, function(err, comments) {
        //         if (err) return onError(err);
        //         if (comments.length > 0) {
        //             comments = comments.reverse()
        //             comments.forEach(function(comment) {
        //                 let elmt = createComment(imgid, comment._id, comment.author, comment.comment, comment.date);
        //                 document.getElementById("comments").prepend(elmt);
        //             });
        //             let control = document.createElement("div");
        //             control.className = "cmt-control";
        //             control.innerHTML = `<div id="leftcmt" class="left-cmt icon"></div>
        //                         <div id="rightcmt" class="right-cmt icon"></div>`;
        //             document.getElementById("comments").prepend(control);
        //             let elmte = document.getElementById("comments")
        //             elmte
        //                 .querySelector("#leftcmt")
        //                 .addEventListener("click", function(e) {
        //                     let curPage = page
        //                     if (curPage == 0)
        //                         curPage = 1
        //                     updateComments(imgid, curPage - 1)
        //                 });
        //             elmte
        //                 .querySelector("#rightcmt")
        //                 .addEventListener("click", function(e) {
        //                     let curPage = page
        //                     updateComments(imgid, curPage + 1)
        //                 });
        //         }
        //         if (comments.length == 0 && page != 0) {
        //             onError("Page Not Exists")
        //             updateComments(imgid, page - 1)
        //         }
        //     });
        // }
        // toggle button to change format
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