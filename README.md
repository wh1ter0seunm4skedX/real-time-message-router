# ShiftLink

ShiftLink is a Node.js application that integrates call center representatives with shift managers through the Rocket.Chat system UI. It facilitates real-time communication by handling incoming webhooks and managing live chat sessions, with automatic room closure based on inactivity.

## Features

- **Incoming and Outgoing Webhook Handling**: Processes messages from Rocket.Chat and manages chat sessions, both incoming and outgoing.
- **Live Chat Room Management**: Creates, maintains, and closes live chat rooms for active sessions based on user and agent activity.
- **User Registration and Token Management**: Registers users as Omnichannel contacts in Rocket.Chat, managing tokens securely.
- **Message Forwarding and System Messages**: Forwards messages between users and agents and sends system messages to indicate room closure.
- **Inactivity Timer Management**: Automatically closes chat rooms after a period of inactivity, with the ability to reset or stop timers based on new messages.
- **Error Handling and Logging**: Improved error handling and logging throughout the application for easier debugging and maintenance.

## Installation

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/your-username/ShiftLink.git
    ```

2. **Navigate to the Project Directory**:

    ```bash
    cd ShiftLink
    ```

3. **Install Dependencies**:

    ```bash
    npm install
    ```

4. **Set Up Environment Variables**:

    Create a `.env` file in the root directory and add your Rocket.Chat configuration:

    ```env
    ROCKET_CHAT_URL=http://rocketchat:3000
    AUTH_TOKEN_ADMIN=your_admin_auth_token
    USER_ID_ADMIN=your_admin_user_id
    AUTH_TOKEN_AGENT=your_agent_auth_token
    USER_ID_AGENT=your_agent_user_id
    AUTH_TOKEN_USER=your_user_auth_token
    USER_ID_USER=your_user_user_id
    AUTH_TOKEN_ROCKETCAT=your_rocketcat_auth_token
    USER_ID_ROCKETCAT=your_rocketcat_user_id
    WEBHOOK_URL=http://rocketchat:3000/hooks/your_webhook_id/your_webhook_token
    ```

5. **Start the Server**:

    ```bash
    npm start
    ```

## Usage

- **Incoming Webhook Endpoint**: `/webhook/incoming` - Handles incoming messages from Rocket.Chat agents and manages live chat sessions.
- **Outgoing Webhook Endpoint**: `/webhook/outgoing` - Processes outgoing messages from users to agents.
- **Message Forwarding and Room Management**:
  - Messages are forwarded between users and agents using Rocket.Chat APIs.
  - Rooms are closed automatically after 5 minutes of inactivity, with a system message sent to notify the user.
- **Error Handling**: Proper error handling ensures that all interactions are logged and that the system can recover from unexpected states.
- **System Messages**: Custom system messages are sent when the room is closed due to inactivity, and these messages are ignored to avoid triggering unnecessary actions.

## Code Structure

- **`app.js`**: Main entry point for the application, initializes the server and routes.
- **`routes/agentToUserHandler.js`**: Handles incoming webhooks from Rocket.Chat and manages live chat sessions for agents.
- **`routes/userToAgentHandler.js`**: Handles outgoing webhooks from users and forwards messages to agents.
- **`utils/rocketChat.js`**: Contains helper functions to interact with Rocket.Chat APIs, such as creating contacts, sending messages, and managing rooms.
- **`utils/helpers.js`**: General helper functions, such as generating random tokens for user sessions.
- **`utils/roomManager.js`**: Manages room states, tokens, and inactivity timers for live chat sessions.
- **`middlewares/logger.js`**: Middleware for logging and debugging purposes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
