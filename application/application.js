var Application = {

  controllerFiles : {
    'indexController' : 'application/controller/indexController.js',
    'errorController' : 'application/controller/errorController.js'
  },

  router : {
    'controllers' : {
      'index' : 'indexController',
      'error' : 'errorController'
    },
    'default'  : 'indexController',
    'error'    : 'errorController'
  },

  init : function() {
    Art.Loader.loadScript("application/third-party/jquery.js", "jquery", Application._onjQueryLoaded);
  },

  _onjQueryLoaded : function() {
    Art.Loader.loadScripts(
        {
          "application/helper/functions.js"                                 : "application_functions",
          "//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" : 'bootstrap_css',
          "//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"   : 'bootstrap_js'
        },
        Application._onAssetsLoad
    );
  },

  _onAssetsLoad : function() {
    Application._runART();
  },

  _runART : function() {
    Art.Router.registerControllerFileList(this.controllerFiles);
    Art.Router.routeJSONObject(this.router);
    Art.runApplication();
  }

};