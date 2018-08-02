import React from 'react';
import { shallow, mount, render } from 'enzyme';
import sinon from 'sinon';
import { MemoryRouter, Route } from 'react-router';
import { Map } from 'react-leaflet';

import Welcome from './Welcome';
import ATTSidebar from './components/ATTSidebar';

/**
 * Considerable search through jest, enzyme and react docs and
 * unable to run a "mount" example of Welcome or similar components
 * The reason is the async call of `fetch`, there are examples how to
 * do a similar call but on both test and component using a function
 * provided as props to be mocked in test. This is NOT what I want to test.
 * 
 * beforeEach and sinon.stub so far is the only way to do it, though
 * can't see this in the docs.
 * 
 * I would like to test the real componentDidMount which makes a call.
 * To find a why to check for the next setState to have been fired and 
 * when value of geodata/loading is changed (once fetch is returned).
 * TODO: MORE ON THIS
 */
let fakeComponentDidMount;
beforeEach(function () {
  fakeComponentDidMount = sinon.stub(Welcome.prototype, 'componentDidMount');
  fakeComponentDidMount.callsFake(function () {});
  let wrapper = mount(<Welcome location={{}}/>);
  expect(wrapper.find(Map).length).toBe(1) // only child

});

afterEach(function () {
  fakeComponentDidMount.restore();
});

it('Welcome enzyme render (static)', () => {
  const wrapper = render(
    <Welcome location={{}}/>
  );
  
  expect(wrapper.find(ATTSidebar).length).toBe(0) //child of child
  expect(wrapper.children.length).toBe(1); // only child is is map
  expect(wrapper.find(Map).length).toBe(0) // only child NOT mounted
}); 

it('Welcome enzyme shallow', () => {
  const wrapper = shallow(
    <Welcome location={{}}/>
  );
  
  expect(wrapper.find(ATTSidebar).length).toBe(1) //child of child
}); 
