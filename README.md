# README

This project implements a RESTful API, intended to be used with a [frontend project](https://github.com/kellerflint/sql-project-ui).

## Using this project
If you have not already installed [Node.js](https://nodejs.org/en/download), you must do so before you can run this project.

Upon first cloning this repository, you will need to initialize the Node.js packages in a terminal (or command prompt if you're using windows). Simply `cd` into the repository directory, and run the following command: `npm install`.

Before running the repository, you will need to create a configuration file so that the project may connect with a database. Instructions on how to do this may be found in the [database documentation](doc/database.md#configuration).

After the packages have been installed and the configuration file has been created, you may use `npm run start` to build and run the API.

API routes are documented [here](doc/api.md).