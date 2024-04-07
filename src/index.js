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

// Function to clear popups
function clearPopups() {
    popupsByBlklot.forEach((popup, blklot) => {
        popup.remove(); // This removes the popup from the map
    });
    popupsByBlklot.clear(); // Clears the Map to ensure it's empty after removal
}

// Event listener for the clear popups button
document.getElementById('clearPopupsBtn').addEventListener('click', clearPopups);

// Reset function
function reset() {
    // Clear popups
    clearPopups();

    // Clear polygons from the "dynamic-polygons" source
    if (map.getSource('dynamic-polygons')) {
        map.getSource('dynamic-polygons').setData({
            type: 'FeatureCollection',
            features: [] 
        });
    }

    // Reset all input fields to empty, showing placeholder values
    document.querySelectorAll('#input-container input').forEach(input => {
        input.value = '';
        // Additionally clear any error messages if they exist
        clearErrorMessage(input.id);
    });

    // Reset minimap to its default right-hand side position
    const minimapContainer = document.getElementById('minimap-container');
    minimapContainer.style.display = 'block'; // Make sure minimap is visible
    minimapContainer.style.left = ''; // Clear any left positioning
    minimapContainer.style.right = '15px'; // Reset to default right-hand side position

    // Reset the map view to the initial state
    map.jumpTo({
        center: settings.center,
        zoom: settings.zoom
    });

    // If there are any additional application states or visual elements that need resetting, handle them here
}

// Attach the reset function to the "Reset" button
document.getElementById('resetBtn').addEventListener('click', reset);



// UpdatePolygons function with turf centroid calculation and popup creation
async function updatePolygons(userInputs) {
    let features = [];
    const bounds = new mapboxGl.LngLatBounds();

    for (const input of userInputs) {
        // Clear previous error messages for this input if any
        clearErrorMessage(input.inputId);

        const url = `https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=${input.blklot}`;
        try {
            const data = await fetchGeoJSON(url);
            if (data.features.length === 0) {
                // No features found for this APN, so display error message.
                displayErrorMessage(input.inputId, "APN not found");
                continue; // Skip to the next iteration of the loop.
            }
        
            data.features.forEach((feature, index) => {
                features.push(feature);
                const centroidCoords = centroid(feature).geometry.coordinates;
                bounds.extend(centroidCoords);

                // Only create a popup if one does not already exist for this blklot.
                if (!popupsByBlklot.has(input.blklot)) {
                    // Popup text creation.
                    const popupText = input.inputName;
                    // Calling the popup creation function.
                    const popup = createPopup(map, centroidCoords, popupText, `popup-${index}`);
                    // Store the popup reference.
                    popupsByBlklot.set(input.blklot, popup);
                }
            });

        } catch (error) {
            console.error('Error fetching or processing data:', error);
            displayErrorMessage(input.inputId, "Error processing APN");
        }

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

function displayErrorMessage(inputId, message) {
    // Check if an error message already exists
    let errorElement = document.getElementById(`${inputId}-error`);
    if (!errorElement) {
        // Create an error message element
        errorElement = document.createElement('div');
        errorElement.id = `${inputId}-error`;
        errorElement.className = 'input-error'; // Use this class for styling
        // Place the error element below the corresponding input field
        const inputField = document.getElementById(inputId);
        inputField.classList.add('error'); // Add error class to input for styling
        inputField.parentNode.insertBefore(errorElement, inputField.nextSibling);
    }
    // Update the error message
    errorElement.textContent = message;
}

function clearErrorMessage(inputId) {
    // Remove the error message if it exists
    const errorElement = document.getElementById(`${inputId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
    // Remove the error class from the input field
    const inputField = document.getElementById(inputId);
    inputField.classList.remove('error');
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
        { inputId: "subjectProperty", blklot: document.getElementById("subjectProperty").value.replace(/\s+/g, ''), inputName: "Subject" },
        { inputId: "comparableOne", blklot: document.getElementById("comparableOne").value.replace(/\s+/g, ''), inputName: "Comp 1" },
        { inputId: "comparableTwo", blklot: document.getElementById("comparableTwo").value.replace(/\s+/g, ''), inputName: "Comp 2" },
        { inputId: "comparableThree", blklot: document.getElementById("comparableThree").value.replace(/\s+/g, ''), inputName: "Comp 3" },
        { inputId: "comparableFour", blklot: document.getElementById("comparableFour").value.replace(/\s+/g, ''), inputName: "Comp 4" },
        { inputId: "comparableFive", blklot: document.getElementById("comparableFive").value.replace(/\s+/g, ''), inputName: "Comp 5" },
        { inputId: "comparableSix", blklot: document.getElementById("comparableSix").value.replace(/\s+/g, ''), inputName: "Comp 6" },
    ].filter(input => input.blklot.trim() !== ""); // Filter out any inputs that are empty

    // Clear any previous error messages before updating polygons
    userInputs.forEach(input => clearErrorMessage(input.inputId));

    // Update the map with polygons based on user inputs
    updatePolygons(userInputs);
};
// Make submitBlklots global after its definition
window.submitBlklots = submitBlklots;

// Attach the DOMContentLoaded listener at the top level
try {
    // Remove the individual listener for 'submitBtn' and replace with delegation
    document.body.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'submitBtn') {
            submitBlklots();
        }
        // Test event listeners for each input
        ["subjectProperty", "comparableOne", "comparableTwo", "comparableThree", "comparableFour", "comparableFive", "comparableSix"].forEach(id => {
            if (e.target && e.target.id === id) {
                console.log(`Input ${id} clicked`);
            }
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

    // Minimap position and visibility control
    document.getElementById('minimapLeftBtn').addEventListener('click', function() {
        const minimapContainer = document.getElementById('minimap-container');
        minimapContainer.style.display = 'block'; // Make sure minimap is visible
        minimapContainer.style.right = ''; // Clear right property
        minimapContainer.style.left = '15px'; // Move to the left
    });

    document.getElementById('minimapRightBtn').addEventListener('click', function() {
        const minimapContainer = document.getElementById('minimap-container');
        minimapContainer.style.display = 'block'; // Make sure minimap is visible
        minimapContainer.style.left = ''; // Clear any left positioning
        minimapContainer.style.right = '15px'; // Reset to default right-hand side position
    });

    document.getElementById('minimapClearBtn').addEventListener('click', function() {
        document.getElementById('minimap-container').style.display = 'none'; // Hide the minimap
    });

    map.addControl(new mapboxgl.NavigationControl());
});