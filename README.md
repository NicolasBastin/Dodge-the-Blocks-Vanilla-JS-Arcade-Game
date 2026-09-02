# Dodge the Blocks - Vanilla JS Arcade Game

## Project Overview
"Dodge the Blocks" is an interactive arcade game developed entirely from scratch using **native HTML, CSS, and JavaScript**, without relying on any external frameworks or libraries. 

This project was built as part of a web programming course to master the core concepts of web development, including dynamic game loops, Object-Oriented Programming (OOP) in ES6, and DOM manipulation.

## Key Features
* **Dynamic Gameplay & Physics:** Implements a custom game loop with precise collision detection and array-safe physics updates (reverse iteration splicing).
* **Story Mode:** Features an asynchronous "typewriter" text effect using `setInterval` for progressive dialogue display.
* **Custom Particle System:** Generates dynamic visual trails behind asteroids with lifecycle and opacity management (`globalAlpha`).
* **Responsive Design:** Dynamic recalculation of player dimensions and hitboxes (`rescale()`) to ensure consistent gameplay across desktop and mobile devices.
* **Customization & Persistence:** Players can select custom ship skins, with choices and high scores saved locally using the browser's `localStorage`.
* **Audio Integration:** Includes background music and interactive sound effects.

## Technical Architecture
* **OOP Design:** Utilizes ES6 classes with inheritance (a base `Entity` class extended by `Player` and `Block` classes) for clean and maintainable code.
* **Performance-Optimized DOM:** Scoreboards and UI elements are generated dynamically node-by-node (`document.createElement`) to avoid performance bottlenecks associated with massive `innerHTML` parsing.

## Team
Developed by a team of 4 students: Nicolas Bastin, Nathan Samadi, Raymond Wang, and Morgan Laurent.

## How to Play Locally
1. Clone this repository.
2. Open the `index.html` file directly in any modern web browser.
3. Enjoy the game!
