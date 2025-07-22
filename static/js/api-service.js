let apiService = (function () {
    let module = {};

    /*  ******* Data types *******
      image objects must have at least the following attributes:
          - (String) imageId 
          - (String) title
          - (String) author
          - (String) url
          - (Date) date

      comment objects must have the following attributes
          - (String) commentId
          - (String) imageId
          - (String) author
          - (String) content
          - (Date) date
    */

    function send(method, url, data, callback) {
        // 1. Validate callback is a function
        const hasCallback = typeof callback === 'function';

        // 2. Create proper fetch config
        const config = {
            method: method.toUpperCase(),
            headers: {}
        };

        // 3. Set body only for non-GET/DELETE methods
        if (!['GET', 'DELETE'].includes(config.method)) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }

        // 4. Return a promise for modern async/await usage
        return fetch(url, config)
            .then(async (response) => {
                // Handle non-JSON responses
                const contentType = response.headers.get('content-type');
                const data = contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} - ${data.message || data}`);
                }

                // Only call callback if provided
                hasCallback && callback(null, data);
                return data;
            })
            .catch((error) => {
                console.error('Request failed:', error);

                // Only call callback if provided
                if (hasCallback) {
                    callback(error, null);
                } else {
                    // Re-throw for promise chain
                    throw error;
                }
            });
    }

    module.getGraphs = function (callback) {
        send("GET", "/api/imgs/", null, callback);
    };

    module.game = function (callback) {
        send("GET", "/api/game/", null, callback);
    };

    module.getGraph = function (id, callback) {
        send("GET", "/api/imgs/" + id, null, callback);
    };

    // add an image to the gallery
    module.addImage = function (title, author, callback) {
        send("POST", "/api/imgs/", { title: title, author: author }, function (err, res) {
            if (err) return callback(err);
            return callback(null);
        });
    };
    // delete an image from the gallery given its imageId

    module.deleteImage = function (imageId, callback) {
        send("DELETE", "/api/imgs/" + imageId, null, function (err, res) {
            if (err) return callback(err);
            return callback(null);
        });
    };
    // update an image from the gallery given its imageId

    module.updateImage = function (imageId, title, author) {
        send("PUT", "/api/imgs/" + imageId, { title: title, author: author }, function (err, res) {
            if (err) return callback(err);
            return callback(null);
        });
    };
    //tell if previous image is empty
    module.prevImage = function (imageId) {
        send("GET", "/api/imgs/" + imageId - 1);
    };

    //tell if next image is empty
    module.nextImage = function (imageId) {
        send("GET", "/api/imgs/" + imageId + 1);
    };
    module.translate = function (imageId) {
        send("GET", "/api/trans/" + imageId);
    };

    // Get current user information
    module.getCurrentUser = function(callback) {
        send("GET", "/api/user/current", null, callback);
    };

    // Log drop word game session
    module.logDropGame = function(gameData, callback) {
        send("POST", "/api/drop-game/log", gameData, callback);
    };

    // Update drop word game session
    module.updateDropGame = function(logId, gameData, callback) {
        send("PUT", "/api/drop-game/log/" + logId, gameData, callback);
    };

    // Get drop word game statistics
    module.getDropGameStats = function(userId, callback) {
        const url = userId ? `/api/drop-game/stats/${userId}` : '/api/drop-game/stats';
        send("GET", url, null, callback);
    };

    // // get image comments
    // module.getComments = function(imageId, page, callback) {
    //     send("GET", "/api/comments/" + imageId + "/" +
    //         page, null, callback);
    // };
    // // add a comment to an image
    // module.addComment = function(imageId, author, comment, callback) {
    //     send("POST", "/api/comments", { imageid: imageId, comment: comment, author: author }, function(err, res) {
    //         if (err) return callback(err);
    //         return callback(null);
    //     });
    // };

    // delete a comment to an image
    // module.deleteComment = function(commentId, callback) {
    //     send("DELETE", "/api/comments/" + commentId, null, function(err, res) {
    //         if (err) return callback(err);
    //         return callback(null);
    //     });
    // };
    // // update a comment to an image
    // module.updateComment = function(commentId, comment, author) {
    //     send("PUT", "/api/comments/" + commentId, { comment: comment, author: author }, function(err, res) {
    //         if (err) return callback(err);
    //         return callback(null);
    //     });
    // };

    return module;
})();