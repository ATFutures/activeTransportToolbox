import React from 'react';
import { Map, TileLayer, Circle, Tooltip } from 'react-leaflet';
import Control from 'react-leaflet-control';
import Papa from 'papaparse';
import { LineChart, CartesianGrid, Line, XAxis, YAxis, Label,
    Tooltip as ReTooltip } from 'recharts';

import Constants from '../Constants';

/**
 * Component to show US Embassy Kathmandu Air Quality Index (AQI).
 * The component uses https://github.com/recharts/recharts to generate linecharts.
 * HTML5 'range' input is used to navigate the data and updat the linechart.
 * 
 * Just to demonstrate the leaflet Circle/Tooltip also changes using the recharts 
 * API hover action and some hsl color is generated.
 * 
 * The component downloads CSV below which is AQI data for US Embassy in Kathmandu 
 * for Jan to end of June 2018. It parses the data to monthly arrays and recharts generates
 * the linechart from each month's data. 
 */
var _data = [
    { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];
const csvURL = "http://dosairnowdata.org/dos/historical/EmbassyKathmandu/2018/EmbassyKathmandu_PM2.5_2018_YTD.csv";
export default class Pollution extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            month: 1,
            color: "blue",
            center: [27.7382, 85.3364],
            data: "loading",
            viewport: {
                latitude: 5.6037,
                longitude: -0.1870,
                zoom: 13
            },
            sourceURL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        }
    }
    componentDidMount() {
        Papa.parse(csvURL, {
            download: true,
            complete: (results, file) => {
                // console.log("Parsing complete:", results, file);
                const keys = results.data[0];
                let jsonMonth = {};
                let m, y, mMax, maxDate, maxCategory;
                results.data.forEach((line, j) => {
                    if(j > 0 && parseFloat(line[8]) > 0) { //AQI needs to be above 0
                        const obj = {};
                        // {Site: ..,Parameter:PM2.5:..,...}
                        keys.forEach((key,i) => {
                            if(key === "AQI") {
                                obj[key] = parseFloat(line[i])
                                if(!mMax || mMax < obj[key] || m !== line[4]) {//new month then reset mMax
                                    mMax = obj[key];
                                    maxDate = line[2];
                                    maxCategory = line[9];
                                }
                            } else {
                                obj[key] = line[i]
                            }
                        })
                        /**
                         * 0:"Embassy Kathmandu"
                         * 1:"PM2.5 - Principal"
                         * 2:"2018-01-05 04:00 AM"
                         * 3:"2018"
                         * 4:"01" //month
                         * 5:"01" //day
                         * 6:"01" //hour
                         * ...
                         * ...
                         * 9:"Category"
                         * ...
                         * 13:"Valid"
                         */
                        m = line[4];
                        y = line[3];
                        
                        if(!jsonMonth[y] || !jsonMonth[y][m] || !jsonMonth[y][m].length > 0) {
                            if(!jsonMonth[y]) jsonMonth[y] = {};
                            jsonMonth[y][m] = [];
                        }
                        jsonMonth[y][m].push(obj);
                        jsonMonth[y][m]['max'] = mMax;
                        jsonMonth[y][m]['maxDate'] = maxDate;
                        jsonMonth[y][m]['maxCategory'] = maxCategory;
                    }
                })
                // console.log(jsonMonth);
                this.setState({
                    monthsData: jsonMonth
                })
            }
        })
    }

    _handleChange(event) {
        this.setState({
            month: event.target.value
        });
    }

    render() {
        const { monthsData, sourceURL, center, month, 
            hoverCategory, hoverAQI, hoverDate } = this.state;
        if(!monthsData) return(null)
        
        const monthName = Constants.MONTH_NAME[month-1];
        const theMonthData = monthsData['2018']['0' + month];
        let max = 0, maxDate = 0, maxCategory = 0;
        if(theMonthData && theMonthData.hasOwnProperty('max')){
            max = theMonthData.max;
            maxDate = theMonthData.maxDate;
            maxCategory = theMonthData.maxCategory;
        }        
        let h = 120;
        let val = max;
        if(hoverAQI) {
            val = hoverAQI;
        }
        val > 300 ? h = 360 :
        val > 200 ? h = h + val :
        val > 120 ? h = 0 :
        val > 100 ? h = h - val :
        h = h + val

        return (
            <Map
                ref='map'
                center={center}
                zoom={17}>
                <TileLayer
                    url={sourceURL}
                    attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                />
                <Circle
                    key={hoverDate ? hoverDate : maxDate}
                    center={center}
                    fillColor={"hsl("+ h + ",100%,50%)"}
                    radius={100} >
                    <Tooltip
                        key={hoverDate ? hoverDate : maxDate} 
                        direction='top' offset={[-8, -2]} opacity={1} permanent>
                        {
                            hoverAQI && hoverDate ? 
                            <span>({hoverCategory})AQI on {hoverDate}: {hoverAQI} </span>
                            :
                            <span>({maxCategory})Max AQI on {maxDate}: {max} </span>
                        }
                    </Tooltip>
                </Circle>
                <Control position="bottomleft" >
                    <div style={{ backgroundColor: "lightgrey" }}>
                        Shwoing AQI inded for {`${monthName} `} 2018. 
                        <input 
                            id="typeinp" 
                            type="range" 
                            min="1" max={12} 
                            value={month} 
                            onChange={this._handleChange.bind(this)}
                            step="1"/>
                        <LineChart
                            onMouseLeave={() => this.setState({hoverAQI: null, hoverMax:null})}
                            onMouseEnter={(event) => {
                                // console.log(event) //event.activeLabel
                                let newHover, newCategory;
                                theMonthData.forEach((line) => {
                                    if(line['Date (LT)'] === event.activeLabel){
                                        newHover = line['AQI']
                                        newCategory = line['AQI Category']
                                    }
                                })
                                this.setState({
                                    hoverDate: event.activeLabel,
                                    hoverAQI: newHover,
                                    hoverCategory: newCategory
                                })
                            }}
                            key={month}
                            width= {600} 
                            height= {300} 
                            data= {typeof(monthsData) === 'object' ? theMonthData : _data} 
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }} 
                            >
                            <Label value="AQI US Embassy Kathmandu" position="top" />
                            <YAxis dataKey="AQI" label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}/>
                            <XAxis dataKey="Date (LT)" >
                                <Label value="Days and hours" offset={0} position="insideBottom" />
                            </XAxis>
                            <ReTooltip />
                            <CartesianGrid stroke="#f5f5f5" />
                            <Line type="monotone" dataKey="AQI" stroke="#ff7300" />
                        </LineChart>
                    </div>
                </Control>
            </Map>
        )
    }
}