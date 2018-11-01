import Constants from './Constants';
import qs from 'qs'; // warning: importing it otherways would cause minificatino issue.
import L from 'leaflet';

const getResultsFromGoogleMaps = (string, callback) => {

    if (typeof (string) === 'string' && typeof (callback) === 'function') {
        let fullURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
            string
            + "&key=AIzaSyACi2bA77Mkk5f2_EEla5asgvp1KOpA2Hs";
        // console.log(fullURL);
        fetch(fullURL)
            .then((response) => {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }
                // Examine the text in the response
                response.json()
                    .then((data) => {
                        //rouch search results will do.
                        if (data.results.length === 0 || response.status === 'ZERO_RESULTS') {
                            callback(response.status);
                        } else {
                            callback(data.results[0].geometry.location)
                        }
                    });
            })
            .catch((err) => {
                console.log('Fetch Error :-S', err);
            });

    }
    //ignore
};
const separateAPIParams = (path) => {
    let qFactor = path[2] ? path[2] : null;
    let rType = path[3] ? path[3] : null;
    const p2InRoadTypes = path[2] && Constants.roadTypes.includes(path[2].charAt(0).toUpperCase() + path[2].slice(1)) ? true : false;
    if (!path[3]) {
        //which one is it
        if (p2InRoadTypes) {
            rType = path[2]; //its road type
            qFactor = null;
        } else {
            rType = null; //as it probably is
            qFactor = path[2];
        }
    } else {
        //again determine which is which
        if (p2InRoadTypes) {
            //reverse them
            rType = path[2];
            qFactor = path[3];
        }//no need for else, there is p3 and p2 is NOT in roadTypes
    }
    return (
        {
            qFactor, rType
        }
    )
}

const fetchData = (url, callback) => {
    fetch(url) // [0] => "", [1] => roads and [2] => qfactor
        .then((response) => response.json())
        .then((responseJson) => {
            try {                
                // const json = JSON.parse(responseJson);
                // console.log(json);
                callback(responseJson)
            } catch (e) {
                callback(null, e)
                // console.log("invalid json")
            }
        })
        .catch((error) => {
            console.error(error);
            callback(null, error)
        });

}

const fetchCentralityData = (path, url, callback) => {
    // console.log(path[2])
    if (path[1] !== "roads") {
        // wrong routing.
        callback({
            wrong_path_error: "Wrong path compenent msg: wrong path"
        })
        // TODO: we can then verify the allowed api vars
        return;
    }
    let fullURL = path[2] ? url + path[2] + "/" : url; //is there qFactor?
    fullURL = path[3] ? fullURL + path[3] + "/" : fullURL; // is there a roadtype?
    // console.log(fullURL)
    // console.log(this.props.location.pathname)
    fetch(fullURL) // [0] => "", [1] => roads and [2] => qfactor
        .then((response) => response.json())
        .then((responseJson) => {
            // console.log(JSON.parse(responseJson).features[0].properties.lwd)
            //could be either
            const typeAndfactor = separateAPIParams(path);
            try {
                callback({
                    // geodata: JSON.parse(responseJson),
                    geodata: responseJson,
                    qFactorTitle: typeAndfactor.qFactor, //could be either
                    roadSelected: typeAndfactor.rType
                })
                // console.log("valid")
            } catch (e) {
                callback(null, e)
                // console.log("invalid json")
            }
        })
        .catch((error) => {
            // console.error(error);
            callback(null, error)
        });
};
const getParamsFromSearch = (search) => {
    if (!search) return (null);

    const qsResult = qs.parse(search.replace("?", ""))
    // 3 decimal points is street level
    const lat = Number(qsResult.lat).toFixed(3);
    const lng = Number(qsResult.lng).toFixed(3);
    return ({
        position: !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null,
        zoom: Number(qs.parse(search).zoom),
    })
};
const generateLegend = (position = 'bottomright', 
    grades = [0, 10, 20, 50, 100, 200, 500, 1000], getColor = (d) => {
        return d > 1000 ? '#800026' :
            d > 500  ? '#BD0026' :
            d > 200  ? '#E31A1C' :
            d > 100  ? '#FC4E2A' :
            d > 50   ? '#FD8D3C' :
            d > 20   ? '#FEB24C' :
            d > 10   ? '#FED976' :
                        '#FFEDA0';
    }) => {
    const legend = L.control({position: position});
    legend.onAdd = (map) => {
        const div = L.DomUtil.create('div', 'info legend');
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
    };
    return legend;
}

//thanks to http://webdevzoom.com/get-center-of-polygon-triangle-and-area-using-javascript-and-php/
const getCentroid = (coords) => {
    let center = coords.reduce((x, y) => {
        return [x[0] + y[0] / coords.length, x[1] + y[1] / coords.length]
    }, [0, 0])
    center = [parseFloat(center[1].toFixed(3)), parseFloat(center[0].toFixed(3))]
    return center;
}

const generateCrashLayer = (map, callback) => {
    // import crashes from './crashes.json'
    var crashMarkers = L.markerClusterGroup();
    import("./crashes.json").then(crashes => {
        for (var i = 0; i < crashes.features.length; i++) {
            var a = crashes.features[i];
            const p = a.geometry.coordinates;
            var title = a.properties.severity;
            // console.log(p);
            var marker = L.marker([p[1], p[0]], { title: title });
            marker.bindPopup(title);
            crashMarkers.addLayer(marker);
        }
        map.addLayer(crashMarkers);
        const legend = generateLegend('bottomright', [0, 10, 100, 1000], (d) => {
            return d > 1000 ? '#800026' :
                d > 100 ? 'rgba(241, 128, 23, 0.6)' :
                    d > 10 ? 'rgba(240, 194, 12, 0.6)' :
                        'rgba(110, 204, 57, 0.6)';
        });
        legend.addTo(map);
        callback({ crashMarkers, legend });
    })
}
const convertRange = (oldValue = 2, values = {oldMax: 10, oldMin: 1,
    newMax: 1, newMin: 0}) => {
        // thanks to https://stackoverflow.com/a/929107/2332101
        // OldRange = (OldMax - OldMin)  
        // NewRange = (NewMax - NewMin)  
        // NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin
        return (((oldValue - values.oldMin) * (values.newMax - values.newMin)) / (values.oldMax - values.oldMin)) + values.newMin
}

export {
    fetchData,
    getCentroid,
    convertRange,
    generateLegend,
    separateAPIParams,
    generateCrashLayer,
    fetchCentralityData,
    getParamsFromSearch,
    getResultsFromGoogleMaps,
}