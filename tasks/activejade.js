
'use strict';

var chalk = require('chalk');
var activejade = require('activejade');

module.exports = function(grunt) {

    // content conversion for templates
    var defaultProcessContent = function (content) {
        return content;
    };

    // filename conversion for templates
    var defaultProcessName = function (name) {
        return name.replace('.jade', '');
    };

    grunt.registerMultiTask('activejade', 'Compile activejade templates.', function () {
        var options = this.options({
            namespace: 'JST',
            separator: grunt.util.linefeed + grunt.util.linefeed
        });

        var nsInfo;
//
//        if (options.namespace !== false) {
//            nsInfo = lib.getNamespaceDeclaration(options.namespace);
//        }

        var processContent = options.processContent || defaultProcessContent;
        var processName = options.processName || defaultProcessName;

        this.files.forEach(function (f) {
            var templates = [];

            f.src.filter(function (filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                }

                return true;
            }).forEach(function (filepath) {
                var src = processContent(grunt.file.read(filepath), filepath);
                var compiled, filename;
                filename = processName(filepath);

                options.filename = filepath;

                try {
                    f.orig.activejade = activejade;
                    compiled = activejade.compile(src, options);
                } catch (e) {
                    grunt.log.error(e);
                    grunt.fail.warn('Jade failed to compile "' + filepath + '".');
                    return false;
                }

                if (options.callback) {
                    templates.push(options.callback + '(' + JSON.stringify(filename) + ', ' + compiled + ');\n');
                } else {
                    templates.push(compiled);
                }
            });

            var output = templates;

            if (output.length < 1) {
                grunt.log.warn('Destination not written because compiled files were empty.');
            } else {
                if (options.client) {
                    if (options.node) {
                        var nodeExport = 'if (typeof exports === \'object\' && exports) {';
                        nodeExport += 'module.exports = ' + nsInfo.namespace + ';}';

                        output.push(nodeExport);
                    }
                }

                grunt.file.write(f.dest, output.join(grunt.util.normalizelf(options.separator)));
                grunt.verbose.writeln('File ' + chalk.cyan(f.dest) + ' created.');
            }
        });

        grunt.log.ok(this.files.length + ' ' + grunt.util.pluralize(this.files.length, 'file/files') + ' created.');
    });
}
