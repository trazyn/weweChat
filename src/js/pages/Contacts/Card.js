import React from 'react';
import { observer } from "mobx-react";
import classes from './style.css';
import randomColor from 'randomcolor';



@observer
class Card extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: '250px',
        }
    }

    componentDidMount() {
        this.clientWidth = this.div.parentNode;
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    handleResize(e) {
        var clientWidth = this.clientWidth.clientWidth;
        var width = 100 / Math.round(clientWidth / 250)
        this.setState({
            width: width + '%'
        })
    }


    render() {
        var e = this.props.item
        var styles = {
            width: this.state.width
        }
        return (
            <div ref={(c) => this.div = c}
                style={styles}>
                <div
                    className={classes.group}
                >
                    <div className={classes.header}>
                        <label>{e.prefix}</label>
                        <span>{e.list.length} people</span>
                        <span style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            height: 4,
                            width: '100%',
                            background: randomColor(),
                        }} />
                    </div>

                    <div className={classes.list}>
                        {
                            e.list.map((e, index) => {
                                return (
                                    <div
                                        className={classes.item}
                                        key={index}
                                        onClick={() => this.props.showUserinfo(true, e)}>
                                        <div className={classes.avatar}>
                                            <img
                                                src={e.HeadImgUrl}
                                                style={{
                                                    height: 32,
                                                    width: 32,
                                                }} />
                                        </div>
                                        <div className={classes.info}>
                                            <p
                                                className={classes.username}
                                                dangerouslySetInnerHTML={{ __html: e.RemarkName || e.NickName }} />
                                            <p
                                                className={classes.signature}
                                                dangerouslySetInnerHTML={{ __html: e.Signature || 'No Signature' }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

            </div>
        )
    }
}

export default Card;
