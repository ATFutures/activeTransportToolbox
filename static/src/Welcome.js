/**
 * ATFutures, LIDA/ITS, University of Leeds
 * Entry component for ATT
 */
import React, { Component } from 'react';
import { Map, Marker, Popup, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
// see this https://github.com/Leaflet/Leaflet.markercluster#using-the-pl
import 'leaflet.markercluster'

import history from './history'
import ATTSidebar from './components/ATTSidebar';
import TilesBasemap from './components/TilesBasemap';
import LayersLegend from './components/LayersLegend';

import {
    convertRange,
    fetchData, generateCrashLayer, getCentroid,
    getResultsFromGoogleMaps, getParamsFromSearch
} from './Helpers';

import Constants from './Constants';

import './App.css';

import regionGeoJSON from './region.json'

const url = (process.env.NODE_ENV === 'development' ? Constants.DEV_URL : Constants.PRD_URL);
const colorSet = ["darkgreen", 'black', 'red', 'blue'];

/**
 * Main component to show at / of the webapp.
 * 
 * The component shows how transport data can be consumed
 * by react from our 'plumber' powered API end points.
 * 
 * Able to show various flows (GeoJSON data) for the two
 * cities in this research. Accra and Kathmandu. The component
 * provides an unobstructive side panel to:
 * 1. switch between the two cities
 * 2. show layers of transport flow
 * 3. show some smaple crash data for "accra"
 * 
 * Also includes leaflet control buttons to
 * 1. toggle/remove the flow layers
 * 2. change base map tiles.
 * 
 * 
 */
export default class Welcome extends Component {
    constructor(props) {
        super(props);
        const zoomAndCenter = getParamsFromSearch(props.location.search);
        this.state = {
            flows: [],
            city: "Accra",
            flowDirection: "residential_bus",
            flowDirections: [],
            currentAggregate: {},
            theFlow: null,
            ...zoomAndCenter,
            centrality: L.tileLayer(url + '/tiles/{z}/{x}/{y}.png',
                { tms: true, zIndex: 5, opacity: 0.7, attribution: "" }),
            loading: true,
            baseURL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
        }
        this._fetchData = this._fetchData.bind(this);
        this._addCrashData = this._addCrashData.bind(this);
        this._generateFlowFor = this._generateFlowFor.bind(this);
        this._updateStatForLayer = this._updateStatForLayer.bind(this);
    }

    componentDidMount() {
        const map = this.refs.map.leafletElement
        this.setState({ map })
        this._fetchData("Accra", "residential_bus");
    }

    _addCrashData(map) {
        generateCrashLayer(map, ({ crashMarkers, legend }) => 
        this.setState({ crashMarkers, legend }));
        
    }

    _fetchData(newCity, fromTo) {
        const fullURL = url + "/api/flows/" + newCity + "/" + (fromTo ? fromTo : "");
        console.log("fetching..... " + fullURL);
        //spinner
        !this.state.loading && this.setState({ loading: true })
        //see plumber.R flowType = 'residential_bus'
        fetchData(fullURL, (data, error) => {
            if (!error) {
                // console.log(data.features.length)
                //find max first 
                this._updateStatForLayer(data, newCity, fromTo);
            } else {
                this.setState({
                    loading: false,
                    error: error,
                });
                return; //do not set undefined states
            }
        });
    }

    _updateStatForLayer(data, newCity, fromTo, add = true, index) {
        const { flows } = this.state
        let visibleCount = 0;
        flows.forEach((layer) => {
            if (layer.visible)++visibleCount; //before operand
        })
        //not unhiding 
        if (!add && visibleCount === 1 && flows[index].visible) {
            const editedFlows = flows;//hide layer
            editedFlows[index].visible = !flows[index].visible;
            this.setState({
                flows: add === null ? editedFlows : [],
                //we keep the flowDirections to toggle
                flowDirections: add === null ? this.state.flowDirections : [],
                currentAggregate: {},
                theFlow: null,
            });
            return; // last layer already removed?
        }
        let { newFlow, fflow, newFlowDirections, newCurrentAggregate } =
            this._generateFlowFor(data, newCity, fromTo, add, index);
        this.setState({
            theFlow: newFlow,
            city: newCity,
            center: Constants[newCity + "_CENTER"],
            flows: fflow,
            loading: false,
            flowDirection: fromTo,
            flowDirections: newFlowDirections,
            currentAggregate: newCurrentAggregate
        });
    }

    /**
     * TODO: add description
     * 
     * @param {object} data 
     * @param {string} newCity 
     * @param {string} fromTo 
     * @param {boolean} add 
     * @param {string|number} index 
     */
    _generateFlowFor(data, newCity, fromTo, add = true, index) {
        const { flows, city, flowDirections } = this.state;
        let layerToDraw = data;
        // const unhide = false;
        let newCurrentAggregate = {};
        let fflow = flows;
        let newFlow;
        let newFlowDirections = flowDirections; //start with empty

        if (!add) {
            layerToDraw = flows[0].layer; // this is random!
            if (!flows[index].visible) {
                // unhide === true;
                layerToDraw = flows[index].layer;
            }
        }
        if (city !== newCity) {
            //reset
            fflow = [];
            newFlowDirections = [];
            newCurrentAggregate = {};
        }

        let maxFlow = 0;
        layerToDraw.features.map((feature) => {
            let aFlow = feature.properties.flow;
            if (aFlow > maxFlow)
                maxFlow = aFlow;
            return null;// suppress warning
        });
        const ranges = {oldMax: maxFlow, oldMin: 0,
            newMax: 100, newMin: 0}
        newFlow =
            layerToDraw.features.map((feature, i) => {
                // const way_id = feature.properties.way_id;
                let aggregateFlow = feature.properties.flow;
                const weight = (aggregateFlow / maxFlow) * 10;
                // if (weight > 0.0001) console.log("bbbg");

                const key = i + "_" + newCity + "_" + (!fromTo ? newFlowDirections[index] : fromTo)
                    + "_" + (add === null ? flows[index].visible ? "v" : "h" : add === false ? "d" : "n")
                const hue = add ? fflow.length * 120 : index * 120;
                var highlightStyle = {
                    color: '#2262CC', 
                    fillOpacity: 0.65,
                    fillColor: '#2262CC'
                };
                const defaultStyle = {
                    weight: parseFloat(weight.toFixed(4)) + 1,
                    //hsl support https://caniuse.com/#feat=css3-colors
                    // color: `hsl(${hue > 360 ? hue/360 : hue},${convertRange(weight, ranges)}%,50%)`
                    color: `hsl(${hue > 360 ? hue/360 : hue},${weight*10 > 100 ? 100 : weight*10}%,${50}%)`
                }
                return (
                    <GeoJSON
                        style={defaultStyle}
                        key={key}
                        data={feature} onEachFeature={(feature, layer) => {
                            feature.properties && feature.properties.flow &&
                                layer.bindPopup(
                                    "Flow: " + fromTo + //todo: which?  
                                        "<br/>Density: " + parseFloat(weight.toFixed(4))
                                );
                                layer.on("mouseover", function (e) {
                                    // Change the style to the highlighted version
                                    layer.setStyle(highlightStyle);
                                    layer.openPopup();
                                })
                                layer.on("mouseout", function (e) {
                                    // Start by reverting the style back
                                    layer.setStyle(defaultStyle);
                                    layer.closePopup();
                                })
                        }} />
                );
            });
        if (add) {
            fflow = [...fflow, {
                layer: data,
                visible: true,
            }];
        } else {
            //it could be a toggle
            if (add === null) {
                //toggle layer
                const editedFlows = flows;
                editedFlows[index].visible = !flows[index].visible;
                fflow = editedFlows;
            } else {
                //remove layer & directions
                fflow = flows.slice(0, index).concat(flows.slice(index + 1));;
                newFlowDirections = flowDirections.slice(0, index).concat(flowDirections.slice(index + 1));
            }
        }
        if (fromTo) {
            newFlowDirections = [...newFlowDirections, fromTo];
        }
        return { newFlow, fflow, newFlowDirections, newCurrentAggregate };
    }

    _updateURL(e) {
        const center = e.target.getCenter();
        const zoom = e.target.getZoom();
        history.push(`/?lat=${center.lat.toFixed(3)}&lng=${center.lng.toFixed(3)}&zoom=${zoom}`)
    }

    render() {
        let centroid = getCentroid(regionGeoJSON.features[0].geometry.coordinates[0]);
        const { loading, zoom, showRegion, theFlow, flows, center, city, flowDirections,
            centrality, map, crashMarkers, legend } = this.state;
        let _zoom = zoom ? zoom : 13 //default
        // console.log(theFlow && theFlow.length);
        
        return (
            <Map
                drawControl={true}
                preferCanvas={true}
                zoom={_zoom}
                maxZoom={18}
                ref='map'
                center={center ? center : Constants[city + "_CENTER"]}
                onzoomend={this._updateURL.bind(this)}
                onmoveend={this._updateURL.bind(this)}
            >
                <div className="loader" style={{ zIndex: loading ? 999 : 0 }} />
                {
                    this.state.baseURL.includes("google") ?
                        <TileLayer
                            key={this.state.baseURL}
                            url={this.state.baseURL}
                            attribution={this.state.attribution}
                            maxZoom={this.state.maxZoom}
                            subdomains={this.state.subdomains}
                        /> :
                        <TileLayer
                            url={this.state.baseURL}
                            attribution={this.state.attribution}
                        />

                }
                <TilesBasemap
                    returnSourceURL={(base) => this.setState({
                        baseURL: base.url,
                        attribution: base.attribution,
                        maxZoom: base.maxZoom,
                        subdomains: base.subdomains
                    })}
                />
                <ATTSidebar
                    styles={{ backgroundColor: 'black' }}
                    searchCallback={(search) => {
                        getResultsFromGoogleMaps(search, (result) => {
                            console.log(result)
                            //if no results
                            if (typeof (result.lat) === 'number' &&
                                typeof (result.lng) === 'number') {
                                history.push(`/?lat=${result.lat.toFixed(3)}&lng=${result.lng.toFixed(3)}&zoom=${zoom}`)

                                this.setState({
                                    center: [result.lat, result.lng]
                                })
                            }//die happily
                        })
                    }}
                    toggleCrashes={(toggle) => {
                        if (!toggle) {
                            map.removeLayer(crashMarkers);
                            legend.remove();
                        } else {
                            if (!crashMarkers) {
                                this._addCrashData(map)
                            } else {
                                map.addLayer(crashMarkers);
                                legend.addTo(map);
                            }
                            map.setView(Constants["Accra_CENTER"], 13)
                        }
                    }}
                    toggleCentrality={(toggle) => {
                        if (toggle) {
                            if (map.getZoom() !== 13) {
                                alert("Data only available in zoom 13.")
                            }
                            centrality.addTo(map);
                        } else {
                            centrality.removeFrom(map);
                        }
                    }}
                    selectedValues={{ city: city }} // add all other fields
                    citySelected={(newCity) => {
                        const { flowDirection } = this.state;
                        //flowDirection is defined by default so if city does not change flowDirection has not
                        city !== newCity ?
                            this._fetchData(newCity, flowDirection) : map.panTo(Constants[newCity + "_CENTER"])
                    }}
                    layersDrawn={flowDirections}
                    fromToSelected={(fromTo) => {
                        //if starts with _ its from bus (bus + _fromTo)
                        //it will set the state.
                        const newFlow = fromTo.startsWith("_") ? "bus" + fromTo : fromTo + "bus";
                        //remove current
                        !flowDirections.includes(newFlow) && this._fetchData(city, newFlow)
                    }}
                    regionToggled={(toggle) => this.setState({ showRegion: toggle })}
                    addMarker={(marker) => {
                        console.log(marker);

                    }}
                />
                {
                    showRegion && centroid && <Marker position={centroid}>
                        <Popup>
                            <span>Center of region chosen.<br /> A location within Accra.</span>
                        </Popup>
                    </Marker>
                }
                {/* <Crashes /> */}
                {showRegion && <GeoJSON data={regionGeoJSON} />}
                {/* <GeoJSON data={data} /> */}
                {theFlow}
                {flows.length > 0 &&
                    <LayersLegend
                        removeLayer={(index) => {
                            this._updateStatForLayer(flows[index].layer, city, null, false, index);
                        }}
                        toggleLayer={(index) => {
                            this._updateStatForLayer(flows[index].layer, city, null, null, index);
                        }}
                        colorSet={colorSet}
                        layers={flows.length}
                        names={flowDirections} />}
            </Map>
        );
    }
}

