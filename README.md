# SafeScore 

**SafeScore** is a professional, data-driven football prediction platform that leverages advanced statistical analysis to provide high-probability betting insights. Built with modern web technologies, it offers users a sleek, responsive, and real-time experience.

This repository contains the **frontend and proxy layer** for SafeScore. It is designed to work with the [SafeScore Core Engine](https://huggingface.co/spaces/devtofunmi/safescore-core) but can be adapted for other data sources.

## Features

*   **Smart Predictions:** Algorithmic analysis of form, H2H, goal statistics, and league strength.
*   **Risk Management:** Filter predictions by risk levels: 'Safe', 'Very Safe', and 'Medium Safe'.
*   **Multi-League Coverage:** Supports 14+ major global leagues including Premier League, La Liga, Bundesliga, Serie A, and Champions League.
*   **PWA Support:** Installable as a native-like app on mobile and desktop.
*   **Premium UI:** Dark-mode first design with smooth animations using Framer Motion.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Database:** [Supabase](https://supabase.com/) (Cloud Persistence)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Data Source:** Football-Data.org API
*   **Analytics:** Vercel Analytics

## Core Logic

### 🚀 Prediction Engine
The frontend delegates prediction requests to a private core engine via the `CORE_ENGINE_URL`. This allows for proprietary analysis while keeping the UI and contribution layer open.

### ✅ Automated Verification
SafeScore features an automated settlement system that:
1.  Saves predictions to a Supabase `history` table.
2.  Periodically verifies pending matches against real-world scores using the Football-Data API.
3.  Automatically updates the status (Won/Lost) and final scores for transparency.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   An API Key from [Football-Data.org](https://www.football-data.org/)
*   (Optional) A SafeScore Core Engine API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/devtofunmi/safescore.git
    cd safescore
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Copy the example env file and fill in your keys:
    ```bash
    cp .env.example .env.local
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the result.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Disclaimer: This platform is for informational purposes only. Use the predictions at your own risk. We do not guarantee accuracy or financial gain.*