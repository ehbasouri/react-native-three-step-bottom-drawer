import React, { Component } from 'react';
import { 
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MID_AREA = 100;

export default class Animator extends Component{
  constructor(props){
    super(props);
    this.currentState= "down"
    this.position = new Animated.ValueXY(this.props.currentPosition);
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderRelease
    });
  }

  componentDidUpdate(preProps){
    if (preProps.closedrawer != this.props.closedrawer && this.props.closedrawer) {
      this.currentState="down"
      this._transitionTo(this.props.downPosition, ()=>this.props.onCollapsed(this.currentState));  
    }
  }

  render() {
    var isPanResponder = {}
    if (this.props.animateEnabled) {
      isPanResponder = this._panResponder.panHandlers
    }
    return (
      <Animated.View 
        style={[
          {...this.position.getLayout(), left: 0},
          StyleSheet.flatten([
            styles.animationContainer(this.props.containerHeight, this.props.backgroundColor),
            styles.roundedEdges(this.props.roundedEdges),
            styles.shadow(this.props.shadow)
          ])
        ]}
        {...isPanResponder}

      >
        {this.props.children}
      </Animated.View>
    )
  }

  _handlePanResponderMove = (e, gesture) => {

   if (this._swipeInBounds(gesture)) {
      this.position.setValue({ y: this.props.currentPosition.y + gesture.dy });
    } else {
      this.position.setValue({ y: this.props.upPosition.y - this._calculateEase(gesture) });
    }
  }

  _handlePanResponderRelease = (e, gesture) => {
    // if( this._swipeInMidBounds(gesture) && this.props.currentPosition !== this.props.midPosition ){
    //   this._transitionTo(this.props.midPosition, this.props.onCollapsed);
    // } else 
    if (gesture.dy > this.props.toggleThreshold && this.props.currentPosition !== this.props.downPosition) {
      if (this.props.currentPosition === this.props.upPosition && this.props.hasMid ) {
        this.currentState = "middle"
        this._transitionTo(this.props.midPosition, ()=>this.props.onCollapsed(this.currentState));   
      } else {
        this.currentState = "down"
        this._transitionTo(this.props.downPosition, ()=>this.props.onCollapsed(this.currentState));  
      }
    } else if (gesture.dy < -this.props.toggleThreshold && this.props.currentPosition !== this.props.upPosition) {
      if (this.props.currentPosition === this.props.downPosition && this.props.hasMid ) {
        this.currentState = "middle"
        this._transitionTo(this.props.midPosition, ()=>this.props.onExpanded(this.currentState));
      } else {
        this.currentState = "up"
        this._transitionTo(this.props.upPosition, ()=>this.props.onExpanded(this.currentState));
      }
    } else {
      this._resetPosition();
    }
  }

  // returns true if the swipe is within the height of the drawer.
  _swipeInBounds(gesture) {
    return this.props.currentPosition.y + gesture.dy > this.props.upPosition.y;
  }

  _swipeInMidBounds(gesture) {
    return  this.props.midPosition.y - MID_AREA < this.props.currentPosition.y + gesture.dy && 
            this.props.currentPosition.y + gesture.dy < this.props.midPosition.y + MID_AREA
  }

  _calculateEase(gesture) {
    return Math.min(Math.sqrt(gesture.dy * -1), Math.sqrt(SCREEN_HEIGHT));
  }

  _transitionTo(position, callback) {
    Animated.spring(this.position, {
      toValue: position
    }).start(() => this.props.onExpanded());
    
    this.props.setCurrentPosition(position);
    callback();
  }

  _resetPosition() {
    Animated.spring(this.position, {
      toValue: this.props.currentPosition
    }).start();
  }
}

const styles = {
  animationContainer: (height, color) => ({
    width: SCREEN_WIDTH,
    position: 'absolute',
    height: height + Math.sqrt(SCREEN_HEIGHT),
    backgroundColor: color,
  }),
  roundedEdges: rounded => {
    return rounded == true && {
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    }
  },
  shadow: shadow => {
    return shadow == true && {
      shadowColor: '#CECDCD',
      shadowRadius: 3,
      shadowOpacity: 5,
    }
  },
}