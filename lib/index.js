// Generated by CoffeeScript 1.8.0
var JadedBrunchPlugin, fs, localRequire, mkdirp, path, progeny, _;

fs = require('fs');

path = require('path');

mkdirp = require('mkdirp');

_ = require('lodash');

progeny = require('progeny');

localRequire = function(module) {
  var localError, modulePath, userError;
  try {
    modulePath = path.join(process.cwd(), 'node_modules', module);
    return require(modulePath);
  } catch (_error) {
    userError = _error;
    if (userError.code !== 'MODULE_NOT_FOUND') {
      throw userError;
    }
    try {
      return require(module);
    } catch (_error) {
      localError = _error;
      throw localError;
    }
  }
};

module.exports = JadedBrunchPlugin = (function() {
  JadedBrunchPlugin.prototype.brunchPlugin = true;

  JadedBrunchPlugin.prototype.type = 'template';

  JadedBrunchPlugin.prototype.extension = 'jade';

  JadedBrunchPlugin.prototype.jadeOptions = {};

  JadedBrunchPlugin.prototype.staticPath = 'public';

  JadedBrunchPlugin.prototype.projectPath = path.resolve(process.cwd());

  JadedBrunchPlugin.prototype.staticPatterns = /^app(\/|\\)(.+)\.static\.jade$/;

  JadedBrunchPlugin.prototype.extensions = {
    "static": 'html',
    client: 'js'
  };

  function JadedBrunchPlugin(config) {
    this.config = config;
    this.configure();
    this.getDependencies = progeny({
      rootPath: this.config.paths.root
    });
  }

  JadedBrunchPlugin.prototype.configure = function() {
    var jadeModule, jadePath, key, options, patches, value, _base, _base1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    if (((_ref = this.config.plugins) != null ? _ref.jaded : void 0) != null) {
      options = ((_ref1 = this.config) != null ? (_ref2 = _ref1.plugins) != null ? _ref2.jaded : void 0 : void 0) || this.config.plugins.jade;
    } else if (((_ref3 = this.config.plugins) != null ? _ref3.jade : void 0) != null) {
      options = ((_ref4 = this.config) != null ? (_ref5 = _ref4.plugins) != null ? _ref5.jaded : void 0 : void 0) || this.config.plugins.jade;
    } else {
      options = {};
    }
    if (options.staticPatterns != null) {
      this.staticPatterns = options.staticPatterns;
    }
    if (options.path != null) {
      this.staticPath = options.path;
    } else if (((_ref6 = this.config.paths) != null ? _ref6["public"] : void 0) != null) {
      this.staticPath = this.config.paths["public"];
    }
    if (options.jade != null) {
      this.jadeOptions = options.jade;
    } else {
      this.jadeOptions = _.omit(options, 'staticPatterns', 'path', 'module', 'extension', 'clientExtension', 'patches');
    }
    if ((_base = this.jadeOptions).compileDebug == null) {
      _base.compileDebug = this.config.optimize === false;
    }
    if ((_base1 = this.jadeOptions).pretty == null) {
      _base1.pretty = this.config.optimize === false;
    }
    jadePath = path.dirname(require.resolve('jade'));
    this.include = [path.join(jadePath, 'runtime.js')];
    jadeModule = options.module || 'jade';
    this.jade = localRequire(jadeModule);
    if (options.extensions != null) {
      _ref7 = options.extensions;
      for (key in _ref7) {
        value = _ref7[key];
        this.extensions[key] = value;
      }
    }
    patches = options.patches || [];
    if (_.isString(patches)) {
      patches = [patches];
    }
    return patches.map((function(_this) {
      return function(patch) {
        var patchModule;
        console.log(patch);
        patchModule = localRequire(patch);
        return patchModule(_this.jade);
      };
    })(this));
  };

  JadedBrunchPlugin.prototype.makeOptions = function(data) {
    var locals;
    if (this.jadeOptions.locals != null) {
      locals = _.extend({}, this.jadeOptions.locals, data);
    } else {
      locals = data;
    }
    return _.extend({}, this.jadeOptions, {
      locals: data
    });
  };

  JadedBrunchPlugin.prototype.templateFactory = function(data, options, templatePath, callback, clientMode) {
    var e, error, method, template;
    try {
      if (clientMode === true) {
        method = this.jade.compileClient;
      } else {
        method = this.jade.compile;
      }
      template = method(data, options);
    } catch (_error) {
      e = _error;
      error = e;
    }
    return callback(error, template, clientMode);
  };

  JadedBrunchPlugin.prototype.compile = function(data, originalPath, callback) {
    var clientMode, options, pathTestResults, patterns, relativePath, successHandler, templatePath;
    templatePath = path.resolve(originalPath);
    if (!_.isArray(this.staticPatterns)) {
      patterns = [this.staticPatterns];
    } else {
      patterns = this.staticPatterns;
    }
    relativePath = path.relative(this.projectPath, templatePath);
    pathTestResults = _.filter(patterns, function(pattern) {
      return pattern.test(relativePath);
    });
    options = _.extend({}, this.jadeOptions);
    if (options.filename == null) {
      options.filename = relativePath;
    }
    successHandler = (function(_this) {
      return function(error, template, clientMode) {
        var extension, extensionStartIndex, matches, output, outputDirectory, outputPath, staticPath;
        if (error != null) {
          callback(error);
          return;
        }
        if (pathTestResults.length) {
          output = template();
          staticPath = path.join(_this.projectPath, _this.staticPath);
          matches = relativePath.match(pathTestResults[0]);
          if (clientMode) {
            extension = _this.extensions.client;
          } else {
            extension = _this.extensions["static"];
          }
          outputPath = matches[matches.length - 1];
          extensionStartIndex = outputPath.length - extension.length;
          if (outputPath.slice(extensionStartIndex) === extension) {
            outputPath = outputPath.slice(0, +(extensionStartIndex - 2) + 1 || 9e9);
          }
          outputPath = outputPath + '.' + extension;
          outputPath = path.join(staticPath, outputPath);
          outputDirectory = path.dirname(outputPath);
          return mkdirp(outputDirectory, function(err) {
            if (err) {
              return callback(err, null);
            } else {
              return fs.writeFile(outputPath, output, function(err, written, buffer) {
                if (err) {
                  return callback(err, null);
                } else {
                  return callback();
                }
              });
            }
          });
        } else {
          return callback(null, "module.exports = " + template + ";");
        }
      };
    })(this);
    clientMode = pathTestResults.length === 0;
    return this.templateFactory(data, options, templatePath, successHandler, clientMode);
  };

  return JadedBrunchPlugin;

})();
