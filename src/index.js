import "./styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import * as mapboxgl from "mapbox-gl";
import settings from "./settings.json";
import custom from "./custom-style.json";

mapboxgl.accessToken = settings.accessToken;

const map = new mapboxgl.Map(settings);


map.on("load", async () => {
    //const neighborhoods = await import("../data/asr-nbrhds.json");
    const supervisorDistricts = "https://data.sfgov.org/resource/f2zs-jevy.geojson?$where=sup_dist_num=9"
    const style = map.getStyle();

    style.sources = {
        ...style.sources,
        ...custom.sources
    };
    style.layers.push(...custom.layers);
    map.setStyle(style);

    //map.getSource("neighborhoods-polygons")
        //.setData(neighborhoods);


    map.getSource("supervisor-polygons")
        .setData(supervisorDistricts)
});