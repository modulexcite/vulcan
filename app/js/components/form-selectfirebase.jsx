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


  getInitialState: function() {
    return {
      selectedNamespace: '',
      firebases: []
    };
  },


  componentDidMount: function() {
    var self = this;

    // HIT THE ADMIN ENDPOINT TO GET THE ADMIN TOKENS FOR EACH FIREBASE
    var getTokensForFirebases = function(accountData){
      var namespaces = accountData.firebases;
      var promises = [];
      var request;
      var resolveRequest;

      // CREATE ONE PROMISE REQUEST FOR EACH FIREBASE
      for (var namespace in namespaces) {
        // WRAP REQUEST IN $.Deferred() TO PASS CONTEXT (NAME OF FIREBASE NAMESPACE)
        request = $.Deferred();
        resolveRequest = function(tokenData) {
          this.request.resolve({
            namespace: this.namespace,
            tokenData: tokenData
          });
        }.bind({
          request: request,
          namespace: namespace
        });

        $.ajax({
          url: 'https://admin.firebase.com/firebase/' + namespace + '/token?token=' + self.props.adminToken + '&namespace=' + namespace
        })
        .then(resolveRequest);

        promises.push(request.promise());
      }

      // WAIT FOR ALL PROMISES TO RESOLVE BEFORE GETTING SECRETS
      return $.when.apply(null, promises);
    };


    // GET THE SECRETS FOR THE FIREBASES USING THE ADMIN TOKENS
    var getSecretsForFirebases = function() {
      var tokenPayloads = Array.prototype.slice.call(arguments);

      // CREATE ONE PROMISE REQUEST FOR EACH FIREBASE TOKEN
      var promises = tokenPayloads.map(function(tokenPayload){
        // WRAP REQUEST IN $.Deferred() TO PASS CONTEXT (NAME OF FIREBASE NAMESPACE)
        var request = $.Deferred();
        var namespace = tokenPayload.namespace;
        var personalToken = tokenPayload.tokenData.personalToken;

        $.ajax({
          url: 'https://' + namespace + '.firebaseio.com/.settings/secrets.json?auth=' + personalToken
        }).then(function(secretData){
          request.resolve({
            namespace: namespace,
            secret: secretData[0]
          });
        });

        return request;
      });

      // WAIT FOR ALL PROMISES TO RESOLVE BEFORE GETTING SECRETS
      return $.when.apply(null, promises);
    };


    // TAKE THE FIREBASES / SECRETS AND SET THE LOGIN FORM STATE WITH THEM
    var listFirebasesForLogin = function() {
      var firebasesAndSecrets = Array.prototype.slice.call(arguments);
      var firstNamespaceListed = firebasesAndSecrets[0].namespace;
      // POST RESULTS BACK TO CONNECTION
      self.setState({
        firebases: firebasesAndSecrets,
        selectedNamespace: firstNamespaceListed
      });
    };


    // KICK OFF REQUESTS AND ULTIMATELY POST MESSAGE BACK TO APP CODE WITH FIREBASES / SECRETS
    $.ajax({
      url: 'https://admin.firebase.com/account?token=' + self.props.adminToken
    })
    .then(getTokensForFirebases)
    .then(getSecretsForFirebases)
    .then(listFirebasesForLogin);
  },


  /**
   * _renderSelector
   *
   * renders either a loading message or a selector
   */

  _renderSelector: function() {
    var pclass = this.prefixClass;
    var cx = React.addons.classSet;
    var elem;

    var formClasses = cx({
      'form-fields': true,
      'l-stacked': true,
      'form-fields-large': !this.props.isDevTools
    });

    if (this.state.firebases.length === 0) {
      elem = (
        <ul className={pclass(formClasses)}>
          <li>
            <label>Loading your Firebase apps...</label>
          </li>
        </ul>
      );
    }
    else {
      elem = (
        <div>
          <ul className={pclass(formClasses)}>
            <li>
              <label for='firebase-picker'>Select a Firebase app to view:</label>
              <select id='firebase-picker' name='firebase-picker' ref='firebasePicker' onChange={this.updateSelectedFirebase}>
                {this.state.firebases.map(function(firebase){
                  return <option value={firebase.namespace}>{firebase.namespace}</option>
                })}
              </select>
            </li>
          </ul>
          <input type='submit' value='View Data' className={pclass('button button-large button-primary')} />
        </div>
      );
    }

    return elem;
  },


  /**
   * updateSelectedFirebase
   *
   * set the state of the component with the selected Firebase namespace
   */

  updateSelectedFirebase: function(e) {
    var selectedNamespace = e.target.value;

    this.setState({
      selectedNamespace: selectedNamespace
    });
  },


  /**
   * showFirebase
   *
   * take the user to the data view
   */

  showFirebase: function(e) {
    e.preventDefault();
    this.props.selectFirebase(this.state.selectedNamespace);
  },


  /**
   * render
   *
   * render the select firebase form
   */

  render: function() {
    var pclass = this.prefixClass;
    var cx = React.addons.classSet;

    var styles = {
      selectContainer: {
        margin: '0 auto',
        width: '300px'
      }
    }

    //OPTIONS FOR PINNING STATE
    var classes = cx({
      'login-form': true,
      'is-devtools': this.props.isDevTools
    });


    return  (
      <form onSubmit={this.showFirebase} className={pclass(classes)}>
        <img className={pclass('logo-image')} src='images/vulcan-logo.png' />
        <h2 className={pclass('title')}>Vulcan</h2>
        <p className={pclass('sub-title')}>Firebase Data Inspector</p>

        <div style={styles.selectContainer}>
          {this._renderSelector()}
        </div>
      </form>
    )
  },
});
