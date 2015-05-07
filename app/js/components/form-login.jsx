/** @jsx React.DOM */
var React = require('react/addons');
var AppMixins = require('./mixins');
var $ = require('jquery');


/*
* LOGIN FORM COMPONENT
*
* This component dislays a form that requires the user
* to enter a Firebase URL and an Auth Token (optional)
*/

module.exports = React.createClass({
  mixins: [AppMixins],

  // sign in -> hit authentication backend
  // if success
  //   show pick firebases dropdown
  //   pick a firebase ->
  //     if is a firebase
  //       show that firebase - END
  //     if is "enter a Firebase URL"
  //       show a firebase url input form
  //
  // if fail
  //   show a failure message
  //

  /*
  * getInitialState
  *
  * The return value will be used as the initial value of this.state
  */

  getInitialState: function() {
    var email = this.props.email || 'you@firebase.com';
    var password = this.props.password || '';

    return {
      email: email,
      password: password
    };
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
    var localStorageAvailable = this.hasLocalStorage();

    if (localStorageAvailable) {
      localStorage.setItem('adminToken', adminToken);
    }
  },

  getAdminToken: function(){
    var localStorageAvailable = this.hasLocalStorage();
    var adminToken = '';

    if (localStorageAvailable) {
      adminToken = localStorage.getItem('adminToken');
    }

    return adminToken;
  },


  /*
  * setFirebaseURL
  *
  * Sets a Firebase URL to local storage
  */

  // setFirebaseURL: function(url) {
  //   var localStorageAvailable = this.hasLocalStorage();

  //   if(localStorageAvailable) {
  //     localStorage.setItem("firebaseURL", url);
  //   }
  // },


  /*
  * getFirebaseURL
  *
  * Gets a Firebase URL that is saved to local storage
  */

  // getFirebaseURL: function() {
  //   var localStorageAvailable = this.hasLocalStorage();
  //   var url = '';

  //  if(localStorageAvailable) {
  //     url = localStorage.getItem("firebaseURL");
  //   }

  //   return url;
  // },


  /*
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

      // // LOGIN TO FIREBASE SERVERS
      // this.login(email, password, true)
      //   .done(function(response){
      //     debugger;
      //   })
      //   .fail(function(){
      //     // SHOW AN ERROR MESSAGE
      //     self.refs.emailLabel.getDOMNode().innerHTML = 'The username or password you entered was incorrect';
      //     self.refs.emailLabel.getDOMNode().className = pclass('has-error');
      //   });

      this.props.onLogin({
        email: email,
        password: password
      });
    }
  },


  /*
  * validateURL
  *
  * Enforces that the URL is a firebase app email
  */

  // validateURL: function(email) {
  //   var isValid = false;
  //   var isFirebaseURL = /^(https:\/\/)[a-zA-Z0-9-]+(.firebaseio.com)[\w\W]*/i;

  //   if(isFirebaseURL.test(email)) {
  //     isValid = true;
  //   }

  //   return isValid;
  // },


  /*
  * renderAuthLabel
  *
  * Renders the label for the authentication password field.
  * This method also renders the error message for this field.
  */

  renderAuthLabel: function() {
    var pclass = this.prefixClass;
    var label = <label for="passwordField" ref="passwordLabel">Authentication Token <em>(optional, <a target="_blank" href="https://www.firebase.com/docs/web/guide/simple-login/custom.html">more info</a>)</em></label>


    if(this.props.authError) {
      label = <label for="passwordField" ref="passwordLabel" className={pclass('has-error')}>The Authentication Token is Invalid</label>
    }

    return label;
  },


  /*
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

  hasLocalStorage: function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }
});