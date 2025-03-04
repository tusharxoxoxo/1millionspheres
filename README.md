# PBR - 1,000,000 Spheres

A high-performance Three.js visualization that renders 1,000,000 spheres with physically-based rendering (PBR) materials. This project demonstrates efficient instanced rendering techniques using Three.js and the @three.ez libraries.

## Features

- Renders up to 1,000,000 unique spheres with PBR materials
- Each sphere has unique material properties (roughness, metalness, color)
- Dynamic lighting with environment mapping
- Interactive sphere selection and highlighting
- Performance optimized for 60 FPS
- Configurable rendering parameters via GUI

## Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

## Installation

1. Clone the repository or download the source code

2. Navigate to the project directory
   ```
   cd project
   ```

3. Install dependencies
   ```
   npm install
   ```
   or if you use yarn:
   ```
   yarn
   ```

## Running the Development Server

Start the development server with hot-reload:

```
npm run dev
```
or with yarn:
```
yarn dev
```

The application will automatically open in your default browser. If it doesn't, navigate to the URL shown in the terminal (typically http://localhost:5173/).

## Building for Production

Create an optimized production build:

```
npm run build
```
or with yarn:
```
yarn build
```

The built files will be in the `dist` directory.

## Preview Production Build

To preview the production build locally:

```
npm run preview
```
or with yarn:
```
yarn preview
```

## Technologies Used

- Three.js - 3D rendering library
- @three.ez/main - Simplified Three.js setup and management
- @three.ez/instanced-mesh - Efficient instanced mesh rendering
- TypeScript - Type-safe JavaScript
- Vite - Fast development server and build tool

## Performance Tips

- Adjust the "Total Spheres" slider in the GUI to find the optimal balance between visual density and performance for your hardware
- Reduce "Animated Spheres" count for better performance
- The "Camera Far" setting can significantly impact performance by limiting the number of rendered objects