# MyBlog - AI-Powered Modern Blogging Platform

<div align="center">
  <h3>A Full-Stack MERN Application featuring Google Gemini AI</h3>
</div>

## 🚀 Overview

**MyBlog** is a next-generation blogging platform that seamlessly integrates Artificial Intelligence to empower writers and readers. Built with the **MERN Stack** (MongoDB, Express, React, Node.js), it features a modern, responsive UI and a suite of AI tools for content generation, summarization, and accessibility.

**Live Demo Preview:** (Add your deployed link here)

## ✨ Key Features

### 🤖 AI Integration (Powered by Gemini)
-   **Writer's Block Killer**: Generate comprehensive blog posts from a single topic.
-   **Smart Summaries**: Auto-generate concise executive summaries for every article.
-   **SEO Automation**: AI-generated tags and SEO-optimized titles.
-   **Multimodal Experience**:
    -   **Text-to-Speech**: Listen to articles with AI-generated audio.
    -   **Visuals**: Generate stylized cover images on the fly.
-   **Global Reach**: Instant high-fidelity translation of posts while preserving Markdown.

### 🛡️ Security & Architecture
-   **Authentication**: Secure JWT-based auth with `bcrypt` password hashing.
-   **RBAC**: Role-Based Access Control (Admin vs. User) for content moderation.
-   **Protection**: Rate limiting, Helmet security headers, and input sanitization.
-   **Mock Mode**: Built-in "Preview Mode" to run the full frontend without a backend (great for demos).

### ⚡ Performance & Polish
-   **Tech Stack**: React 19, Vite, Tailwind CSS (optimized build).
-   **SEO**: Dynamic Open Graph tags and Twitter Cards via `react-helmet-async`.
-   **UX**: Toast notifications, skeleton loaders, and responsive mobile design.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
-   **Backend**: Node.js, Express.js.
-   **Database**: MongoDB (Mongoose ODM).
-   **AI**: Google Generative AI SDK (`@google/genai`).

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)
-   Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/myblog.git
    cd myblog
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root:
    ```env
    MONGO_URI=mongodb://localhost:27017/myblog
    JWT_SECRET=your_super_secret_key
    API_KEY=your_gemini_api_key
    ```

4.  **Run Locally (Dev Mode)**
    This runs both the Frontend (Vite) and Backend (Express) concurrently.
    ```bash
    npm run dev      # Starts Vite
    npm run server   # Starts Express (in a separate terminal)
    ```

## 🤝 Portfolio Demo

For recruiters and visitors, you can use the built-in **Quick Login** buttons on the login page:

-   **Demo User**: Explore the reading and writing experience.
-   **Admin User**: Access the dashboard and user management tools.

---

© 2024 MyBlog. Built for the Future of Content.
