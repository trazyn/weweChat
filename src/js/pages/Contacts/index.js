
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import clazz from 'classname';
import Masonry from 'react-masonry-component';
import Card from './Card';

import classes from './style.css';

@inject(stores => ({
    filter: stores.contacts.filter,
    filtered: stores.contacts.filtered,
    getContats: stores.contacts.getContats,
    showUserinfo: stores.userinfo.toggle,
}))
@observer
export default class Contacts extends Component {

    componentWillMount() {
        this.props.filter();
    }

    render() {
        var { query, result } = this.props.filtered;

        if (query && result.length === 0) {
            return (
                <div className={clazz(classes.container, classes.notfound)}>
                    <div className={classes.inner}>
                        <img src="assets/images/crash.png" />
                        <h1>Can't find any people matching '{query}'</h1>
                    </div>
                </div>
            );
        }
        var childElements = result.map(function (element,index) {
            return (
                <Card key={index} item={element} />
            );
        }, this);
        return (
            <Masonry
                ref={(c) => this.div = c}
                // default ''
                elementType="div" // default 'div'
                // options={masonryOptions    }} // default {}
                disableImagesLoaded={false}
                // default false
                updateOnEachImageLoad={false}
            // default false and works only if disableImagesLoaded is false
            >
                {childElements}
            </Masonry>

            // <div className={classes.container}>
            //     <div className={classes.columns}>
            //         <div className={classes.column}>
            //             {
            //                 this.renderColumns(result, 0)
            //             }
            //         </div>
            //         <div className={classes.column}>
            //             {
            //                 this.renderColumns(result, 1)
            //             }
            //         </div>
            //         <div className={classes.column}>
            //             {
            //                 this.renderColumns(result, 2)
            //             }
            //         </div>
            //     </div>
            // </div>
        );
    }
}
