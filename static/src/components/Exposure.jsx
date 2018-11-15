import React, { Component } from 'react';
import MapGL, { Popup, NavigationControl } from 'react-map-gl';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
// import DeckGL, {LineLayer} from 'deck.gl';

import { convertRange, fetchData } from '../Helpers';
import Constants from '../Constants';

import '../App.css';

var d3Interpolate = require("d3-interpolate")

const url = (process.env.NODE_ENV === 'development' ? Constants.DEV_URL : Constants.PRD_URL);

/**
 * Experimental react-map.gl and deck.gl based React Component
 * to compare with Leaflet/canvas rendering of large GeoJSON data.
 * 
 */
export default class Deck extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewport: {
                // latitude: 5.6037,
                // longitude: -0.1870,
                latitude: 5.58,
                longitude: -0.2,
                zoom: 12,
                // pitch: 55
            },
            popup: null,
            layers: []
        };
    }
    componentDidMount() {
        const map = this.reactMap.getMap();
        fetchData(url + "/api/exposure", (data, error) => {
            if(!error) {
                // console.log(data);
                // console.log(data[1]['from_lat'], data[1]['from_lon'])
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
                let maxFlow = 0;
                let minFlow = 0;
                data.forEach((d) => {
                    let aFlow = d.flow;
                    if (aFlow > maxFlow)
                        maxFlow = aFlow;
                    if (aFlow < minFlow || minFlow === 0)
                        minFlow = aFlow;
                })
                const ranges = {oldMax: maxFlow, oldMin: minFlow, newMax: 1, newMin: 0}               
                const features = data.map((d) => {
                    let rgb = d3Interpolate.interpolateRgb("green", "red")(convertRange(d.flow, ranges))
                    rgb = rgb.replace("rgb(", "").replace(")", "").split(",")                    
                    return(
                        {"type": "Feature",
                        "properties": {
                            "flow": +(d.flow),
                            "exposure": d.exposure,
                            "color": [+(rgb[0]), +(rgb[1]), +(rgb[2])]
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
                // console.log(geojson);
                
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
                map.addLayer(alayer);
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
        const { popup } = this.state;        
        return (
            <AutoSizer>
                {
                    ({ height, width }) =>
                        <MapGL
                            // key={height+width} //causes layer to disappear
                            mapStyle="mapbox://styles/mapbox/dark-v9"                            onViewportChange={this._onViewportChange.bind(this)}
                            height={height}
                            width={width}
                            {...this.state.viewport}
                            mapboxApiAccessToken={"pk.eyJ1IjoibGF5aWsiLCJhIjoiY2ppNXFndGNzMGtpaDNxbXNqd2Rqc3BqZyJ9.355os6YWhIKPVaSiX01QIA"}
                            ref={(reactMap) => { this.reactMap = reactMap; }} 
                            onClick={(e) => {
                                // console.log(e);
                                // const features = e.features
                                // a feature of the layer in quetsion
                                if(e.features && e.features[0] && e.features[0].source === 'exposure') {
                                    const coordinates = e.features[0].geometry.coordinates;
                                    const f = e.features[0].properties.flow;
                                    const exp = e.features[0].properties.exposure;
                                    // console.log(coordinates, description);
                                    this.setState({
                                        popup: {
                                            latitude: coordinates[0][1],
                                            longitude: coordinates[0][0], 
                                            description: 
                                            <table style={{fontSize: '1.2em'}}><tbody>
                                                <tr><td>Exposure: &nbsp;</td><td>{exp}</td></tr><tr><td>Flow: &nbsp;</td><td>{f}</td></tr>
                                            </tbody></table>
                                        }
                                    })
                                }
                            }}
                            >
                            {
                                popup &&
                                <Popup
                                    key={popup.latitude + popup.longitude}
                                    latitude={popup.latitude} 
                                    longitude={popup.longitude} 
                                    onClose={() => this.setState({popup: null})} 
                                    anchor="top">
                                    <div>{popup.description}</div>
                                </Popup>
                            }                            
                            <div className="nav" style={{position: 'fixed', bottom: 0, right: 0}}>
                                <NavigationControl
                                onViewportChange={(viewport) => this.setState({viewport})}
                                />
                            </div>
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

