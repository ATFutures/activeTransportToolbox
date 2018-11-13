'use-strict'

import React, { Component } from 'react';
import Control from 'react-leaflet-control';
import { Checkbox, FormGroup } from 'react-bootstrap';

import RBDropDown from './RBDropDown';
import { cities } from '../Constants';

const layersFullList = ["From activity", "From residential", "To activity", "To residential"];

export default class ATTSidebar extends Component {  // note we're extending MapControl from react-leaflet, not Component from react

    constructor(props) {
        super(props);
        this.state = {
            crashes: false,
            showRegion: false,
            styles: props.styles,
            display: props.visible ? props.visible : "none",
            centrality: false,
            flows: layersFullList, 
        }
        this._content = this._content.bind(this);
        this._showSearchBar = this._showSearchBar.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        // console.log(props.selectedValues);
        
        if (props.visible && props.visible !== state.visible) {            
            return { 
                display: props.visible,
                ...props.selectedValues
             }
        }
        if(props.hasOwnProperty('layersDrawn') && typeof(props.layersDrawn) === 'object') {
            // console.log(props.layersDrawn);
            //adjust the list
            let flowsRemaining = layersFullList;
            props.layersDrawn.forEach((fromTo) => {
                //bus_residential
                const readable_fromTo = fromTo.startsWith("bus_") ? fromTo.replace("bus_", "To ") : "From " + fromTo.replace("_bus", "")
                const index = flowsRemaining.indexOf(readable_fromTo);                
                if (index !== -1) {
                    flowsRemaining = flowsRemaining.slice(0, index).concat(flowsRemaining.slice(index + 1));
                }
            })
            return {
                flows: flowsRemaining,
                ...props.selectedValues
            }
        }
        return null
    }

    _content() {
        const { showRegion, centrality, crashes, city, flows } = this.state;
        // console.log(flows);
        
        return (
            <div style={{
                minWidth: '200px'
            }}>
                <FormGroup>
                    <Checkbox
                        onChange={() => {
                            const { toggleCentrality } = this.props;
                            this.setState({ centrality: !centrality })
                            if (toggleCentrality && typeof(toggleCentrality) === 'function') {
                                toggleCentrality(!centrality) //starts with false
                            }
                        }}
                    >Centrality (zoom 9 to 14)</Checkbox>
                    <Checkbox
                        checked={crashes}
                        onChange={() => {
                            const { toggleCrashes } = this.props;
                            this.setState({ crashes: !crashes })
                            if (toggleCrashes && typeof(toggleCrashes) === 'function') {
                                toggleCrashes(!crashes) //starts with false
                            }
                        }}
                    >Crash data (simulated)</Checkbox>
                    <Checkbox
                        checked={showRegion}
                        onChange={() => {
                            const { regionToggled } = this.props;
                            this.setState({ showRegion: !showRegion })
                            if (regionToggled && typeof(regionToggled) === 'function') {
                                regionToggled(!showRegion) //starts with false
                            }
                        }}
                    >Region chosen for this research</Checkbox>
                    {/* <Checkbox inline>2</Checkbox>{' '} */}
                    {/* <Checkbox inline>3</Checkbox> */}
                </FormGroup>
                <RBDropDown
                    title={ city ? city : "City"}
                    size="dropdown-size-medium"
                    onSelectCallback={(event) => {
                        const { citySelected } = this.props;
                        if(citySelected && typeof(citySelected)) {
                            citySelected(event)
                        }
                    }}
                    menuitems={cities}>
                </RBDropDown>
                <hr />
                <RBDropDown
                    title="Transport Mode (Bus)"
                    size="dropdown-size-medium"
                    onSelectCallback={(event) => {
                        console.log(event)
                        if(event !== "Bus") alert("Only Bus data exists for now")
                    }}
                    menuitems={[
                        "Bus", "Walking", "Cycling", "Other"
                    ]}>
                </RBDropDown>
                <hr />
                <RBDropDown
                    title="From/To (from home)"
                    size="dropdown-size-medium"
                    onSelectCallback={(event) => {
                        let eventLower = event.toLowerCase();                        
                        const { fromToSelected } = this.props;
                        if(eventLower.startsWith("from")) {
                            eventLower = eventLower.replace("from ", "");
                            eventLower = eventLower + "_"; //from x to bus
                        } else {
                            eventLower = eventLower.replace("to ", "")
                            eventLower = "_" + eventLower;// from bus to x 
                        }
                        // console.log(eventLower)
                        if(fromToSelected && typeof(fromToSelected) === 'function') {
                            //remove from list
                            const index = flows.indexOf(event);
                            const editedFlows = flows.slice(0, index).concat(flows.slice(index + 1));
                            this.setState({flows: editedFlows}); //update remaining flows
                            fromToSelected(eventLower); // _residential, activtiy_
                        }
                    }}
                    menuitems={flows}>
                </RBDropDown>
                <hr />
                <RBDropDown
                    title="Scenario"
                    size="dropdown-size-medium"
                    onSelectCallback={(event) => {
                        console.log(event)
                    }}
                    menuitems={[
                        "Current", "Light infra",
                        "Medium infra", "Big investment"
                    ]}>
                </RBDropDown>
                <hr />
                <RBDropDown
                    title="Exposure"
                    size="dropdown-size-medium"
                    onSelectCallback={(event) => {
                        console.log(event)
                    }}
                    menuitems={[
                        "Health", "Pollution",
                        "Crash risk"
                    ]}>
                </RBDropDown>
            </div>
        )
    }

    _handleChange(e) {
        e.preventDefault();
        // console.log(e.target.value);
        this.setState({ search: e.target.value })
    }

    _handleKeyPress(e) {
        // console.log(e.key);
        if (e.key === 'Enter') {
            const { searchCallback } = this.props;
            if (typeof (searchCallback) === 'function') {
                searchCallback(this.state.search)
            }
        }
    }

    /**
     * Multiple use do not undo refactoring.
     * 
     */
    _showSearchBar() {
        return (
            <input
                autoFocus
                onChange={this._handleChange.bind(this)}
                onKeyPress={this._handleKeyPress.bind(this)}
                className="attsearchinput" type='text' placeholder='Search...' />
        )
    }

    render() {
        const { display } = this.state;
        const isVisible = display === "block";
        return (
            <Control position="topright">
                <div
                    className="attsidebar">
                    {
                        !isVisible &&
                        <div className="menuAndInput">
                            <button
                                style={{
                                    marginRight: '5px',
                                    display: display === "none" ? "block" : "none"
                                }}
                                onClick={(event) => {
                                    const newState = display === "none" ? "block" : "none"
                                    this.setState({
                                        display: newState
                                    })
                                    //safely check
                                    if (this.props.visibilityToggled && typeof (this.props.visibilityToggled === 'function')) {
                                        this.props.visibilityToggled(newState);
                                    }
                                }}
                            >&#9776;</button>
                            {this._showSearchBar()}
                        </div>
                    }

                    <div
                        id="right-sidebar"
                        style={{
                            borderRadius: '7px',
                            transition: 'all 0.9s',
                            WebkitTransition: 'all 3s',
                            backgroundColor: "white",
                            padding: '10px',
                            display: this.state.display
                        }}>
                        <div
                            style={{ padding: 0 }}
                            className="menuAndInput">
                            <button
                                style={{ marginRight: '5px' }}
                                onClick={(event) => {
                                    this.setState({
                                        display: this.state.display === "none" ? "block" : "none"
                                    })
                                }}
                            >X</button> {this._showSearchBar()}
                        </div>
                        <hr />
                        {this._content()}
                    </div>
                </div>
            </Control>
        )
    }
}