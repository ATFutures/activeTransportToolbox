import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';

import Welcome from './Welcome';
import Roads from './Roads';
import Header from './components/Header';
import DynamicImport from './components/DynamicImport';
import Pollution from './components/Pollution';

import './App.css';

/**
 * Code splitting.
 * @param {*} props 
 */
const Deck = (props) => (
  <DynamicImport load={() => import('./Deck')}>
    {
      (Component) => Component === null
      ? <div className="loader" style={{ zIndex: 999}} />
      : <Component {...props} />
    }
  </DynamicImport>
)

/**
 * Separate the Header and the main content.
 * Up to this point we are still not using SSR
 */
class App extends Component {
  render() {
    return (
      <main>
        <Header />
        <Switch>
          <Route exact path="/" component={Welcome} />
          <Route path="/pollution" component={Pollution} />
          <Route path="/deck" component={Deck} />
          <Route path="/roads" component={Roads} />
          <Route path="/about" component={() =>
            <div>
              <p>Coming ... </p>
            </div>
          } />
        </Switch>
      </main>
    )
  }
}

export default App;
