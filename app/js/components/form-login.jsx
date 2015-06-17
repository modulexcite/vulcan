/** @jsx React.DOM */

/*
* LOGIN FORM COMPONENT
*
* This component dislays a form that requires the user
* to enter a Firebase URL and an Auth Token (optional)
*/

var React = require('react/addons');
var AppMixins = require('./mixins');
var $ = require('jquery');

module.exports = React.createClass({

  isLocalStorageAvailable: false,
  mixins: [AppMixins],

  /**
   * getInitialState
   *
   * The return value will be used as the initial value of this.state
   */

  getInitialState: function() {
    var email = this.props.email || '';
    var password = this.props.password || '';

    return {
      email: email,
      password: password
    };
  },


  /**
   * componentDidMount
   *
   * check to see if client has localStorage
   */

  componentDidMount: function() {
    this.isLocalStorageAvailable = this.checkForLocalStorage();
  },


  /**
   * login
   *
   * login a user to the Firebase servers
   */

  login: function(email, password, rememberMe) {
    return $.ajax({
      url: 'https://admin.firebase.com/account/login',
      data: {
        email: email,
        password: password,
        rememberMe: rememberMe
      }
    });
  },

  setAdminToken: function(adminToken){
    if (this.isLocalStorageAvailable) {
      localStorage.setItem('adminToken', adminToken);
    }
  },

  getAdminToken: function(){
    var adminToken = '';

    if (this.isLocalStorageAvailable) {
      adminToken = localStorage.getItem('adminToken');
    }

    return adminToken;
  },


  /**
   * handleSubmit
   *
   * Handles the submit event for the form
   */

  handleSubmit: function(e) {
    e.preventDefault();
    var self = this;
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();
    var pclass = this.prefixClass;

    var emailPasswordValidation = function(email, password) {
      var errors = {
        email: undefined,
        password: undefined
      };

      // VERY SIMPLE EMAIL / PW CHECK
      if (email.indexOf('@') === -1) {
        errors.email = true;
      }
      if (password.length === 0) {
        errors.password = true;
      }

      return errors;
    };

    var errors = emailPasswordValidation(email, password);
    var hasErrors = (errors.email || errors.password);

    if (hasErrors) {

      // DISPLAY ANY ERROR MESSAGES
      if (errors.email) {
        this.refs.emailLabel.getDOMNode().innerHTML = 'Please enter a valid email address';
        this.refs.emailLabel.getDOMNode().className = pclass('has-error');
      }
      if (errors.password) {
        this.refs.passwordLabel.getDOMNode().innerHTML = 'Please enter a password';
        this.refs.passwordLabel.getDOMNode().className = pclass('has-error');
      }

    }
    else {
      this.props.onLogin({
        email: email,
        password: password
      });
    }
  },


  /**
   * renderAuthLabel
   *
   * Renders the label for the authentication password field.
   * This method also renders the error message for this field.
   */

  renderAuthLabel: function() {
    var pclass = this.prefixClass;
    var label = <label for="passwordField" ref="passwordLabel">Authentication Token <em>(optional, <a target="_blank" href="https://www.firebase.com/docs/web/guide/simple-login/custom.html">more info</a>)</em></label>

    if (this.props.authError) {
      label = <label for="passwordField" ref="passwordLabel" className={pclass('has-error')}>The Authentication Token is Invalid</label>
    }

    return label;
  },


  /**
   * render
   *
   * When called, it should examine this.props and
   * this.state and return a single child component.
   */

  render: function() {
    var pclass = this.prefixClass;
    var cx = React.addons.classSet;


    //OPTIONS FOR PINNING STATE
    var classes = cx({
      'login-form': true,
      'is-devtools': this.props.isDevTools
    });

    var formClasses = cx({
      'form-fields': true,
      'l-stacked': true,
      'form-fields-large': !this.props.isDevTools
    });


    return  (
      <form onSubmit={this.handleSubmit} className={pclass(classes)}>
        <img className={pclass('logo-image')} src="images/vulcan-logo.png" />
        <h2 className={pclass('title')}>Vulcan</h2>
        <p className={pclass('sub-title')}>Firebase Data Inspector</p>

        <ul className={pclass(formClasses)}>
          <li>
            <label for="emailField" ref="emailLabel">Email</label>
            <input id="emailField" ref="email" type="text" name="email" defaultValue={this.state.email}/>
          </li>
          <li>
            <label for="passwordField" ref="passwordLabel">Password</label>
            <input id="passwordField"  ref="password" type="password" name="password"/>
          </li>
        </ul>

        <input type="submit" value="Sign In" className={pclass('button button-large button-primary')} />
      </form>
    )
  },

  checkForLocalStorage: function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }
});