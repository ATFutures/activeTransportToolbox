'use-strict';

import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { Link, withRouter } from 'react-router-dom';

const navs = [
    {
        key: 1,
        to: "roads",
        title: "Roads"
    },
    {
        key: 2,
        to: "about",
        title: "About"
    },
    {
        key: 3,
        to: "pollution",
        title: "Pollution"
    }
];

class Header extends React.Component {
    
    render () {
        return (
            <Navbar inverse collapseOnSelect>
                <Navbar.Header>
                    <Navbar.Brand>
                        <Link to="/">ATT</Link>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        {
                            navs.map((item, i) => {
                                return(
                                    <NavItem 
                                    key={i}
                                    eventKey={item.key} 
                                    onClick={() => this.props.history.push(item.to)}>
                                        {item.title}
                                    </NavItem>
                                )
                            }) 
                        }
                    </Nav>
                    {/* <Nav pullRight>
                    <NavItem eventKey={2} href="#">
                        Link Right
                    </NavItem>
                    </Nav> */}
                </Navbar.Collapse>
            </Navbar>
        )
    }
}

// thanks to https://stackoverflow.com/a/42124328/2332101
export default withRouter(Header);