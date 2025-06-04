# ProdBoard Chrome Extension

ProdBoard is a Chrome extension designed to enhance your productivity by providing useful features directly in your browser.

## Features

- Quick access via the Chrome extensions menu
- Modern React-based UI
- Easy to set up and use

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository.

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Build the extension:

   ```bash
   npm run build
   # or
   yarn build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build` directory

## Project Structure

- `src/` - React source code for the extension popup and background scripts
- `public/` - Static assets and the manifest file

## Development

To start the development server with hot reloading:

```bash
npm start
# or
yarn start
```

## License

This project is licensed under the MIT License.

---

Made with ❤️ using React.
