import React from 'react';
import { withRouter } from 'react-router-dom';
import marked from 'marked'

class About extends React.Component {
    constructor (props) {
        super (props)
        this.state = {

        }
    }
    componentDidMount() {
        const readmePath = 'https://raw.githubusercontent.com/ATFutures/activeTransportToolbox/master/README.md';
        fetch(readmePath) 
          .then(response => {
              console.log(response);
              
              return response.text()
          })
          .then(text => {
              this.setState({
                  markdown: marked(text)
              })
          })
    }

    render () {
        const { markdown } = this.state
        return (
            <section style={{padding: '5%'}}>
                <h3>README from <a href='https://github.com/ATFutures/activeTransportToolbox'>github</a> repo</h3>
                <article dangerouslySetInnerHTML={{__html: markdown}}></article>
            </section>
        )
    }
}

// thanks to https://stackoverflow.com/a/42124328/2332101
export default withRouter(About);