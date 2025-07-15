The objective of these assignments is to build an application called *The Web Gallery* where users can share pictures and comments. This application is similar to existing web applications such as Facebook, Instagram or Tiktok. 

# Building the backend

In this second assignment, you will concentrate on the backend. More specifically, you are going to build a Web API following the REST design principles.

## Instructions

For this assignment, you should use Node.js, the Express web framework and the embedded NoSQL database NeDB to build your backend. Fee free to use any additional Node.js utility packages as needed. Make sure that all of these required packages are recorded in the `package.json` file.

### Code quality and organization

All of your work should be well organized. This directory should be organized as follows:

- `app.js`: the main file
- `package.json` and `package-lock.json`: the Node.js package file
- `static/`: your frontend developed for assignment 1 (HTML, CSS, Javascript and UI media files)
- `db/`: the NeDB database files
- `uploads/`: the uploaded files

Your code must be of good quality and follow all guidelines given during lectures and labs. For more details, please refer to the rubric. Remember, any code found online and improperly credited can constitute an academic violation. 

### Submission

You should submit your work to your Github course repository and Gradescope.
Before submitting your final version. It is strongly recommended to verify that your code is portable. To do so:

- push your work to Github
- clone it into a new directory
- install all packages with the single command `npm install` that will install all packages found in the `package.json` file
- start the app with the command `node app.js`

As mentioned in the first lecture, if your code does not work like the above, you will automatically receive a 0.
The TA will not be spending time exploring why your code does not work. Since everyone agreed to it in lecture 1,
there will not be any exceptions granted.

## Implementing the Web API

In this part, you are going to implement a Web API for your gallery. This api should follow the REST design principles seen in class. This means that the api should define CRUD operations (Create, Read, Update, Delete) on collections and elements. For your application, users should be able to:

- add a new image to the gallery by uploading a file
- retrieve and delete a given image
- add a comment to a given image
- retrieve comments for a given image (a subset of comment at a time but not all comments at once)
- delete a given comment

## Integrating the frontend

This part of the assignment is worth 10% only and builds on top of what you have already built for assignment 1.

In this part, you are going to update your frontend to work with the Web API. As done in assignment 1, this frontend must be a [Single-Page Application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) that loads a single HTML webpage. This webpage is updated dynamically as the user interacts with it. The page does not reload nor transfer control to another page (except for the credits page that you keep separated). All features written for assignment 1 should be updated or completed to push and pull data from the API.

In this assignment you are not allowed to use `XMLHTTPRequest`. Any use of it will result in a 0 for the assignment.
Though, you have the liberty to choose between a callback based or a promise based approach for your frontend API
service.

## Grading
- CRUD API for images [12pts]
- CRUD API for image comments [12pts]
- Overall application [4pts]
- REST Principles [18pts]
- Web API design [22pts]
- Connect the frontend to the backend [20pts]
- Code quality and organization [12pts]

Total: 100pts