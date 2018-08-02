import React from 'react';
import { shallow, mount, render } from 'enzyme';
import sinon from 'sinon';
import { Map } from 'react-leaflet';
import Papa from 'papaparse';

import Pollution from './Pollution';
import { wrap } from 'sinon/lib/sinon/util/core/deprecated';

let wrapper;
it('Mounts <Pollutino> properly', () => {
    wrapper = shallow(<Pollution location={{}}/>);
    expect(wrapper.find(Map).length).toBe(1) // only child
    expect(wrapper.children.length).toBe(1)    
})

it('<Pollutino> state', () => {
    // let wrapper = shallow(<Pollution location={{}}/>);
    // console.log(wrapper.props().center.length)
    expect(wrapper.state().center.length).toBe(2)
    expect(wrapper.state().data).toBe('loading')
    // expect(wrapper._data).not.toBe(undefined)
    Papa.parse("http://dosairnowdata.org/dos/historical/EmbassyKathmandu/2018/EmbassyKathmandu_PM2.5_2018_YTD.csv", {
        download: true,
        complete: (results, file) => {
            console.log("Parsing complete:", results, file);
            const keys = results.data[0];
            let json = [];
            results.data.forEach((line, j) => {
                if(j > 0 && j < 500 && parseFloat(line[8]) > 0) { //AQI needs to be above 0
                    const obj = {};
                    keys.forEach((key,i) => obj[key] = key === "AQI" ? parseFloat(line[i]) : line[i])
                    json.push(obj)
                }
            })
            wrapper = shallow(<Pollution 
                sample={`${results.data[1][8]} on ${results.data[1][2]}`} 
                data={json}
                location={{}}
            />);
            expect(wrapper.props().data.length).not.toBe(0);
        }
    })
})

it('<Pollutino> props', () => {
    console.log(wrapper.props());
})
// TODO: more innner component/state/props test coverage