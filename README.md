# ShiftLink 🚦

## 🔍 Project Overview

**ShiftLink** aims to bridge the gap between call center agents and their supervisors, making the communication process more efficient and organized. With ShiftLink, users can initiate conversations, route messages, and manage interactions without leaving the Rocket.Chat environment. The project is perfect for teams needing a reliable, integrated chat solution to manage shifts, announcements, and urgent updates.

### 🌟 Key Features

- **Real-Time Messaging**: Connect agents and managers instantly with a dedicated communication channel.
- **Automated Routing**: Automatically route messages to the appropriate channels or individuals based on predefined rules.
- **API Integration**: Seamless integration with Rocket.Chat via REST APIs to manage users, messages, and channels.
- **Scalable Setup**: Easily deployable using Docker and Docker Compose, making it simple to set up and manage.

## 🛠️ Project Structure

- **`node-api`**: The heart of the application, written in Node.js, containing all the server logic and API interactions.
  - **`app.js`**: The main application file that starts the server and handles incoming requests.
  - **`routes`**: Defines the API endpoints for message handling and routing.
  - **`utils`**: Utility functions to simplify API calls to Rocket.Chat.
  - **`middlewares`**: Middleware functions for logging, authentication, and request handling.

- **Docker Compose Files**:
  - **`compose.yml`**: Main Docker setup for deploying ShiftLink with all necessary services.
  - **`composeWithHubot.yml`**: An extended setup including Hubot for advanced automation.

- **Configuration**:
  - **`nginx.conf`**: Configuration file for Nginx, acting as a reverse proxy to manage requests between services.

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Node.js](https://nodejs.org/) (version 18+) installed for local development.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/ShiftLink.git
   cd ShiftLink
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file in the `node-api` directory to set up your Rocket.Chat credentials and other required configurations.

3. **Run the Application**:
   Use Docker Compose to build and start the services:
   ```bash
   docker-compose -f compose.yml up --build
   ```

4. **Access the Application**:
   - Your Node.js server will be running, and you can start managing communications directly from Rocket.Chat.

### Local Development

To start the server locally without Docker, run:
```bash
cd node-api
npm install
npm start
```

## 📚 How It Works

1. **Listen for Messages**: The Node.js server listens for messages directed at `rocket.cat` and triggers specific workflows based on keywords.
2. **Automate Connections**: When users send a command like “connect,” ShiftLink automatically pairs them with an available manager or relevant channel.
3. **Manage Chats**: The system ensures that messages are routed appropriately, logging all activities for accountability.

## 🌐 Future Enhancements

- **Smart Routing Algorithms**: Implement AI-based routing to connect agents to the best available managers based on past interactions.
- **Enhanced Analytics**: Provide detailed reports on chat interactions, response times, and agent performance.
- **Slack and Microsoft Teams Integration**: Expand beyond Rocket.Chat for broader usability.

## 🤝 Contributing

Contributions are welcome! To get started, fork the repository, create a new branch, and submit a pull request with your changes.

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute!

## 📬 Contact

For any questions or support, reach out to wh1ter0seunm4sked@gmail.com
