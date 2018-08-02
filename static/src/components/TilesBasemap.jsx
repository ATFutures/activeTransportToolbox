'use-strict';

import React from 'react';
import Control from 'react-leaflet-control';
import { Radio, FormGroup } from 'react-bootstrap';

// Base layers
//  .. OpenStreetMap
const osm = {url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' };
//  .. CartoDB Positron
const cartodb = {url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>' };
//  .. OSM Toner
const toner = {url: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.' };
//  .. White background
const white = {url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVQYGe3BAQ0AAADCIPunfg43YAAAAAAAAAAA5wIhAAAB9aK9BAAAAABJRU5ErkJggg=="};

const googleSat = {
    url: 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', 
    attribution: 'Google Inc.', 
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']
}

const googleStreets = {
    url: 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', 
    attribution: 'Google Inc.', 
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']
}

const googleHybrid = {
    url: 'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', 
    attribution: 'Google Inc.', 
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']
}

const basemaps = { 
    "Google Streets": googleStreets,
    "Google Hybrid": googleHybrid,
    "Google Satellite": googleSat,
    "OpenStreetMap": osm, 
    "CartoDB Positron": cartodb, 
    "Stamen Toner": toner, 
    "Without background": white }

export default class TilesBasemap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOption: 'OpenStreetMap',
            layers: false,
        }
    }
    _handleChange(e) {
        // console.log(e.target.value)
        this.setState({ selectedOption: e.target.value })
        //tell parent
        if(this.props.returnSourceURL) {
            this.props.returnSourceURL(basemaps[e.target.value])
        }
        //die gracefully
    }

    render() {
        return (
            <Control position="bottomleft">
                <div > 
                    {
                        this.state.layers ?
                            <div 
                                onMouseLeave={() => this.setState({ layers: !this.state.layers })}
                                className="leaflet-control-layers-expanded">
                                <FormGroup>
                                    {
                                        Object.keys(basemaps).map((key) => {
                                            return (
                                                <Radio
                                                    checked={this.state.selectedOption === key}
                                                    value={key}
                                                    key={key}
                                                    onChange={this._handleChange.bind(this)}
                                                >{key}</Radio>
                                            )
                                        })
                                    }
                                </FormGroup>
                            </div>
                            :
                            <div
                                onMouseEnter={() => this.setState({ layers: !this.state.layers })}
                                className="leaflet-control-layers-toggle">
                            </div>
                    }
                </div>
            </Control>
        )
    }
}