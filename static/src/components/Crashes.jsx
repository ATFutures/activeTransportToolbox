'use-strict';

import React from 'react';
import { GeoJSON } from 'react-leaflet';

import Constants from '../Constants';

import data from '../crashes.json'

// in future we can serve it or serve dynamic for now we just load it if not too heavy
// const url = (process.env.NODE_ENV === 'development' ? Constants.DEV_URL : Constants.PRD_URL)
//     + '/api/crashes/' 

export default class Crashes extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: data
        }
    }

    // componentDidMount() {
    //     fetch(fullURL)
    //         .then((response) => {
    //             if (response.status !== 200) {
    //                 console.log('Looks like there was a problem. Status Code: ' +
    //                     response.status);
    //                 return;
    //             }
    //             // Examine the text in the response
    //             response.json()
    //                 .then((data) => {
    //                     //rouch search results will do.
    //                     if (data.results.length === 0 || response.status === 'ZERO_RESULTS') {
    //                         this.setState({ error: response.status })
    //                     } else {
    //                         this.setState({ data })
    //                     }
    //                 });
    //         })
    //         .catch((err) => {
    //             console.log('Fetch Error :-S', err);
    //         });
    // }

    render() {
        return (
            this.state.data.features.map((feature, i) => {
                return (
                    <GeoJSON
                        key={i}
                        // style={
                        //     this._getStyle({
                        //         roadType: feature.properties.highway,
                        //         weight: feature.properties.lwd
                        //     }, Constants.COLORS_QUAY[j])
                        // }
                        data={feature}
                    />
                )
            })
        )
    }
}