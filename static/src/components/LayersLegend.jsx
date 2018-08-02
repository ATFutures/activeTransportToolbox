'use-strict';

import React from 'react';
import Control from 'react-leaflet-control';
import { Checkbox, FormGroup } from 'react-bootstrap';

export default class LayersLegend extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOption: 'OpenStreetMap',
            layers: props.layers && props.layers > 0 ? props.layers : 0, //carefully initialize
            names: props.names && props.names.length > 0 ? props.names : [],
            shown: false,
        }
    }
    /**
     * This can be called instead of constructor too.
     * @param {*} nextProps 
     * @param {*} prevState 
     */
    static getDerivedStateFromProps(props, state) {
        if (props.layers && props.layers > 0) { //is just a number
            if (props.names && props.names.length) {
                return {
                    layers: props.layers,
                    names: props.names
                }
            }
            return {
                layers: props.layers
            }
        }
        if (props.shown) {
            return { shown: props.shown }
        }
        return null
    }

    render() {
        const { shown, layers, names } = this.state;
        const { colorSet } = this.props;

        return (
            <Control position="bottomright">
                <div >
                    {
                        shown ?
                            <div
                                onMouseLeave={() => this.setState({ shown: !shown })}
                                className="leaflet-control-layers-expanded">
                                {
                                    layers > 0 ?
                                        <FormGroup>
                                            Hidden:
                                            {
                                                Array.from(Array(layers).keys()).map((key) => {
                                                    return (
                                                        <div
                                                            key={key}
                                                            style={{
                                                                color: colorSet && colorSet.length >= key && colorSet[key],
                                                                display: 'flex'
                                                            }}>
                                                            <Checkbox
                                                                style={{ flexGrow: 1 }}
                                                                value={key}
                                                                onChange={() => {
                                                                    const { toggleLayer } = this.props;
                                                                    // console.log(e.target.value)
                                                                    if (typeof (toggleLayer) === 'function') {
                                                                        toggleLayer(key)
                                                                    }
                                                                }}
                                                            >
                                                                {names.length > 0 ? `Layer: ${names[key]}` : `Layer #: ${key}`}
                                                            </Checkbox>
                                                            <i
                                                                value={key}
                                                                style={{
                                                                    alignSelf: 'center',
                                                                    padding: 10,
                                                                    fontSize: 14
                                                                }}
                                                                onClick={() => {
                                                                    // console.log(key);
                                                                    const { removeLayer } = this.props;
                                                                    if (typeof (removeLayer) === 'function') {
                                                                        removeLayer(key)
                                                                    }
                                                                }}
                                                                className="fa fa-trash"></i>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </FormGroup>
                                        :
                                        <p> No layers yet</p>
                                }
                            </div>
                            :
                            <div
                                onMouseEnter={() => this.setState({ shown: !shown })}
                                className="leaflet-control-layers-toggle">
                                <p style={{ textAlign: 'center' }}>{layers}</p>
                            </div>
                    }
                </div>
            </Control>
        )
    }
}