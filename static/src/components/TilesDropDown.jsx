'use-strict';

import React from 'react';
import { MenuItem, DropdownButton, ButtonToolbar } from 'react-bootstrap';

const tilesTitle = "Tiles Layer";

export default class TilesDropDown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: tilesTitle,
        }
    }
    //requires prop returnSourceURL()
    render () {
        const { title } = this.state;
        return(
            <ButtonToolbar>
                <DropdownButton title={title}
                id="dropdown-size-medium"
                onSelect={(event) => {
                    //update title
                    this.setState({title: event.title})
                    if(this.props.returnSourceURL) {
                        this.props.returnSourceURL(event.url)
                    }
                    //die gracefully
                }}>
                    <MenuItem eventKey={{
                        url: "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png",
                        title: "Water"
                    }}>Water</MenuItem>
                    <MenuItem eventKey={{
                        url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
                        title: "BW"
                    }}>BW</MenuItem>
                    <MenuItem eventKey={{
                        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
                        title: "OSM Topo"
                    }}> OSM Topo </MenuItem>
                    <MenuItem divider />
                    <MenuItem eventKey={{
                        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                        title: tilesTitle
                    }}>Reset</MenuItem>

                </DropdownButton>
            </ButtonToolbar>
            )
    }
}