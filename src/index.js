console.log('Script loaded');
// Import necessary styles and libraries
import "./styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import * as mapboxgl from "mapbox-gl";
import settings from "./settings.json"; // Mapbox settings, including accessToken and initial map setup
import custom from "./custom-style.json"; // Custom styles for the map
import { centroid } from "@turf/turf";
import mapboxGl from "mapbox-gl";

// Set the Mapbox access token
mapboxgl.accessToken = settings.accessToken;

// Initialize the map with settings from settings.json file
const map = new mapboxgl.Map(settings);

// Function to fetch GeoJSON data based on a URL
async function fetchGeoJSON(url) {
    const response = await fetch(url);
    return response.json();
}

let popupsByBlklot = new Map(); // To track popups by blklot

// UpdatePolygons function with turf centroid calculation and popup creation
async function updatePolygons(userInputs) {
    let features = [];
    const bounds = new mapboxGl.LngLatBounds();

    for (const input of userInputs) {
        const url = `https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=${input.blklot}`;
        const data = await fetchGeoJSON(url);
        
        data.features.forEach((feature, index) => {
            features.push(feature);
            const centroidCoords = centroid(feature).geometry.coordinates;
            bounds.extend(centroidCoords);

            // Only create a popup if one does not already exist for this blklot
            if (!popupsByBlklot.has(input.blklot)) {
                // Popup text creation
                const popupText = input.inputName;
                // Calling the popup creation function
                const popup = createPopup(map, centroidCoords, popupText, `popup-${index}`);
                // Store the popup reference
                popupsByBlklot.set(input.blklot, popup);
            }
        });
    }

    // Update dynamic-polygons source
    if (map.getSource("dynamic-polygons")) {
        map.getSource("dynamic-polygons").setData({
            type: "FeatureCollection",
            features: features,
        });
    }

    // Fit the map bounds to the new features
    if (!bounds.isEmpty()) {
        map.once("idle", () => {
            map.fitBounds(bounds, {
                padding: 100 // Adjust padding as needed
            });
        });
    }
}

//Function to create and return default popop
function createPopup(map, lngLat, text, className) {
    const popup = new mapboxgl.Popup({ className: `custom-popup ${className}`, closeButton: false, closeOnClick: false })
    .setLngLat(lngLat)
    .setHTML(`<p>${text}</p>`)
    .addTo(map);

    return popup;
}

// Function to collect inputs and update the map with polygons
async function submitBlklots() {
    console.log("submitBlklots called");
    const userInputs = [
        { blklot: document.getElementById("subjectProperty").value, inputName: "Subject" },
        { blklot: document.getElementById("comparableOne").value, inputName: "Comp 1" },
        { blklot: document.getElementById("comparableTwo").value, inputName: "Comp 2" },
        { blklot: document.getElementById("comparableThree").value, inputName: "Comp 3" },
        { blklot: document.getElementById("comparableFour").value, inputName: "Comp 4" },
        { blklot: document.getElementById("comparableFive").value, inputName: "Comp 5" },
        { blklot: document.getElementById("comparableSix").value, inputName: "Comp 6" },
    ].filter(input => input.blklot.trim() !== ""); // Filter out any inputs that are empty

    // Update the map with polygons based on user inputs
    updatePolygons(userInputs);
};
// Make submitBlklots global after its definition
window.submitBlklots = submitBlklots;

// Attach the DOMContentLoaded listener at the top level
try {
    document.getElementById("submitBtn").addEventListener("click", submitBlklots);

    // Test event listeners for each input
    ["subjectProperty", "comparableOne", "comparableTwo", "comparableThree", "comparableFour", "comparableFive", "comparableSix"].forEach(id => {
        document.getElementById(id).addEventListener("click", () => {
            console.log(`Input ${id} clicked`);
        });
    });
} catch (error) {
    console.error("Error attaching event listeners: ", error);
}

map.on("load", () => {
    const style = map.getStyle();
    style.sources = {
        ...style.sources,
        ...custom.sources
    };
    style.layers.push(...custom.layers);
    map.setStyle(style);



    // Initialize the Mini map
    var minimap = new mapboxgl.Map({
        container: "minimap-container",
        style: "mapbox://styles/domeajar/cluee5jau00jl01q5alqn64a7",
        zoom: map.getZoom() - 4,
        center: map.getCenter(),
    });

    // Function to synchronize the minimap's view with the main map
    function updateMinimap() {
        minimap.jumpTo({
            center: map.getCenter(),
            zoom: map.getZoom() - 4,
        });
    }

    // Update minimap when the main map is moved
    map.on("move", updateMinimap);

    // Initialize frame source and layer in the minimap
    function initializeMinimapFrame() {
        minimap.addSource("frame", {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]] // Initial dummy coordinates
                }
            }
        });

        minimap.addLayer({
            "id": "frame-layer",
            "type": "line",
            "source": "frame",
            "paint": {
                "line-color": "#993404", // Frame color
                "line-width": 2 // Frame thickness
            }
        });
    }

    // Update frame in the minimap to reflect the main map's extent
    function updateMinimapFrame() {
        const bounds = map.getBounds();
        const coordinates = [
            [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
            [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
            [bounds.getNorthWest().lng, bounds.getNorthWest().lat], // Close the polygon loop
        ];

        minimap.getSource("frame").setData({
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [coordinates]
            }
        });

        // Log the frame's source data to the console
        //console.log(minimap.getSource("frame")._data);
    }

    // Ensure minimap is loaded before adding frame source and layer
    minimap.on("load", function() {
        // Initialize frame source and layer on minimap load
        initializeMinimapFrame();

        // Initial update of the frame to reflect the main map's current view
        updateMinimapFrame();
    });

    // Attach event listeners to the main map to update the minimap frame on move
    map.on("move", updateMinimapFrame);
    map.on("moveend", updateMinimapFrame);

map.addControl(new mapboxgl.NavigationControl());
});