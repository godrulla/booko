# Booko

Cross-platform desktop book management app built with Tauri, React, and TypeScript.

## Features

- Browse and manage your book collection
- Search and discover books via integrated APIs
- Native desktop experience with Tauri
- Fast, lightweight UI with React and Vite
- Offline-capable with local Rust backend

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Desktop Runtime:** Tauri (Rust)
- **HTTP Client:** Axios
- **Styling:** CSS

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain (for Tauri)
- System dependencies for Tauri: [see Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Install

```bash
npm install
```

### Run (Development)

```bash
# Web dev server only
npm run dev

# Full Tauri desktop app
cd src-tauri && cargo tauri dev
```

### Build

```bash
cd src-tauri && cargo tauri build
```

## Project Structure

```
booko/
├── index.html            # HTML entry point
├── src/                  # React frontend source
│   ├── App.tsx           # Main app component
│   ├── components/       # UI components
│   ├── context/          # React context providers
│   └── assets/           # Static assets
├── src-tauri/            # Tauri/Rust backend
├── public/               # Public static files
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Contributing

PRs welcome.

## License

MIT

## Credits

Built by Armando Diaz Silverio
