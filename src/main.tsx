// ==============================================
// ENTRY POINT
// Mounts the app into #root and pulls in the global
// stylesheet.
//
// No analytics beacons, matching Beeps rather than
// Ramps and Motion. Adding them later is two imports
// if the family ever wants parity.
// ==============================================
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// api/render injects a plain-text + JSON copy of the scale into the HTML so
// agents that don't run JavaScript can read it. It ships VISIBLE on purpose—
// readability-style extractors honour inline hiding and would skip a
// display:none block, which is the whole point of it existing—so the moment
// JavaScript proves it is running, take it away. It sits outside #root, so
// React never owned it and removing it is safe.
document.getElementById("agent-shadows")?.remove()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
