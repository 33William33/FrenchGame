//closure of index
let index = (function () {
    "use strict";
    window.addEventListener("load", function () {
        function onError(err) {
            console.error("[error]", err);
            let error_box = document.querySelector("#error_box");
            error_box.innerHTML = err;
            error_box.style.visibility = "visible";
            alert(err)
        }

        async function createImage(title, id, author, url) {
            document.getElementById("display").innerHTML = ""
            document.getElementById("comt-form").innerHTML = ""
            document.getElementById("comments").innerHTML = ""
            let elmt = document.createElement("div");
            elmt.className = "img-format";
            elmt.innerHTML = `<div class="img-element">
                              <div class="img-title">English:${title}</div>
                              <div class= "control">
                              <div class="left-icon icon"></div>
                              <div id="imageId" class="hide">${id}</div>
                              <img class="img-picture" src="${url}">
                              <div class="right-icon icon"></div>
                              </div>
                              <div class="below">
                              <div class="img-username">French:${author}</div>
                              <div class="delete-icon icon"></div>
                              </div>
                              </div>`;
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


        // function createCmtForm(id) {
        //     let elmt = document.createElement("div");
        //     elmt.className = "cmt-form-format";
        //     elmt.innerHTML = `<form class="form" id="create-comm-form" action="/api/comments/" method="POST" enctype="multipart/form-data">
        //                     <button type="submit" class="btn">Add your comment</button>
        //                     <input
        //                     type="text"
        //                     id="author"
        //                     class="form-format"
        //                     placeholder="Enter your name"
        //                     name="author"
        //                     required
        //                     />
        //                     <input
        //                     type="text"
        //                     id="comment"
        //                     class="form-format"
        //                     name="comment"
        //                     placeholder="Enter your comment"
        //                     required
        //                     />
        //                     <input
        //                     type="text"
        //                     id="imageid"
        //                     class="form-format"
        //                     name="imageid"
        //                     value="${id}"
        //                     hidden
        //                     />
        //                     </form>`;
        //     document.querySelector("#comt-form").prepend(elmt);
        //     document
        //         .getElementById("create-comm-form")
        //         .addEventListener("submit", function(e) {
        //             e.preventDefault();
        //             let author = document.getElementById("author").value;
        //             let comment = document.getElementById("comment").value;
        //             let imgid = document.getElementById("imageid").value;
        //             apiService.addComment(imgid, author, comment, function(err, comment) {
        //                 if (err) return onError(err)
        //                 document.getElementById("author").value = ""
        //                 document.getElementById("comment").value = ""
        //                 updateComments(imgid, 0)
        //             });

        //         });
        // }

        // function createComment(imgid, id, author, comment, date) {
        //     let elmt = document.createElement("div");
        //     elmt.className = "cmt";
        //     elmt.id = "cmt" + id;
        //     elmt.innerHTML = `<div class="cmt-author">${author}:</div>
        //                     <div class="cmt-content">${comment}</div>
        //                     <div class="time-below">
        //                     <div class="cmt-time">${date}</div>
        //                     <div class="comid hide">${id}</div>
        //                     <div class="delete-cmt icon"></div>
        //                     </div>`;
        //     elmt
        //         .querySelector(".delete-cmt")
        //         .addEventListener("click", function(e) {
        //             apiService.deleteComment(id, function(err, comment) {
        //                 if (err) return onError(err)
        //             });
        //             updateComments(imgid, 0);
        //         });
        //     return elmt;
        // }

        function setEmptyImage(id) {
            document.getElementById("display").innerHTML = ""
            document.getElementById("comt-form").innerHTML = ""
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
                    // document.getElementById("comt-form").innerHTML = ""
                    // document.getElementById("comments").innerHTML = ""
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
                elmt.style.display = "none";
            } else {
                elmt.style.display = "flex";
            }
        });

        // document.getElementById("trans").addEventListener("click", function (e) {
        //     translate();
        // });

        document.getElementById("game").addEventListener('click', initializeGame);

        document.getElementById("spell").addEventListener('click', initializeSpell);

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

            updateGraph();
            //setTimeout(refresh, 5000);
        }());

    });
})();