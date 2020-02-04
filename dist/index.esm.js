import PropTypes from 'prop-types';
import { Component, Children, createElement } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

// https://github.com/styled-components/styled-components/blob/e05b3fe247e9d956bcde786cec376e32afb85bca/src/utils/create-broadcast.js
var createBroadcast = function createBroadcast(initialState) {
  var listeners = {};
  var id = 0;
  var state = initialState;

  function publish(nextState) {
    state = nextState;

    for (var key in listeners) {
      // $FlowFixMe
      var listener = listeners[key];

      if (listener === undefined) {
        continue;
      }

      listener(state);
    }
  }

  function subscribe(listener) {
    var currentId = id;
    listeners[currentId] = listener;
    id += 1;
    listener(state);
    return currentId;
  }

  function unsubscribe(unsubID) {
    listeners[unsubID] = undefined;
  }

  return {
    publish: publish,
    subscribe: subscribe,
    unsubscribe: unsubscribe
  };
};

var channel = '__EMOTION_THEMING__';

var _contextTypes;
var contextTypes = (_contextTypes = {}, _contextTypes[channel] = PropTypes.object, _contextTypes);

var isPlainObject = function isPlainObject(test) {
  return Object.prototype.toString.call(test) === '[object Object]';
};

// Get the theme from the props, supporting both (outerTheme) => {} as well as object notation
function getTheme(theme, outerTheme) {
  if (typeof theme === 'function') {
    var mergedTheme = theme(outerTheme);

    if (!isPlainObject(mergedTheme)) {
      throw new Error('[ThemeProvider] Please return an object from your theme function, i.e. theme={() => ({})}!');
    }

    return mergedTheme;
  }

  if (!isPlainObject(theme)) {
    throw new Error('[ThemeProvider] Please make your theme prop a plain object');
  }

  if (outerTheme === undefined) {
    return theme;
  }

  return _extends({}, outerTheme, theme);
}

var ThemeProvider =
/*#__PURE__*/
function (_Component) {
  _inheritsLoose(ThemeProvider, _Component);

  function ThemeProvider() {
    return _Component.apply(this, arguments) || this;
  }

  var _proto = ThemeProvider.prototype;

  _proto.UNSAFE_componentWillMount = function UNSAFE_componentWillMount() {
    var _this = this;

    // If there is a ThemeProvider wrapper anywhere around this theme provider, merge this theme
    // with the outer theme
    if (this.context[channel] !== undefined) {
      this.unsubscribeToOuterId = this.context[channel].subscribe(function (theme) {
        _this.outerTheme = theme;

        if (_this.broadcast !== undefined) {
          _this.publish(_this.props.theme);
        }
      });
    }

    this.broadcast = createBroadcast(getTheme(this.props.theme, this.outerTheme));
  };

  _proto.getChildContext = function getChildContext() {
    var _ref;

    return _ref = {}, _ref[channel] = {
      subscribe: this.broadcast.subscribe,
      unsubscribe: this.broadcast.unsubscribe
    }, _ref;
  };

  _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.theme !== nextProps.theme) {
      this.publish(nextProps.theme);
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    var themeContext = this.context[channel];

    if (themeContext !== undefined) {
      themeContext.unsubscribe(this.unsubscribeToOuterId);
    }
  };

  _proto.publish = function publish(theme) {
    this.broadcast.publish(getTheme(theme, this.outerTheme));
  };

  _proto.render = function render() {
    if (!this.props.children) {
      return null;
    }

    return Children.only(this.props.children);
  };

  ThemeProvider.childContextTypes = contextTypes;
  ThemeProvider.contextTypes = contextTypes;
  return ThemeProvider;
}(Component);

var withTheme = function withTheme(Component$$1) {
  var componentName = Component$$1.displayName || Component$$1.name || 'Component';

  var WithTheme =
  /*#__PURE__*/
  function (_React$Component) {
    _inheritsLoose(WithTheme, _React$Component);

    function WithTheme(props) {
      return _React$Component.call(this, props) || this;
    }

    var _proto = WithTheme.prototype;

    _proto.UNSAFE_componentWillMount = function UNSAFE_componentWillMount() {
      var _this = this;

      var themeContext = this.context[channel];

      if (themeContext === undefined) {
        // eslint-disable-next-line no-console
        console.error('[withTheme] Please use ThemeProvider to be able to use withTheme');
        return;
      }

      this.unsubscribeId = themeContext.subscribe(function (theme) {
        _this.setState({
          theme: theme
        });
      });
    };

    _proto.componentWillUnmount = function componentWillUnmount() {
      if (this.unsubscribeId !== -1) {
        this.context[channel].unsubscribe(this.unsubscribeId);
      }
    };

    _proto.render = function render() {
      return createElement(Component$$1, _extends({
        theme: this.state.theme
      }, this.props));
    };

    return WithTheme;
  }(Component);

  WithTheme.displayName = "WithTheme(" + componentName + ")";
  WithTheme.contextTypes = contextTypes;
  return hoistNonReactStatics(WithTheme, Component$$1);
};

export { ThemeProvider, withTheme, channel, contextTypes, createBroadcast };
