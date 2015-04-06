/** @jsx React.DOM */
var React = require('react/addons');
var EventHub = require('./eventhub');
var ReactTransitionGroup = React.addons.TransitionGroup;
var AppMixins = require('./mixins');

/*
* NODE COMPONENT
*
* The node element that is the core of this application.
* This component recursively creates itself when displaying
* data from Firebase.
*/

var Node = React.createClass({
  DEFAULT_DISPLAY_NODES: 1000,  // NODES TO DISPLAY IN UI
  UPDATE_BUFFER: 50,            // MILLISECONDS
  mixins: [AppMixins],
  timeout: null,
  updateTimeout: null,

  /*
  * listeners
  *
  * Methods that are executed when one of the following
  * Firebase events is fired from a ref.
  */

  listeners: {
    value: function(snapshot) {
      this.update(snapshot, {
        expandAll: this.props.expandAll,
        collapseAll: this.props.collapseAll
      });

      if(this.props.root && !this.firstRender) {
        this.props.onChange({
          priority: snapshot.getPriority(),
          status: 'changed'
        });
      }

      this.firstRender = false;
    },
    child_changed: function(snapshot, prevChildName) {
      this.flags[snapshot.key()] = 'changed';
    },
    child_added: function(snapshot, previousName) {
      if(this.firstRender === false && this.state.expanded) {
        this.flags[snapshot.key()] = 'added';
      }
    },
    child_removed: function(snapshot) {
      this.flags[snapshot.key()] = 'removed';
    },
    child_moved: function(snapshot, previousName) {
      this.flags[snapshot.key()] = 'moved';
    }
  },


  /*
  * getInitialState
  *
  * The return value will be used as the initial value of this.state
  */

  getInitialState: function() {
    this.firstRender = true;
    this.flags = {}; //USED TO TRACK STATE OF RECENTLY CHANGE NODE

    return {
      hasChildren: false,
      numChildren: 0,
      children: [],
      nodesShowing: this.DEFAULT_DISPLAY_NODES,
      name: '',
      value: null,
      expanded: this.props.expandAll === true ? true : false,
      firebaseRef: null
    };
  },


  /*
  * componentWillMount
  *
  * Invoked once, both on the client and server,
  * immediately before the initial rendering occurs.
  */

  componentWillMount: function() {
    this.props.firebaseRef.on('value', this.listeners.value.bind(this), function(error) {
      if(error && error.code && this.props.root) {
        EventHub.publish('reset', error.code);
      }
    }.bind(this));

    //ONLY USED FOR ROOT NODE EVENTS
    if(this.props.root) {
      this._addEvents();
    }
  },


  /*
  * componentWillUnmount
  *
  * Invoked immediately before a component is unmounted from the DOM.
  */

  componentWillUnmount: function() {
    this.props.firebaseRef.off();
  },


  /*
  * componentDidUpdate
  *
  * Invoked immediately after updating occurs.
  * This method is not called for the initial render.
  */

  componentDidUpdate: function() {
    //RESET STATUS TO NORMAL
    if(this.props.status !== 'normal' && this.props.status !== 'removed') {
      if(this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(function() {
        this.props.onResetStatus(this);
      }.bind(this), 1000);
    }
  },


  /*
  * componentWillReceiveProps
  *
  * Invoked when a component is receiving new props.
  * This method is not called for the initial render.
  */

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.expandAll === true) {
      this.update(this.state.snapshot, {
        expanded: true,
        expandAll: nextProps.expandAll
      });
    }
    else if (nextProps.collapseAll === true && this.props.root) {
      this.update(this.state.snapshot, {
        expandAll: nextProps.expandAll,
        collapseAll: nextProps.collapseAll
      });
    }
    else if (nextProps.collapseAll === true && !this.props.root) {
      this._collapse();
    }
  },


  /*
  * toggle
  *
  * Used to toggle open and close a node that has children
  */

  toggle: function() {
    if(this.state.expanded) {
      this._collapse();
    }
    else {
      this._expand();
    }
  },


  /*
  * _expand
  *
  * Expand a node tree to display its children
  */

  _expand: function() {
    this._addEvents();
    this.update(this.state.snapshot, {
      expanded: true,
      expandAll: this.props.expandAll,
      collapseAll: this.props.collapseAll
    });
  },


  /*
  * _collapse
  *
  * Collapse a node tree to hide its children
  */

  _collapse: function() {
    this._removeEvents();
    this.update(this.state.snapshot, {
      expanded: false,
      expandAll: this.props.expandAll,
      collapseAll: this.props.collapseAll
    });
  },


  /*
  * getToggleText
  *
  * Returns the symbol displayed in the toggle button
  * that hides and shows child nodes
  */

  getToggleText: function() {
    return this.state.expanded ? '-' : '+';
  },


  /*
  * removeNode
  *
  * Deletes a node from Firebase
  */

  removeNode: function(e) {
    e.preventDefault();
    this.props.firebaseRef.remove(function(error) {
      if(error && error.code) {
        EventHub.publish('error', error.code);
      }
    }.bind(this));
  },


  /*
  * editNode
  *
  * Publishes the edit event that should display
  * an input method for a user to edit a node
  */

  editNode: function(e) {
    e.preventDefault();
    EventHub.publish('edit', this);
  },


  /*
  * addNode
  *
  * Publishes the add event that should display
  * an input method for a user to add a node
  */

  addNode: function(e) {
    e.preventDefault();
    EventHub.publish('add', this);
  },


  /*
  * editPriority
  *
  * Publishes the priority event that should display
  * an input method for a user to edit the priority for a node
  */

  editPriority: function(e) {
    e.preventDefault();
    EventHub.publish('priority', this);
  },


  /*
  * resetStatus
  *
  * Force a rerender to reset all status back to normal
  */

  resetStatus: function(node) {
    this.update(this.state.snapshot);
  },


  /*
  * _removeEvents
  *
  * Remove child event listeners
  */

  _removeEvents: function() {
    ['child_added', 'child_removed', 'child_changed', 'child_moved'].forEach(function(event) {
      this.props.firebaseRef.off(event);
    }, this);
  },


  /*
  * _addEvents
  *
  * Add child event listeners
  */

  _addEvents: function() {
    ['child_added', 'child_removed', 'child_changed', 'child_moved'].forEach(function(event) {
      this.props.firebaseRef.on(event, this.listeners[event].bind(this));
    }, this);
  },


  /*
  * update
  *
  * Updates the node and its children when new snapshot data
  * or options are presented.
  */

  update: function(snapshot, options) {
    //CLEAR TIMEOUT
    if(this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    //SET THE NEW STATE
    this.updateTimeout = setTimeout(function() {
      options = options || {};
      var children = [];
      var expanded = (options.expanded !== undefined) ? options.expanded : this.state.expanded;
      var name = snapshot.key();
      var numChildrenInSnapshot = snapshot.numChildren();

      //ROOT NODE ONLY
      if(this.props.root) {
        var rootName = this.props.firebaseRef.root().toString();
        var refName = this.props.firebaseRef.toString();
        expanded = true;

        if(refName === rootName) {
          //THIS IS THE ROOT NODE
          name = refName.replace('https://', '').replace('.firebaseio.com', '');
        }
        else {
          //STRIP EVERYTHING AWAY BUT NAME
          name = refName.replace(rootName + '/', '');
        }
      }

      // IF CHILDREN ARE PRESENT AND DISPLAYED
      if(snapshot.hasChildren() && expanded) {

        // A CHILD NODE HAS BEEN DELETED
        if(this.state.numChildren > snapshot.numChildren()) {
          children = this.createChildren(this.state.snapshot, options);

          //DELAY CHANGE FOR THE HIGHLIGHT
          setTimeout(function(){
            this.setState({
              children: this.createChildren(snapshot, options)
            });
          }.bind(this), 1000);
        }
        else {
          children = this.createChildren(snapshot, options);
        }
      }

      //UPDATE STATE
      this.setState({
        snapshot: snapshot,
        hasChildren: snapshot.hasChildren(),
        numChildren: snapshot.numChildren(),
        children: children,
        expanded: expanded,
        name: name,
        value: snapshot.val()
      });
    }.bind(this), this.UPDATE_BUFFER);
  },


  /*
  * createChildren
  *
  * Creates the child nodes for the current node
  * @param {Firebase Snapshot} snapshot - snapshot at a location
  * @param {Object} options - display options
  * @return {Array[React Nodes]} children - children to render
  */

  createChildren: function(snapshot, options) {
    options = options || {};
    var expandAll = options.expandAll || false;
    var collapseAll = options.collapseAll || false;
    var children = [];

    snapshot.forEach(function(child){
      var status = 'normal';

      //SEE IF NODE HAS A STATUS & DELETE FLAG
      if(this.flags[child.key()]) {
        status = this.flags[child.key()];
        delete this.flags[child.key()];
      }

      //CREATE A NODE
      var node = (
        <Node
          key={child.key()}
          firebaseRef={child.ref()}
          snapshot={child}
          expandAll={expandAll}
          collapseAll={collapseAll}
          onResetStatus={this.resetStatus}
          status={status}
          priority={child.getPriority()} />
      );

      children.push(node);

    }.bind(this));

    return children;
  },


  /*
  * revealMoreNodesNotification
  *
  * render a "x more nodes" notification at the end of a long list of data
  * @param {Number} numHiddenChildren - number of children not displayed
  * @param {React DOM} - a "x more nodes" notification
  */

  revealMoreNodesNotification: function(numHiddenChildren) {
    var pclass = this.prefixClass;

    return (
      <button className={pclass('button button-action')} onClick={this.showMoreNodes}>
        {numHiddenChildren} more nodes...
      </button>
    );
  },


  /*
  * showMoreNodes
  *
  * update component state to indicate that DEFAULT_DISPLAY_NODES more nodes are showing
  */

  showMoreNodes: function() {
    var newNodesShowing = this.state.nodesShowing + this.DEFAULT_DISPLAY_NODES;

    if (newNodesShowing > this.state.children.length) {
      newNodesShowing = this.state.children.length;
    }

    this.setState({
      nodesShowing: newNodesShowing
    });
  },


  /*
  * renderToggleButton
  *
  * Returns a toggle button element if node has children
  */

  renderToggleButton: function() {
    var toggle = '';
    var pclass = this.prefixClass;

    if(this.state.hasChildren && !this.props.root) {
      toggle = <span className={pclass('toggle')} onClick={this.toggle}>{this.getToggleText()}</span>;
    }

    return toggle;
  },


  /*
  * renderPriorityBadge
  *
  * Returns a priority badge if node has a priority set
  */

  renderPriorityBadge: function() {
    var priority = '';
    var pclass = this.prefixClass;
    var hasPriority = this.hasPriority(this.props.priority);

    if(hasPriority) {
      priority = <em className={pclass('priority')}>{this.props.priority}</em>;
    }

    return priority;
  },


  /*
  * renderButtons
  *
  * Returns the correct edit buttons. This methods will return different
  * buttons for leaf nodes, parent nodes, and the root node.
  */

  renderButtons: function() {
    var pclass = this.prefixClass;
    var editButton = (!this.state.hasChildren) ? <button className={pclass('button button-small button-action l-pad-right')} onClick={this.editNode}>Edit</button> : '';
    var addButton = (this.state.hasChildren  || this.props.root) ? <button className={pclass('button button-small button-primary l-pad-right')} onClick={this.addNode}>Add</button> : '';
    var priorityButton = (this.state.hasChildren && !this.props.root) ? <button className={pclass('button button-small button-action l-pad-right')} onClick={this.editPriority}>Priority</button> : '';

    return (
      <div className={pclass('options')}>
        <div className={pclass('options-arrow')}></div>
        {editButton}
        {addButton}
        {priorityButton}
        <button className={pclass('button button-small button-caution')} onClick={this.removeNode}>Remove</button>
      </div>
    );
  },


  /*
  * renderNumberOfChildren
  *
  * Returns a number of children element if node has children
  */

  renderNumberOfChildren: function() {
    var numChildren = '';
    var pclass = this.prefixClass;

    if(this.state.hasChildren) {
      numChildren = <span className={pclass('num-children')}>({this.state.numChildren})</span>;
    }

    return numChildren;
  },


  /*
  * renderChildren
  *
  * Returns list of child nodes elements if node has children
  * and they should be displayed
  */

  renderChildren: function() {
    var children = {};
    var pclass = this.prefixClass;
    var numNodesHidden = this.state.children.length - this.state.nodesShowing;
    var nodesToShow = this.state.children.slice(0, this.state.nodesShowing);

    // IF NODES ARE STILL HIDDEN, APPEND THE SHOW MORE NODES BUTTON
    if (numNodesHidden > 0) {
      nodesToShow.push(this.revealMoreNodesNotification(numNodesHidden));
    }

    if(this.state.hasChildren && this.state.expanded) {
      children = (
        <ul className={pclass('child-list')}>
          {nodesToShow}
        </ul>
      );
    }

    return children;
  },


  /*
  * renderNodeValue
  *
  * Returns the value the current node
  */

  renderNodeValue: function() {
    var nodeValue = '';
    var isNull = this.state.value === null;
    var isRoot = this.props.root;
    var noChildren = !this.state.hasChildren;
    var pclass = this.prefixClass;

    if(!this.state.name) {
      nodeValue = <em className={pclass('value')}>Loading... (this may take a while if you have a lot of data)</em>;
    }
    else if(isRoot && isNull) {
      nodeValue = <em className={pclass('value')}>null</em>;
    }
    else if(isRoot && noChildren) {
      nodeValue = <em className={pclass('value')}>{this.state.value + ''}</em>;
    }
    else if(!isRoot && noChildren) {
      nodeValue = <em className={pclass('value')}>{this.state.value + ''}</em>;
    }

    return nodeValue;
  },


  /*
  * render
  *
  * When called, it should examine this.props and
  * this.state and return a single child component.
  */

  render: function() {
    var pclass = this.prefixClass;

    return (
      <li className={pclass('node')}>
        {this.renderToggleButton()}

        <div className={pclass(['container', "is-" + this.props.status])}>
          {this.renderButtons()}
          {this.renderPriorityBadge()}
          <strong className={pclass('name')}>{this.state.name}</strong>
          {this.renderNumberOfChildren()}
          {this.renderNodeValue()}
        </div>

        {this.renderChildren()}
      </li>
    );
  }
});

module.exports = Node;