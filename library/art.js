/**
 * @author Andrei-Robert Rusu
 * Art is a Javascript Framework going by the concept Action -> Response -> Trigger
 */
var Art = {
  AJAX : {
    getContent : function(settings) {
      if(typeof settings != "object") {
        alert('Art.AJAX.getContent requires setting to be an object');
        return;
      }

      settings.data = typeof settings.data == "undefined" ? null : settings.data;

      if(typeof settings.data == "object")
        settings.data = Art.JSON.recursiveToString(settings.data);

      settings.path = typeof settings.path == "undefined" ? ''     : settings.path;
      settings.type = typeof settings.type == "undefined" ? 'html' : settings.type.toLowerCase();
      settings.onSuccessEvent = typeof settings.onSuccessEvent == "undefined" ?
                               false : settings.onSuccessEvent;
      settings.onErrorEvent = typeof settings.onErrorEvent == "undefined" ?
                             false : settings.onErrorEvent;

      var xhr = new XMLHttpRequest();
          xhr.submittedData = settings.data;
          xhr.open('POST', settings.path + '?t=' + parseInt(new Date().getTime() / 1000));
          xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
              if(xhr.status === 200) {
                if(settings.onSuccessEvent != false) {
                  var data = settings.type == 'json' ? Art.JSON.fromString(xhr.responseText) : xhr.responseText;

                  Art.EventManager.triggerEvent(settings.onSuccessEvent, data);
                }
              } else {
                if(settings.onErrorEvent != false)
                  Art
                    .EventManager
                    .triggerEvent(
                      settings.onErrorEvent,
                      {
                        'status'       : xhr.status,
                        'statusText'   : xhr.statusText
                      });
              }
            }
          };
          xhr.send(settings.data);
    }
  },

  Cookies : {
    defaults: {
      expiryDays: 7
    },

    setCookie: function(name, value, days) {
      if (!days) {
        days = this.defaults.expiryDays;
      }

      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = "; expires=" + date.toGMTString();

      document.cookie = name + "=" + value + expires + "; path=/";

      return {"name": name, "value": value};
    },

    getCookie: function(name) {
      var nameEQ = name + "=",
          ca = document.cookie.split(";");
      for (i = 0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
          return c.substring(nameEQ.length, c.length);
        } else {}
      }
      return "";
    },

    deleteCookie: function(name) {
      this.setCookie(name, "", -1);
      return {"name": name, "value": null};
    }
  },

  JSON : {

    fromString : function(string) {
      return JSON.parse(string);
    },

    recursiveToString : function(information) {
      var ret = '';

      for(var i in information) {
        var key   = i,
            value = information[i];

        if(typeof value == "object" || typeof value == "array") {
          for(var valueIndex in value) {
            ret += (ret == '' ? '' : '&') + (encodeURI(key) + '[' + valueIndex + ']=' + encodeURI(value[valueIndex]));
          }
        } else {
          ret += (ret == '' ? '' : '&') + (encodeURI(key) + '=' + encodeURI(value));
        }
      }

      return ret;
    },

    merge : function() {
      var finalObject = {};

      for(var currentArgumentPosition = 0; currentArgumentPosition < arguments.length ; currentArgumentPosition++) {
        if(typeof arguments[currentArgumentPosition] == "object") {
          var currentArgument = arguments[currentArgumentPosition];

          for(var currentArgumentIndex in currentArgument) {
            if(!finalObject.hasOwnProperty(currentArgumentIndex)) {
              finalObject[currentArgumentIndex] = currentArgument[currentArgumentIndex];
            } else {
              if(finalObject[currentArgumentIndex] instanceof Array
                        && currentArgument[currentArgumentIndex] instanceof Array) {
                for(var currentArgumentIndexArrayWalker = 0;
                        currentArgumentIndexArrayWalker < currentArgument[currentArgumentIndex].length;
                        currentArgumentIndexArrayWalker++) {
                  finalObject[currentArgumentIndex][finalObject[currentArgumentIndex].length]
                      = currentArgument[currentArgumentIndex][currentArgumentIndexArrayWalker];
                }

              } else if(typeof finalObject[currentArgumentIndex] == 'object'
                  && typeof currentArgument[currentArgumentIndex] == 'object') {

                // Don't do a deep copy, for now

                finalObject[currentArgumentIndex] = currentArgument[currentArgumentIndex];

              } else {
                finalObject[currentArgumentIndex] = currentArgument[currentArgumentIndex];
              }
            }
          }
        }
      }

      return finalObject;
    },


    keyCount : function(object) {
      var count = 0;

      for(var i in object)
        count++;

      return count;
    }
  },

  String : {

    ucFirst : function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

  },

  Array : {

    /**
     * @string needle
     * @array haystack
     * @return bool
     */
    hasKey : function(needle, haystack){
      return this.indexOf(needle, haystack) != -1;
    },

    indexOf : function(needle, haystack) {
      var len = haystack.length >>> 0;

      var from = Number(arguments[1]) || 0;
      from = (from < 0)
          ? Math.ceil(from)
          : Math.floor(from);
      if (from < 0)
        from += len;

      for (; from < len; from++) {
        if (from in haystack &&
            haystack[from] === needle)
          return from;
      }
      return -1;
    }
  },

  DOM : {

    getElementAttributes : function(element) {
      return typeof element.attributes == "undefined" ? [] : element.attributes;
    },

    getElementAttributesRelational : function(element, attributePrefix) {
      var elementAttributesRelational = {},
          elementAttributes = this.getElementAttributes(element);

      attributePrefix = typeof attributePrefix == "undefined" ? '' : attributePrefix;

      for(var i = 0; i < elementAttributes.length; i++) {
        var elementKey   = elementAttributes.item(i).nodeName,
            elementValue = elementAttributes.item(i).nodeValue;

        if(elementKey.indexOf(attributePrefix) == 0) {
          elementAttributesRelational[elementKey] = elementValue;
        }
      }

      return elementAttributesRelational;
    }

  },

  /**
   * Art Loader will load your javascript files, use this instead of the classic jQuery load.
   */
  Loader    : {

    headDOMElement : {},
    loadedScripts  : [],
    requestNumber  : 0,
    // We actually use this stuff for our requests
    requestInformation : {},

    init : function() {
      this.headDOMElement = document.getElementsByTagName('head')[0];
    },

    loadScripts : function(scriptsInformation, callback) {
      callback = typeof callback == "undefined" ? false : callback;
      // Set the current request number and increment the count of course.
      var currentRequestNumber = Art.Loader.requestNumber;
      Art.Loader.requestNumber++;

      Art.Loader.requestInformation[currentRequestNumber] = {
        'script_count' : Art.JSON.keyCount(scriptsInformation),
        'loaded_count' : 0
      };

      for(var scriptPath in scriptsInformation) {
        if(scriptPath.slice(-3) == 'css') {
          Art.Loader._loadStyle(scriptPath,
                                scriptsInformation[scriptPath],
                                function(){
            Art.Loader.requestInformation[currentRequestNumber].loaded_count++;

            if(Art.Loader.requestInformation[currentRequestNumber].script_count
                == Art.Loader.requestInformation[currentRequestNumber].loaded_count) {
              if(callback != false)
                callback.call();
            }
          });
        } else {

          Art.Loader._loadScript(scriptPath,
                                 scriptsInformation[scriptPath],
                                 function(){
            Art.Loader.requestInformation[currentRequestNumber].loaded_count++;

            if(Art.Loader.requestInformation[currentRequestNumber].script_count
                == Art.Loader.requestInformation[currentRequestNumber].loaded_count) {
              if(callback != false)
                callback.call();
            }
          });
        }
      }
    },

    /**
     * Providing this script an object and an callback function, will use the loadScripts Instead
     * @param scriptPath
     * @param scriptAlias
     * @param callback
     */
    loadScript : function(scriptPath, scriptAlias, callback) {
      if(typeof scriptPath == "object") {
        this.loadScripts(scriptPath, scriptAlias);
        return;
      }

      this.requestNumber++;

      if(Art.Array.hasKey(scriptAlias, this.loadedScripts)) {
        callback.call();
        return;
      }

      this._loadScript(scriptPath, scriptAlias, callback);
    },

    _loadScript : function(script_path, scriptAlias, callback) {
      var script  = document.createElement('script');
      script.type = 'text/javascript';
      script.src  = script_path + '?t=' + parseInt(new Date().getTime() / 1000);
      if(typeof callback != "undefined" && callback != false)
        script.onload = function(){
          Art.Loader._internalScriptLoadCallback(scriptAlias, callback);
        };

      this.headDOMElement.appendChild(script);
    },

    _loadStyle : function(script_path, scriptAlias, callback) {
      var style  = document.createElement('link');
      style.rel = 'stylesheet';
      style.href  = script_path + '?t=' + parseInt(new Date().getTime() / 1000);
      if(typeof callback != "undefined" && callback != false)
        style.onload = function(){
          Art.Loader._internalScriptLoadCallback(scriptAlias, callback);
        };

      this.headDOMElement.appendChild(style);
    },

    _internalScriptLoadCallback : function(scriptAlias, callback) {
      Art.Loader.loadedScripts[Art.Loader.loadedScripts.length] = scriptAlias;
      callback.call();
    }
  },

  Router    : {
    defaultAction                 : 'indexAction',
    _defaultControllerName        : '',
    _defaultControllerActionName  : 'indexAction',
    _errorControllerName          : '',
    _errorControllerActionName    : 'indexAction',
    _controllerList       : {},
    _controllerFileList   : {},
    _routeList            : {},

    hasController : function(controller_name) {
      return this.getController(controller_name) != false;
    },

    getController : function(controller_name) {
      return typeof this._controllerList[controller_name] == "undefined" ? false : this._controllerList[controller_name];
    },

    getControllerFilePath    : function(controller_name) {
      return typeof this._controllerFileList[controller_name] == "undefined" ?
                    false : this._controllerFileList[controller_name];
    },

    getDefaultControllerName : function() {
      return this._defaultControllerName;
    },

    getDefaultControllerActionName : function() {
      return this._defaultControllerActionName;
    },

    getErrorControllerName : function() {
      return this._errorControllerName;
    },

    getErrorControllerActionName : function() {
      return this._errorControllerActionName;
    },

    hasRoute : function(route) {
      return this.getRoute(route) != false;
    },

    getRoute : function(route) {
      return typeof this._routeList[route] == "undefined" ? false : route;
    },

    registerControllerFileList : function(controller_file_list) {
      this._controllerFileList = controller_file_list;
    },

    /**
     * Route the default controller
     * @param default_controller
     */
    setDefaultController : function(default_controller) {
      var defaultControllerName       = '',
          defaultControllerActionName = this._defaultControllerActionName;

      if(default_controller.indexOf('@') != -1) {
        defaultControllerName       = default_controller.slice(0, default_controller.indexOf('@'));
        defaultControllerActionName = default_controller.slice(default_controller.indexOf('@'));
      } else {
        defaultControllerName = default_controller;
      }

      this._defaultControllerName       = defaultControllerName;
      this._defaultControllerActionName = defaultControllerActionName;
    },

    /**
     * Route the error controller
     * @param error_controller
     */
    setErrorController   : function(error_controller) {
      var errorControllerName       = '',
          errorControllerActionName = this._errorControllerActionName;

      if(error_controller.indexOf('@') != -1) {
        errorControllerName       = error_controller.slice(0, error_controller.indexOf('@'));
        errorControllerActionName = error_controller.slice(error_controller.indexOf('@'));
      } else {
        errorControllerName = error_controller;
      }

      this._errorControllerName       = errorControllerName;
      this._errorControllerActionName = errorControllerActionName;
    },

    /**
     * Route a list of controllers
     * @param information
     */
    routeControllers : function(information) {
      for(var controllerName in information)
        this.routeController(controllerName, information[controllerName]);
    },

    /**
     * Route a single controller
     * @param controllerName
     * @param controllerObjectName
     */
    routeController : function(controllerName, controllerObjectName) {
      this._controllerList[controllerName] = controllerObjectName;
    },

    /**
     * Route the whole application
     * @param information = {
     *                        "controllers" : {},
     *                        "default"     : "",
     *                        "error        : ""
     *                      }
     */
    routeJSONObject : function(information) {
      this.routeControllers(information.controllers);
      this.setDefaultController(information.default);
      this.setErrorController(information.error);
    }
  },

  Request : {
    paramListString   : '',
    baseUrl           : '',
    currentController : '',
    currentAction     : '',
    currentControllerName : '',
    currentActionName     : '',

    init : function() {
      this._setBaseURL();
      this.setCurrentRequestInformation();
    },

    getCurrentURL : function() {
      return window.location.protocol + "//" + (window.location.host + "/" + window.location.pathname).replace('//', '/');
    },

    getBaseURL    : function() {
      if(this.baseUrl == '')
        this._setBaseURL();

      return this.baseUrl;
    },

    setCurrentRequestInformation : function() {
      this._prepareCurrentRequest();

      if(this.paramListString == '') {
        this.currentController = Art.Router.getDefaultControllerName();
        this.currentAction     = Art.Router.getDefaultControllerActionName();
        return;
      }

      if(Art.Router.hasController(this.paramListString)) {
        this.currentController = Art.Router.getController(this.paramListString);
        this.currentAction     = Art.Router.defaultAction;
        return;
      }

      var controllerName    = this.paramListString.slice(0, this.paramListString.indexOf('/')),
          controllerAction  = this.paramListString.slice(this.paramListString.indexOf('/') + 1);

      if(Art.Router.hasController(controllerName)) {
        this.currentController = Art.Router.getController(controllerName);
        this.currentAction     = controllerAction + 'Action';
        return;
      }

      this.currentController = Art.Router.getErrorControllerName();
      this.currentAction     = Art.Router.getErrorControllerActionName();
    },

    _setBaseURL : function() {
      var baseInformation = document.getElementsByTagName('base');

      if(typeof baseInformation[0] != "undefined") {
        this.baseUrl = baseInformation[0].getAttribute('href');
      } else {
        alert('Art.js requires the base href tag to be set, include this in the head : <base href="' + this.getCurrentURL() + '"/>');
      }
    },

    _prepareCurrentRequest : function() {
      this.paramListString = this.getCurrentURL().replace(this.baseUrl, '').trim();
    },

    redirect : function(path) {
      if(typeof window.history.pushState == "undefined" || 1 == 1) {
        window.location = path;
        return;
      }

      window.history.pushState({}, "", path);
      Art._dispatchRequestAndBootstrapApplication();
    }

  },

  Bootstrap : {
    currentController     : {},

    init : function() {
      Art.EventManager.listenEvent('artOnCurrentControllerLoaded', Art.Bootstrap, '_onCurrentControllerLoad');
      Art.EventManager.listenEvent('artOnViewDisplayed', Art.Bootstrap, '_onCurrentViewDisplay');

      this.loadCurrentController();
    },

    loadCurrentController : function() {
      Art.Loader.loadScript(
          Art.Router.getControllerFilePath(Art.Request.currentController),
          Art.Request.currentController,
          function() {
            Art.EventManager.triggerEvent('artOnCurrentControllerLoaded');
          }
      );
    },

    _onCurrentControllerLoad : function() {
      Art.Bootstrap.currentController = eval(Art.Request.currentController);

      if(typeof Art.Bootstrap.currentController[Art.Request.currentAction] == "undefined") {
        Art.Bootstrap.currentController = eval(Art.Router.getErrorControllerName());
      }

      if(typeof Art.
                Bootstrap.
                currentController['_onViewLoad' + Art.String.ucFirst(Art.Request.currentAction)]
                  == "function")
        Art.Bootstrap.currentController['_onViewLoad' + Art.String.ucFirst(Art.Request.currentAction)].call();

      Art.View.init();
    },

    _onCurrentViewDisplay : function() {
      if(typeof Art.Bootstrap.currentController.init == "function")
        Art.Bootstrap.currentController.init();

      Art.Bootstrap.currentController[Art.Request.currentAction].call();
    }

  },

  View : {

    domHelper     : {
      applicationContainer : false
    },
    displayLayout : true,
    layoutContent : '',
    viewContent   : '',
    viewPath      : '',
    layoutPath    : '',
    _hasInit      : false,

    setApplicationContainer : function(container) {
      if(this._hasInit) {
        alert('View will not allow setting an application container after Application Load');
        return;
      }

      if(typeof container == "object") {
        this.domHelper.applicationContainer = container;
      } else if(typeof container == "string") {
        if(container.charAt(0) == '#')
          this.domHelper.applicationContainer = document.getElementById(container.slice(1));
        else
          this.domHelper.applicationContainer = document.getElementsByTagName(container)[0];
      } else {
        alert('Container of type' + (typeof container) + ' has been passed to Art.View.setApplicationContainer, which is invalid');
      }
    },

    init : function() {
      // We have no set container, I guess we're going to use <body>
      if(this.domHelper.applicationContainer == false)
        this.domHelper.applicationContainer = document.getElementsByTagName('body')[0];

      Art.EventManager.listenEvent('artOnAjaxLayoutGetSuccess', Art.View, '_ajaxGetLayoutContentOk');
      Art.EventManager.listenEvent('artOnAjaxLayoutGetError', Art.View, '_ajaxGetLayoutContentError');

      Art.EventManager.listenEvent('artOnAjaxViewGetSuccess', Art.View, '_ajaxGetViewContentOk');
      Art.EventManager.listenEvent('artOnAjaxViewGetError', Art.View, '_ajaxGetViewContentError');

      this.viewPath   = 'application/view/' +
                          Art.Request.currentController.slice(0, -10) +
                          '/' +
                          Art.Request.currentAction.slice(0, -6) +
                          '.html';
      this.layoutPath = 'application/layout/layout.html';

      this._setCurrentLayout();
      this._hasInit = true;
    },

    _setCurrentLayout : function() {
      if(this.layoutContent == '')
        Art.AJAX.getContent({
          'path'            : this.layoutPath,
          'onSuccessEvent'  : 'artOnAjaxLayoutGetSuccess',
          'onErrorEvent'    : 'artOnAjaxLayoutGetError'
        });
      else
        Art.EventManager.triggerEvent('artOnAjaxLayoutGetSuccess', this.layoutContent);
    },

    _ajaxGetLayoutContentOk : function(content) {
      Art.View.layoutContent = content;

      Art.AJAX.getContent({
        'path'            : this.viewPath,
        'onSuccessEvent'  : 'artOnAjaxViewGetSuccess',
        'onErrorEvent'    : 'artOnAjaxViewGetError'
      });
    },

    _ajaxGetLayoutContentError : function(status) {
      alert('Error: ' + status + ' . Layout Not Found');
    },

    _ajaxGetViewContentOk : function(content) {
      Art.View.viewContent = content;

      Art.View.domHelper.applicationContainer.innerHTML = (this.displayLayout == true ?
                                            this.layoutContent.replace('[viewContent]', Art.View.viewContent) :
                                            Art.View.viewContent);

      // Set back to default state
      this.displayLayout = true;

      Art.EventManager.triggerEvent('artOnViewDisplayed');
    },

    _ajaxGetViewContentError : function(status) {
      alert('Error: ' + status + ' . View Not Found');
    }

  },

  EventManager : {

    eventList : {},

    init : function() {

    },

    registerEvent : function(event_identifier) {
      this.eventList[event_identifier] = [];
    },

    unRegisterEvent : function(event_identifier) {
      if(typeof this.eventList[event_identifier] != "undefined")
        delete this.eventList[event_identifier];
    },

    triggerEvent  : function(event_identifier, data) {
      data = typeof data != "undefined" ? data : {};

      if(typeof this.eventList[event_identifier] != "undefined") {
        var currentEventInformation = this.eventList[event_identifier];

        for(var currentListenerIndex in currentEventInformation) {
          var currentListener       = currentEventInformation[currentListenerIndex],
              currentListenerMethod = currentListener['method'];

          currentListener.object[currentListenerMethod].call(currentListener.object, data);
        }
      }
    },

    listenEvent : function(event_identifier, object, method) {
      if(typeof this.eventList[event_identifier] == "undefined")
        this.registerEvent(event_identifier);

      this
        .eventList[event_identifier]
                  [this.eventList[event_identifier].length]
        = {
        'object' : object,
        'method' : method
      }
    }
  },

  ComponentManager : {
    _map                    : {},
    _components             : {},
    _componentCollectionMap : {},
    _activeComponents       : 0,

    init : function() {
      this._runAllComponents();
    },

    _runAllComponents : function() {
      var objectInstance = this,
          componentDomObjects = document.querySelectorAll('[data-component]');

      for(var i = 0; i < componentDomObjects.length; i++)
        objectInstance.runComponentFromDOMElement(
            componentDomObjects.item(i)
        );
    },

    hasComponent : function(component_id) {
      return typeof this._buildComponents[component_id] == "undefined" ? false : true;
    },

    getComponent : function(component_id) {
      return this._buildComponents[component_id];
    },

    runComponentFromDOMElement : function(element) {
      this._activeComponents++;

      var information = Art.DOM.getElementAttributesRelational(element, 'data-component'),
          componentInformation = {};

      componentInformation.container_dom = element;
      componentInformation.component_id  = this._activeComponents;

      for(var informationKey in information)
        if(informationKey.length > 'data-component'.length)
          componentInformation[information.replace('data-component', '')] = information[informationKey];

      this.runComponent(information['data-component'], componentInformation);
    },

    _setComponentInCollection : function(component_id, component_name) {
      if(typeof this._componentCollectionMap[component_name] != "object")
        this._componentCollectionMap[component_name] = [];

      this._componentCollectionMap[component_name][this._componentCollectionMap[component_name].length] = component_id;
    },

    fetchComponentInComponentCollection : function(component_name) {
      if(typeof component_name == "string")
        return this._componentCollectionMap[component_name];

      var objectInstance = this,
          information = [];

      $.each(component_name, function(key, name){
        if(typeof objectInstance._componentCollectionMap[name] != "undefined")
          information = information.concat(objectInstance._componentCollectionMap[name])
      });


      return information;
    },

    runComponent : function(component_name, params) {
      if(typeof Art.ComponentManager._map[component_name] == "object")
        Art.Loader.loadScript(
            Art.ComponentManager._map[component_name].file,
            'component-' + component_name,
            function(){
              var componentLibraryName = eval(Art.ComponentManager._map[component_name].handler),
                  objectClone = Art.JSON.merge(componentLibraryName, {});

              if(typeof objectClone.init != "undefined")
                objectClone.init(params);
            }
        );
    },

    addComponent : function(
          name,
          file_path,
          library_name
        ) {
      this._map[name] = {
          file    : file_path,
          handler : library_name
      };


      this._runAllComponents();
    }
  },

  init : function() {
    this.Loader.init();
    this.EventManager.init();
  },

  _dispatchRequestAndBootstrapApplication : function() {
    this.Request.init();
    this.Bootstrap.init();
  },

  runApplication : function() {
    this.EventManager.listenEvent('artOnViewDisplayed', Art.ComponentManager, 'init');
    this._dispatchRequestAndBootstrapApplication();
  },

  /**
   * @property Art.Request.redirect
   * @param path
   */
  redirect : function(path) {
    this.Request.redirect(path);
  }
};
