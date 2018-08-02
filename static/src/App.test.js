import React from 'react';
import { shallow } from 'enzyme';
import App from './App';
import { Route } from 'react-router-dom';

import Welcome from './Welcome';

it('renders without crashing', () => {
  shallow(<App />);
});

it('renders welcome component', () => {
  const wrapper = shallow(<App />);
  const welcome = <Route exact path="/" component={Welcome} />

  expect(wrapper.contains(welcome)).toEqual(true);
  
})
// TODO: mount and test as here
// https://medium.com/@antonybudianto/react-router-testing-with-jest-and-enzyme-17294fefd303