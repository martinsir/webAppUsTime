SafeDialog
Project Overview

SafeDialog is a web application designed to improve communication in relationships, such as couples, friendships, or colleagues.
It provides structured dialogue frameworks based on communication best practices.

Table of Contents

    --Features
    --Technologies Used
    --Requirements
    --Installation
    --Configuration
    --Usage
    --Troubleshooting
    --License
	
	
Features

    Structured communication templates for:
        Couples
        Friends
        Colleagues
    Lobby system for initiating sessions with unique codes.
    Mobile-first design for easy access on any device.
    Easy setup and deployment using cPanel.
	
	
Technologies Used

    Frontend: HTML, CSS, JavaScript
    Backend: Node.js
    Database: MySQL
    Others: PM2 for process management (optional)
	

Requirements

    A server with:
        Node.js installed
        MySQL database
    Access to cPanel or equivalent hosting platform.
    FTP client (like FileZilla) or SSH access for file uploads.
	

Installation
 Set Up the Database

    Log in to cPanel and navigate to MySQL Databases.
    Create a new database (e.g., safedialog_db).
    Create a database user and assign it full privileges to the new database.
    Import the provided safedialog.sql file using phpMyAdmin.

 Configure the Application

    Open the file config.js in the project folder.
    Update it with your database details:
------------------------------------------------------------------------------
	const config = {
		DB_HOST: 'localhost',         // Usually 'localhost' for cPanel
		DB_USER: 'your_username',     // Replace with your MySQL username
		DB_PASSWORD: 'your_password', // Replace with your MySQL password
		DB_NAME: 'safedialog_db',     // Replace with your database name
		PORT: 3000                    // Default port for Node.js apps
	};

	module.exports = config;
	
-----------------------------------------------------------------------------
	
 Install Dependencies
	
	--npm Install
	


 To run the app

	--node app.js

		Or use PM2 for better process management:

		--npm install -g pm2
		--pm2 start app.js

Configuration

Ensure the following files are correctly set up:

    config.js: Contains your database connection details.
    safedialog.sql: Imports the database structure and sample data.
	
	
Usage

    Navigate to the application URL in your browser (e.g., http://yourdomain.com/safedialog).
    Create a lobby by entering a name and sharing the lobby code with participants.
    Follow the prompts to engage in structured dialogues.
	
Troubleshooting

    Database Connection Error: Ensure the credentials in config.js are correct.
    Application Not Starting: Check for missing dependencies by running:
		"npm install"

Access Issues: Confirm that files are uploaded to the correct directory (public_html/safedialog).



### License

This project was developed by agency TenDens for Wibling Coaching.

See the [LICENSE.md](LICENSE.md) file for details.

