import "./styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import * as mapboxgl from "mapbox-gl";
import settings from "./settings.json";
import custom from "./custom-style.json";
import { feature } from "@turf/turf";

mapboxgl.accessToken = settings.accessToken;

const map = new mapboxgl.Map(settings);

map.on("load", async () => {
    const subjectProperty = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1153004"
    const comparableOne = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1153021"
    const comparableTwo = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=117002B"
    const comparableThree = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1102009"
    const comparableFour = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1180015"
    const comparableFive = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1156013"
    const comparableSix = "https://data.sfgov.org/resource/acdm-wktn.geojson?blklot=1155010"
    const urls = [subjectProperty, comparableOne, comparableTwo, comparableThree, comparableFour, comparableFive, comparableSix];
    const bounds = new mapboxgl.LngLatBounds();


    const style = map.getStyle();
    style.sources = {
        ...style.sources,
        ...custom.sources
    };
    style.layers.push(...custom.layers);
    map.setStyle(style);

    map.getSource("subject-polygon")
        .setData(subjectProperty)

    map.getSource("comparable-one-polygon")
        .setData(comparableOne)

    map.getSource("comparable-two-polygon")
        .setData(comparableTwo)

    map.getSource("comparable-three-polygon")
        .setData(comparableThree)

    map.getSource("comparable-four-polygon")
        .setData(comparableFour)

    map.getSource("comparable-five-polygon")
        .setData(comparableFive)

    map.getSource("comparable-six-polygon")
        .setData(comparableSix)

    for (const url of urls) {
        const response = await fetch(url);
        const data = await response.json();

        data.features.forEach((feature) => {
            feature.geometry.coordinates.forEach((polygon) => {
                polygon.forEach((coord) => {
                    bounds.extend(coord);
                });
            });
        });    
    }
    
    map.once('idle', () => {
        map.fitBounds(bounds, {
            padding: 100
        });
    });

    // Initialize the Mini map
    var minimap = new mapboxgl.Map({
        container: "minimap-container",
        style: "mapbox://styles/mapbox/light-v11",
        zoom: map.getZoom() - 5,
        center: map.getCenter(),
    });

    // Function to synchronize the minimap's view with the main map
    function updateMinimap() {
        minimap.jumpTo({
            center: map.getCenter(),
            zoom: map.getZoom() - 5,
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
                "line-color": "#f2de96", // Frame color
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
        console.log(minimap.getSource("frame")._data);
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

    
});