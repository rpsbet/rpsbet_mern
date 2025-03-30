import React from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper'; // Correct import for the component
import './index.css'; // Ensure this imports your CSS with the updated class

const Background = ({ mode }) => {
  const sketch = (p) => {
    let nodes = [];

    // Node class to represent moving points
    class Node {
      constructor() {
        this.x = p.random(p.width);
        this.y = p.random(p.height);
        this.vx = p.random(-1, 1);
        this.vy = p.random(-1, 1);
        this.radius = p.random(5, 15);
      }

      move() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x < 0 || this.x > p.width) this.vx *= -1;
        if (this.y < 0 || this.y > p.height) this.vy *= -1;

        // Keep within bounds
        this.x = p.constrain(this.x, 0, p.width);
        this.y = p.constrain(this.y, 0, p.height);
      }

      show() {
        // Adjust node color based on theme mode
        p.fill(mode === 'dark' ? '0, 255, 255, 150' : '255, 0, 255, 150'); // Cyan for dark, magenta for light
        p.noStroke();
        p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
      }
    }

    p.setup = () => {
      // Create a canvas with transparency (alpha enabled)
      p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
      // Do not set a background here to keep the canvas transparent
    };

    p.draw = () => {
      // Clear the canvas without filling a background (keeps it transparent)
      p.clear();

      // Update and show nodes
      nodes.forEach((node) => {
        node.move();
        node.show();

        // Connect nodes with lines if close
        nodes.forEach((otherNode) => {
          let d = p.dist(node.x, node.y, otherNode.x, otherNode.y);
          if (d < 100) {
            // Adjust line color based on theme mode
            p.stroke(mode === 'dark' ? '0, 255, 255, 50' : '255, 0, 255, 50'); // Cyan for dark, magenta for light
            p.line(node.x, node.y, otherNode.x, otherNode.y);
          }
        });
      });
    };

    // Resize canvas on window resize
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    // Initialize nodes after setup to ensure canvas dimensions are available
    for (let i = 0; i < 20; i++) {
      nodes.push(new Node());
    }
  };

  return <ReactP5Wrapper sketch={sketch} className="overlay-canvas" />;
};

export default Background;