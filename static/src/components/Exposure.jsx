import React, { Component } from 'react';
import MapGL, { Popup, NavigationControl } from 'react-map-gl';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
// import DeckGL, {LineLayer} from 'deck.gl';

import { fetchData } from '../Helpers';
import Constants from '../Constants';

import '../App.css';

const url = (process.env.NODE_ENV === 'development' ? Constants.DEV_URL : Constants.PRD_URL);

/**
 * Experimental react-map.gl and deck.gl based React Component
 * to compare with Leaflet/canvas rendering of large GeoJSON data.
 * 
 */
export default class Deck extends Component {
    state = {
        viewport: {
            // latitude: 5.6037,
            // longitude: -0.1870,
            latitude: 5.58,
            longitude: -0.18,
            zoom: 12,
            pitch: 55
        },
        layers: []
    };
    componentDidMount() {
        const map = this.reactMap.getMap();
        fetchData(url + "/api/exposure", (data, error) => {
            if(!error) {
                console.log(data);
                console.log(data[1]['from_lat'], data[1]['from_lon'])
                // const lineLayer = new LineLayer({
                //     id: 'line-layer',
                //     data,
                //     pickable: true,
                //     getStrokeWidth: 5, //d => d.flow,
                //     getSourcePosition: d => [d.from_lat, d.from_lon],
                //     getTargetPosition: d => [d.to_lat, d.to_lon],
                //     getColor: [144, 140, 0],
                //     // onHover: ({object}) => setTooltip(`${object.from.name} to ${object.to.name}`)
                // });
                const features = data.map((d) => {
                    return(
                        {"type": "Feature",
                        "properties": {
                            "flow": +(d.flow),
                            "exposure": d.exposure,
                            "color": [Math.sqrt(d.flow), 140, 0]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [d.from_lon,d.from_lat], // from
                                [d.to_lon, d.to_lat], // to
                                ]
                            }
                        }
                    )
                }) 
                const geojson = {
                    "type": "FeatureCollection",
                    "name": "crashes",
                    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
                    "features": features
                }
                console.log(geojson);
                
                const alayer = {
                    "id": "exposure",
                    "interactive": true,
                    "type": "line",
                    "source": {
                        "type": "geojson",
                        "data": geojson
                    },
                    "layout": {
                        "line-join": "round",
                        "line-cap": "round"
                    },
                    "paint": {
                        "line-color": ['get', 'color'],
                        "line-width": ['get', 'flow']
                    }
                };
                map.addControl(new NavigationControl(), "bottom-right")
                map.addLayer(alayer);
                map.on('click', (e) => {
                    console.log(e);
                    
                    const coordinates = e.features[0].geometry.coordinate;
                    const description = e.features[0].properties.exosure;            
                    new Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });
            } else {
                //network error?
            }
        })
    }

    _onViewportChange(viewport) {
        // console.log(viewport);
        this.setState({ viewport })
    }

    render() {
        // console.log("render");
        return (
            <AutoSizer>
                {
                    ({ height, width }) =>
                        <MapGL
                            mapStyle="mapbox://styles/mapbox/dark-v9"                            onViewportChange={this._onViewportChange.bind(this)}
                            height={height}
                            width={width}
                            {...this.state.viewport}
                            mapboxApiAccessToken={"pk.eyJ1IjoibGF5aWsiLCJhIjoiY2ppNXFndGNzMGtpaDNxbXNqd2Rqc3BqZyJ9.355os6YWhIKPVaSiX01QIA"}
                            ref={(reactMap) => { this.reactMap = reactMap; }} >
                            {/* <DeckGL
                                {...this.stateviewport}
                                onViewportChange={this._onViewportChange.bind(this)} 
                                layers={this.state.layers}
                                /> */}
                        </MapGL>
                }
            </AutoSizer>
        );
    }
}

