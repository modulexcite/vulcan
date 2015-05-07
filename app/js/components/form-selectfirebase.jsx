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
            <select name="firebase-picker" ref="firebasePicker">
              <option value="url">Enter a Firebase URL</option>
            </select>
          </li>
        </ul>

        <input type="submit" value="View Data" className={pclass('button button-large button-primary')} />
      </form>
    )
  },
});
