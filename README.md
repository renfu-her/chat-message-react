# WebP Chat Connect

A modern, responsive chat application built with React, TypeScript, and Tailwind CSS. This application features real-time simulation, image optimization, and secure room management.

## 🚀 Key Features

### 1. Room Management
- **Public Rooms**: Open for anyone to join and chat.
- **Private Rooms**: Creators can set a password. Users must enter the correct password to join.
- **Room Deletion**: Room creators have the exclusive permission to delete their rooms using the trash icon.

### 2. User Experience
- **Dark/Light Mode**: Toggle between themes with persistent preference saving.
- **Responsive Design**: Optimized for both mobile devices and large desktop screens (max-width constrained).
- **Profile Management**: Users can update their display name, avatar, and password.
- **Privacy**: User email addresses are masked in the UI (e.g., `user@*****`) to protect identity.

### 3. Image Optimization
- **Smart Conversion**: Any image uploaded (avatar or chat attachment) is automatically converted to the **WebP** format on the client side before being processed. This ensures fast loading and reduced data usage.

### 4. Security
- **Login CAPTCHA**: A dynamic arithmetic challenge (+, -, *, /) is required during login to prevent automated bot access.
- **Auth Simulation**: Secure password handling and session persistence using local storage.

### 5. Feedback System
- **Reporting**: Users can report bugs, report other users, or provide general feedback directly through the interface.
- **Direct Integration**: The feedback form automatically generates an email to `renfu.her@gmail.com` with necessary user context (ID, Name, Email) pre-filled for efficient support.

## 🤖 Powered by Google AI Studio

This project was architected and developed using **Google AI Studio** and **Gemini models**.

-   **Code Generation**: The complete codebase, including React components, TypeScript interfaces, and Tailwind styling, was generated via iterative prompting.
-   **Algorithm Implementation**: Complex logic such as the **Client-side WebP Conversion** service and the **Math CAPTCHA** generator were created by Gemini.
-   **Mock Backend**: The `mockBackend` service, which simulates WebSocket events (`USER_JOINED`, `NEW_MESSAGE`) and LocalStorage persistence, was designed by AI to replicate a real-world full-stack environment without requiring a server.

**🔗 Project Platform:** [Google AI Studio Project](https://aistudio.google.com/apps/drive/17Uney6O96nHBvTIyUBG7s-pYC4rQuBs5?resourceKey=&showPreview=true&showAssistant=true)

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS (with CSS Variables for theming)
-   **Icons**: Lucide React
-   **State/Storage**: React Hooks & LocalStorage (simulating a backend database)
-   **AI Assistance**: Google Gemini via AI Studio

## 📋 Usage Rules

1.  **Login**:
    -   You must solve the math problem (e.g., "5 + 3 = ?") to log in.
    -   Use the **Refresh** button if the math problem is too difficult.

2.  **Chatting**:
    -   Select a room from the left sidebar to start.
    -   If no room is selected, you will see a "Select a Room" placeholder.
    -   You can send text messages or upload images.

3.  **Private Rooms**:
    -   When creating a room, check "Private Room" to set a password.
    -   These rooms are marked with a Lock icon 🔒.

4.  **Feedback & Support**:
    -   Click the **Warning Icon** (⚠️) in the sidebar footer to open the feedback menu.
    -   Select the type of report (Bug, User Report, Feedback) and describe the issue.
    -   Click "Create Email" to open your mail client.

## 🧪 Test Accounts

You can use these pre-configured accounts to test the application immediately.

| Email | Password |
|-------|----------|
| `user1@test.com` | `password123` |
| `user2@test.com` | `password123` |
| `user3@test.com` | `password123` |
| `user4@test.com` | `password123` |
| `user5@test.com` | `password123` |

## 📦 Installation

This project is designed to run in a standard React environment.

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm start`