import React, { Component } from 'react';
import MapGL from 'react-map-gl';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
// import DeckGL from 'deck.gl';
import * as turf from '@turf/turf'

import { fetchData } from './Helpers';
import Constants from './Constants';

import './App.css';

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
            latitude: 44.9778,
            longitude: -93.2650,
            zoom: 13
        }
    };
    componentDidMount() {
        const map = this.reactMap.getMap();
        fetchData(url + "/api/minn", (data, error) => {
            if(!error) {
                console.log(data);
                const bbox = turf.bbox(data)
                const alayer = {
                    "id": "route",
                    "type": "line",
                    "source": {
                        "type": "geojson",
                        "data": data
                    },
                    "layout": {
                        "line-join": "round",
                        "line-cap": "round"
                    },
                    "paint": {
                        "line-color": "#00f",
                        "line-width": 1
                    }
                };
                map.addLayer(alayer);
                map.fitBounds(bbox, {padding:100})
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
                            onViewportChange={this._onViewportChange.bind(this)}
                            height={height}
                            width={width}
                            {...this.state.viewport}
                            mapboxApiAccessToken={"pk.eyJ1IjoibGF5aWsiLCJhIjoiY2ppNXFndGNzMGtpaDNxbXNqd2Rqc3BqZyJ9.355os6YWhIKPVaSiX01QIA"}
                            ref={(reactMap) => { this.reactMap = reactMap; }} >
                            {/* <DeckGL
                                {...this.stateviewport}
                                onViewportChange={this._onViewportChange.bind(this)} /> */}
                        </MapGL>
                }
            </AutoSizer>
        );
    }
}

