'use-strict'
import React, { Component } from 'react';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import Control from 'react-leaflet-control';

import history from './history'
import Constants from './Constants';

import TilesDropDown from './components/TilesDropDown';
import RBDropDown from './components/RBDropDown';
import LayersLegend from './components/LayersLegend';

import { fetchCentralityData, getParamsFromSearch } from './Helpers';

import './App.css';

let _position = [5.6037, -0.1870]
const url = (process.env.NODE_ENV === 'development' ? Constants.DEV_URL : Constants.PRD_URL)
    + '/api/centrality/'

/**
 * A demonstration component for various transportation analyses.
 * 
 * Able to show centrality network from server endpoints in GeoJSON
 * Able to present map tiles pregenerated as z/x/y. These were generated
 * from TIFF files which were generated using R code written for this purpose. 
 * 
 */
    export default class Roads extends Component {
    constructor(props) {
        super(props);

        // get params
        // remove the leading ? see qs docs
        // https://github.com/sindresorhus/query-string
        const zoomAndCenter = getParamsFromSearch(props.location.search);

        //possible centrality params

        // console.log(lat, lng)
        this.state = {
            ...zoomAndCenter,
            sourceURL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            geodata: "loading",
            currentAPI_URL: url,
            layers: [] //use good old sequences to refer to them
        }
        this._getDropdown = this._getDropdown.bind(this);
        this._fetchData = this._fetchData.bind(this);
        this._getStyle = this._getStyle.bind(this);
        this._renderGeoJSON = this._renderGeoJSON.bind(this);
    }

    _updateURL(e) {
        const center = e.target.getCenter();
        const zoom = e.target.getZoom();
        //could have been updated by QFactor so use history.location.pathname
        history.push(history.location.pathname +
            `?lat=${center.lat.toFixed(3)}&lng=${center.lng.toFixed(3)}&zoom=${zoom}`)
    }

    componentDidMount() {
        // const map = this.refs.map.leafletElement;
        const path = this.props.location.pathname.split("/") //starts with / so [0] will be emppty
        this._fetchData(path);
    }

    /**
     * give it a split path
     * @param {array} path 
     */
    _fetchData(path) {
        //may need to update mapview
        const newView = getParamsFromSearch(history.location.search);
        if (newView) {
            this.setState({
                ...newView
            })
        }
        fetchCentralityData(path, url, (results, error) => {
            if(!error) {
                this.setState({
                    ...results, //sets current geodata, too
                    layers: [...this.state.layers, { geodata: results.geodata, visible: true }] //immutable
                })
            } else {
                this.setState({error})
            }
        })
    }

    _getStyle(params, color) {
        // console.log(color)
        let style = {
            // stroke: true,
            color: color ? color : "green",
            // opacity: 0.6,
            // weight: 2,
            // dashArray: "1",
            // fill: true,
            // fillColor: "#2e5696",
            // fillOpacity: 0.3,
        }
        // switch (params.roadType) {
        //     case "pedestrian":
        //     style.color = "black"
        //     case "residential":
        //     style.color = "red"
        //     case "primary":
        //     style.color = "green"
        //     case "secondary":
        //     style.color = "lightblue"
        // }
        style.weight = params.weight;
        return (style)
    }

    _roadQuietnessOrTypeSelected(event, qFactor = true) {
        const { qFactorTitle, roadSelected } = this.state;
        if ((qFactor && event === qFactorTitle) ||
            (!qFactor && event === roadSelected)) {
            return; //same values selected
        }
        // console.log(event, qFactorTitle, roadSelected, qFactor)
        // update the url if value chosen, else prompt
        // use history as it may have been updated.
        let newPath = "/roads/" + (!qFactor ? event.toLowerCase() : event) + "/"; // roads/event
        if (!qFactor && qFactorTitle) {
            newPath += qFactorTitle
        }
        if (qFactor && roadSelected) {
            newPath += roadSelected.toLowerCase()
        }

        if (qFactor && event === "other") {

        } else {
            history.push(newPath + history.location.search); //plus any possible search
        }
        // then fetch again
        this.setState({
            qFactorTitle: qFactor ? event : qFactorTitle, // only if new value
            roadSelected: !qFactor ? event : roadSelected // only if new value
        }); //update here and wait for fetch        
        this._fetchData(newPath.split("/"))
    }

    _getDropdown() {
        const { qFactorTitle, roadSelected } = this.state;

        return (
            <div
                style={{ float: 'right', display: 'flex' }}>
                <RBDropDown
                    title={qFactorTitle ? qFactorTitle : "QFactor(1)"}
                    size="dropdown-size-medium"
                    onSelectCallback={this._roadQuietnessOrTypeSelected.bind(this)}
                    menuitems={[
                        { 0.1: 0.1 },
                        { 0.2: 0.2 },
                        { 0.5: 0.5 },
                        { "other": "Enter value" },
                        { "": "" },
                        { 1: "Reset" }
                    ]}>

                </RBDropDown>
                <TilesDropDown returnSourceURL={(newURL) => this.setState({ sourceURL: newURL })} />
                <RBDropDown
                    //see plumber.R
                    // centrality <- function(qfactor = 1, roadType = "residential") {
                    title={roadSelected ? roadSelected : "RoadType(resi)"}
                    size="dropdown-size-medium"
                    onSelectCallback={(road) => {
                        this._roadQuietnessOrTypeSelected(road, false);
                    }}
                    menuitems={Constants.roadTypes}>
                </RBDropDown>
            </div>
        )
    }

    _renderGeoJSON() {
        const { layers } = this.state;
        return (
            layers.map((layer, j) => {
                if (layer.visible) {
                    return (
                        <div key={j}>
                        {layer.geodata.features.map((feature, i) => {
                            return (
                                <GeoJSON
                                    key={i}
                                    style={
                                        this._getStyle({
                                            roadType: feature.properties.highway,
                                            weight: feature.properties.lwd
                                        }, Constants.COLORS_QUAY[j])
                                    }
                                    data={feature}
                                />
                            )
                        })}
                        </div>
                    )
                } else {
                    return(null)
                }
            })
        )
    }

    render() {
        const { geodata, position, zoom, sourceURL, layers } = this.state;
        // console.log(this.props.location.search)
        // console.log(geodata)
        _position = position ? position : _position // default
        // console.log(_position);

        const maplayers = layers.length > 0 && this._renderGeoJSON()
        // console.log(maplayers.length);

        let _zoom = zoom ? zoom : 13 //default
        return (
            <Map
                ref='map'
                // key={geodata.features[0].properties.lwd} //not a very strong key but should do.
                center={_position}
                zoom={_zoom}
                onzoomend={this._updateURL.bind(this)}
                onmoveend={this._updateURL.bind(this)}>
                <Control position="topright">
                    <div>
                        <p style={{ backgroundColor: 'white' }}>
                            JSON from '{url}'?: {
                                geodata !== "loading" ? "yes" : "loading..."}
                        </p>
                    </div>
                </Control>
                <Control position="topright">
                    {this._getDropdown()}
                </Control>
                <TileLayer
                    url={sourceURL}
                    attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                />
                {/* TODO: do we need a marker? */}
                {/* <Marker position={_position}>
                    <Popup>
                        <span>Center of this view {_position}</span>
                    </Popup>
                </Marker> */}

                {
                    maplayers
                }
                {/* <GeoJSON 
                    style= {{
                        color: "red"
                    }}

                    key={currentAPI_URL} 
                    data={geodata} 
                /> */}
                {layers.length > 0 &&
                    <LayersLegend
                        removeLayer={(index) => {
                            // console.log("callback", index);
                            const editedLayers = layers.slice(0, index).concat(layers.slice(index + 1));
                            this.setState({ layers: editedLayers })
                        }}
                        toggleLayer={(index) => {
                            const newLayers = layers;
                            newLayers[index].visible = !layers[index].visible;
                            this.setState({layers: newLayers})
                        }}
                        layers={layers.length} />}
            </Map>
        );
    }
}

