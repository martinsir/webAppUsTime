# SafeDialog

## Project Overview
    SafeDialog is a web application designed to improve communication in relationships, such as couples, friendships, or colleagues.  
    It provides structured dialogue frameworks based on communication best practices.

---

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Set Up the Database](#set-up-the-database)
  - [Configure the Application](#configure-the-application)
  - [Install Dependencies](#install-dependencies)
  - [Run the App](#run-the-app)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features
- **Structured communication templates** for:
  - Couples
  - Friends
  - Colleagues
- **Lobby system** for initiating sessions with unique codes.
- **Mobile-first design** for easy access on any device.
- **Easy setup** and deployment using cPanel.

---

## Technologies Used
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js  
- **Database:** MySQL  
- **Others:** PM2 for process management (optional)  

---

## Requirements
- A server with:
  - Node.js installed
  - MySQL database
- Access to cPanel or equivalent hosting platform.
- FTP client (like FileZilla) or SSH access for file uploads.

---

## Installation

### Set Up the Database
1. Log in to **cPanel** and navigate to **MySQL Databases**.
2. Create a new database (e.g., `safedialog_db`).
3. Create a database user and assign it full privileges to the new database.
4. Import the provided `safedialog.sql` file using **phpMyAdmin**.

### Configure the Application
1. Open the file `config.js` in the project folder.
2. Update it with your database details:

   ```javascript start

   const config = {
       DB_HOST: 'localhost',         // Usually 'localhost' for cPanel
       DB_USER: 'your_username',     // Replace with your MySQL username
       DB_PASSWORD: 'your_password', // Replace with your MySQL password
       DB_NAME: 'safedialog_db',     // Replace with your database name
       PORT: 3000                    // Default port for Node.js apps
   };

   module.exports = config;

----------javascript end


## Install Dependencies

    Run the following command to install the required Node.js dependencies:

    npm install

## Run the App

    To start the application:

     node app.js

    Or use PM2 for better process management:

     npm install -g pm2
     pm2 start app.js

## Configuration

    Ensure the following files are correctly set up:

   - config.js: Contains your database connection details.
   - safedialog.sql: Imports the database structure and sample data.

    Usage

   1. Navigate to the application URL in your browser (e.g., http://yourdomain.com/safedialog).
   2. Create a lobby by entering a name and sharing the lobby code with participants.
   3. Follow the prompts to engage in structured dialogues.

## Troubleshooting

   - Database Connection Error: Ensure the credentials in config.js are correct.
   - Application Not Starting: Check for missing dependencies by running:

        <npm install

    -- If issues persist, clean the node_modules folder and reinstall dependencies:
        rm -rf node_modules package-lock.json
        <npm install

    -- If npm install fails, you can use the --force flag or a clean install command:
        <npm install --force
    -- Alternatively, use npm ci for a clean install (requires a package-lock.json file):
        <npm ci


Access Issues: Confirm that files are uploaded to the correct directory (public_html/safedialog) server.