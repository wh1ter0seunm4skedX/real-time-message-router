# ShiftLink

ShiftLink is a Node.js application that integrates call center representatives with shift managers through the Rocket.Chat system UI. It facilitates real-time communication by handling incoming webhooks and managing live chat sessions.

## Features

- **Incoming Webhook Handling**: Processes messages from Rocket.Chat and manages chat sessions.
- **Live Chat Room Management**: Creates and maintains live chat rooms for active sessions.
- **User Registration**: Registers users as Omnichannel contacts in Rocket.Chat.
- **Message Forwarding**: Forwards messages to live chat rooms and handles session terminations.

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
    AUTH_TOKEN=your_auth_token
    USER_ID=your_user_id
    WEBHOOK_URL=http://rocketchat:3000/hooks/your_webhook_id/your_webhook_token
    ```

5. **Start the Server**:

    ```bash
    npm start
    ```

## Usage

- **Webhook Endpoint**: `/webhook` - Handles incoming messages and manages live chat sessions.
- **Send Message Endpoint**: `/sendMessageToRocket` - Sends a test message to Rocket.Chat.
- **Fetch Users Endpoint**: `/users` - Fetches a list of all users from Rocket.Chat.
- **Fetch Rooms Endpoint**: `/rooms.get` - Fetches all chat rooms from Rocket.Chat.
- **Direct Messages Endpoint**: `/dm/:roomId` - Fetches messages from a specific direct message room.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
