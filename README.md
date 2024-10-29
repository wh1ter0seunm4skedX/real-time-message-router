# ShiftLink 🚦

## 🔍 Project Overview

**ShiftLink** is designed to streamline communication between call center agents and their supervisors, enhancing organization and efficiency. Within ShiftLink, users can initiate conversations, route messages, and manage interactions—all from within Rocket.Chat. This solution is ideal for teams that need a reliable, integrated chat tool to manage shifts, share announcements, and provide urgent updates.

### 🌟 Key Features

- **Real-Time Messaging**: Instant connection between agents and managers through a dedicated communication channel.
- **Automated Routing**: Route messages to the right channels or individuals based on predefined rules.
- **API Integration**: Smooth integration with Rocket.Chat’s REST APIs for managing users, messages, and channels.
- **Scalable Deployment**: Simple deployment using Docker and Docker Compose, allowing for easy setup and management.

## 🛠️ Project Structure

- **`node-api`**: Core of the application, built in Node.js, containing all server logic and API operations.
  - **`app.js`**: Main application file that initializes the server and handles incoming requests.
  - **`routes`**: Defines API endpoints for message handling and routing.
  - **`utils`**: Contains utility functions to facilitate API calls to Rocket.Chat.
  - **`middlewares`**: Middleware functions for logging, authentication, and request handling.

- **Docker Compose Files**:
  - **`compose.yml`**: Primary Docker configuration for deploying ShiftLink with all required services.

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Node.js](https://nodejs.org/) (version 18+) installed for local development.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/wh1ter0seunm4skedX/ShiftLink.git
   cd ShiftLink
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file in the `node-api` directory to set up Rocket.Chat credentials and other required configurations.

3. **Run the Application**:
   Use Docker Compose to build and start the services:
   ```bash
   docker-compose -f compose.yml up --build
   ```

4. **Access the Application**:
   - Your Node.js server will be running, and you can start managing communications directly within Rocket.Chat.

### Local Development

To start the server locally without Docker, run:
```bash
cd node-api
npm install
npm start
```

## 📚 How It Works

1. **Listen for Messages**: The Node.js server listens for messages directed at `rocket.cat` and triggers specific workflows based on keywords.
2. **Automate Connections**: When users send a command like “connect,” ShiftLink automatically links them to an available manager or relevant channel.
3. **Manage Chats**: The system routes messages to the right channels and logs all activities for easy tracking.

## 🌐 Future Enhancements

- **Smart Routing Algorithms**: Integrate AI-based routing to connect agents with the most suitable managers based on previous interactions.
- **Enhanced Analytics**: Generate detailed reports on chat interactions, response times, and agent performance.

## 📬 Contact

For any questions or support, reach out to wh1ter0seunm4sked@gmail.com
