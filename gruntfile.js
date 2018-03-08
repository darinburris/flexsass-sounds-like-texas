/**
 * @module grunt
 * @description exports Grunt config and tasks
 * @author Darin Burris
 * [Built using Grunt, The JavaScript Task Runner]{@link http://gruntjs.com/}
 */
module.exports = function(grunt) {
	'use strict';
	var chalk = require('chalk');
	// Load grunt tasks
	require('load-grunt-tasks')(grunt);
	const flexConfig = grunt.file.readJSON('flexsass-config.json');
	// Project configuration.
	grunt.initConfig(
		{

		/**
		 * @description grunt include task recursively includes static html files into each other ******************
		**/
		includes: {
			build: {
				cwd: 'source',
				src: [ '*.html', '**/*.html' ],
				dest: 'release/',
				options: {
					flatten: true,
					includePath: 'source',
					includeRegexp: /^(\s*)<include\s+file="(\S+)"\s*\/>$/,
					banner: ''
				}
			}
		},
		/**
		* @description  grunt task compiles sass files, copies them into a pre release
		* folder under /source/ in order to allow for linting prior to
		* minification/concatination
		**/
		sass: {
			dist: {
				files: [
					{
						expand: true,
						cwd: './source',
						src: ['**/*.scss'],
						dest: './release',
						ext: '.css',
						sourcemap: 'auto',
						style: 'expanded'
					}
				]
			},
			watching: {
				files: [
					{
						expand: true,
						cwd: './source',
						src: ['**/*.scss'],
						dest: './release/',
						ext: '.css',
						sourcemap: 'auto'
					}
				]
			}
		},
		/**
		 * @description grunt task lints scss files
		 */
		sasslint: {
			options: {
				configFile: '.sass-lint.yml',
			},
			target: [
				'source/sass/**/*.scss',
				'!source/sass/02_tools/_diagnostic.scss',
				'!source/sass/02_tools/_rem.scss',
				'!source/sass/03_generic/_normalize.scss',
				'!source/sass/07_utilities/_access-scss.scss'
			]
		},
		/**
		 *  @description grunt task copies source code into release folder
		 */
		copy: {
			buildHTML: {
				files: [{
					expand: true,
					cwd: './source',
					src: [
						'**/*.html',
						'!/includes'
					],
					dest: './release'
				}]
			},
			buildIMG: {
				files: [{
					expand: true,
					cwd: './source',
					src: [
						'**/*.jpg',
						'**/*.gif',
						'**/*.png'
					],
					dest: './release'
				}]
			},
			buildJS: {
				files: [{
					expand: true,
					cwd: './source',
					src: [
						'**/*.js'
					],
					dest: './release'
				}]
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: './source/',
						src: ['**/*.html', 'css/**/*.css'],
						dest: './release/'
					}
				]
			},
			reports: {
				files: [
					{
						expand: true,
						cwd: './',
						src: 'reportsBaseFiles/*',
						dest: 'reports/views',
						flatten: true,
						filter: 'isFile'
					}
				]
			}
		},
		rename: {
			sass: {
				files: [
					{
						src: [
							'./release/sass'
						],
						dest: './release/css'
					},
				]
			}
		},

		/**
		 * @description grunt task deletes specific, non-release files after build
		 */
		clean: {
			preRelease: ['./release'],
			postRelease: [
				'./release/includes'
			],
			cssRelease: ['./release/css'],
			reports: ['./reports/']
		},
		/**
		 * @description grunt task performs a number of string replacement actions on various files
		 */
		replace: {
			localize: {
				options: {
					patterns: [{
						match: 'langCntry',
						replacement: flexConfig.base.langCntry,
						expression: true
					}, {
						match: 'direction',
						replacement: flexConfig.base.direction,
						expression: true
					}]
				},
				files: [{
					expand: true,
					cwd: flexConfig.base.releaseDir,
					flatten: false,
					src: ['**/*.html', '!js', '!css'],
					dest: flexConfig.base.releaseDir
				}]
			},
			toc: {
				options: {
					patterns: [{
						match: '<!--toc-->',
						replacement: function() {
							return grunt.config.get('tocData');
						}
					}]
				},
				files: [{
					expand: true,
					cwd: flexConfig.base.releaseDir,
					flatten: true,
					src: ['**/*.html'],
					dest: flexConfig.base.releaseDir
				}]
			}
		},
		/**
		 *  @description grunt task propmts user for desired template during tempGen custom template generation task
		 */
		prompt: {
			temps: {
				options: {
					questions: [{
						config: 'echo.templatesList', // arbitray name or config for any other grunt task
						type: 'list', // list, checkbox, confirm, input, password
						message: 'Please choose a template type', // Question to ask the user, function needs to return a string,
						choices: flexConfig.templating.choices
					}],
					then: function(results) {
						var choice = '';
						for (var key in results) {
							if (key === 'length' || !results.hasOwnProperty(key)) {
								continue;
							}
							choice = results[key];
						}
						grunt.config.set('chosenTemplate', choice);
						grunt.task.run('tempCreate');
					}
				}
			}
		},
		/**
		 * @description grunt task watches to changes to files in /source and copies them into /release
		 */
		watch: {
			scss: {
				files: [
					'./source/sass/**/*.scss'
				],
				tasks: ['clean:cssRelease','sass:watching','sasslint','rename:sass'],
				options: {
					spawn: false
				}
			},
			js: {
				files: [
					'./source/js/**/*'
				],
				tasks: ['eslint','mochaTest'],
				options: {
					spawn: true
				}
			},
			html: {
				files: [
					'./source/**/*.html'
				],
				tasks: ['copy:buildHTML'],
				options: {
					spawn: false
				}
			}
		}
	});

	/**
	 * @description This task omits the ccsmin and uglify tasks for debugging purposes, includes JSDoc
	 */
	grunt.registerTask(
		'default',
		'This task omits the ccsmin and uglify tasks for debugging purposes',
		function() {
			grunt.config.set('taskName', this.name);
			grunt.task.run(
				[
					"clean:preRelease",
					"copy:buildHTML",
					"copy:buildIMG",
					"copy:buildJS",
					"sasslint",
					"sass:dist",
					"rename:sass",
					"includes",
					"replace:localize",
					"clean:postRelease",
					"genTOC"
				]
			);
		}
	);

		//The following are custom registered tasks
	/**
	 * @description Parent task for generating tempalate files based on a pre-defined list of available template types.
	 */
	grunt.registerTask(
		'tempGen',
		'Parent task for generating tempalate files based on a pre-defined list of available template types.',
		function() {
			var flexsassConfig = require('./flexsass-config.json'),
				error = chalk.bgRed.white,
				templateToMake = grunt.option('tempName') || null,
				walk = require('walkdir'),
				source = 'source',
				cwd = process.cwd();
			grunt.config.set('templateToMake', templateToMake);
			grunt.config.set('gotoPrompt', true);
			if ((!templateToMake) || (templateToMake === null) || (templateToMake === true)) {
				console.log(error('Please provide a path and file name using --tempName=path/and/filename(no extension)'));
				console.log(error('To create a template at root level, simply provide the file name (no extension) --tempName=filename'));
				return;
			}
			walk.sync(source, function(wpath) {
				var extPos = wpath.lastIndexOf('.'),
					ext = wpath.substring(extPos),
					currFile = cwd + '/' + source + '/' + templateToMake + ext;
				if (currFile === wpath) {
					console.log(error('ERROR: You have chosen a template that already exists.\nPlease choose a different name.'));
					grunt.config.set('gotoPrompt', false);
					return;
				}
			});
			if (grunt.config.get('gotoPrompt') === true) {
				grunt.config.set('templateChoices', flexConfig.templating.choices);
				grunt.task.run('prompt:temps');
			}
		}
	);
	/**
	 * @description This task is a follow-up task that generates templates based on the user selected tamplate type.
	 */
	grunt.registerTask('tempCreate', 'This task is a follow-up task that generates templates based on the user selected tamplate type.', function() {
		var choice = grunt.config.get('chosenTemplate'),
			extPos = choice.lastIndexOf('.'),
			ext = choice.substring(extPos),
			tempsPath = flexConfig.base.templateBaseFiles,
			templateToMake = grunt.config.get('templateToMake'),
			fsx = require('fs-extra'),
			source = flexConfig.base.sourceDir,
			templatePath = templateToMake,
			tempName = '';
		if (templatePath.indexOf('/') > 0) {
			templatePath = templateToMake.split('/');
			tempName = templatePath[templatePath.length - 1];
			templatePath = templatePath.join('/');
			templatePath = templatePath.replace(tempName, '');
			templatePath = source + '/' + templatePath;
			fsx.mkdirsSync(templatePath);
			fsx.copySync(tempsPath + '/' + choice, templatePath + '/' + choice);
			fsx.renameSync(templatePath + choice, templatePath + tempName + ext);
		} else {
			fsx.copySync(tempsPath + '/' + choice, source + '/' + choice);
			fsx.renameSync(source + '/' + choice, source + '/' + templatePath + ext);
		}
	});
	/**
	 * @description Task that generates a table of contents from the current file list Then injects this list into the index.html file
	 */
	grunt.registerTask(
		'genTOC',
		'Task that generates a table of contents from the current file list\nThen injects this list into the index.html file',
		function() {
			var flexConfig = grunt.file.readJSON('flexsass-config.json'),
				fs = require('fs'),
				walk = require('walkdir'),
				cheerio = require('cheerio'),
				source = flexConfig.base.releaseDir,
				fnames = [],
				titles = [],
				paths = [],
				TOC,
				parentTask = grunt.config.get('taskName');
			/**
			walk directory and return array of all .html files
			create arrays to hold...
			file names,
			<title></title> values for displaying in TOC list,
			full paths for each file returned
			*/
			walk.sync(source, function(path) {
				if ((path.substr(-5) === '.html') && (path.indexOf('release/index.html') === -1) && (path.indexOf('includes') === -1) && (path.indexOf('bower_components') === -1)) {
					var DOM = fs.readFileSync(path, 'utf8'),
						currFile = path.split('/'),
						fname = currFile.slice(-1)[0],
						$ = cheerio.load(DOM),
						title = $('title').text();
					titles.push(title);
					fnames.push(fname);
					paths.push(path);
				}
			});
			var tocULStart = '<ul id="tocList" class="toc-list">',
				tocLI = '',
				tocULEnd = '</ul>';
			//gruntgenerate TOC from html files
			if (titles.length === fnames.length) {
				for (var i in titles) {
					var pathPos = paths[i].indexOf(flexConfig.base.releaseDir),
						fullPath = paths[i].substring(pathPos),
						path = fullPath.replace(flexConfig.base.releaseDir, ''),
						webPath = path.replace(/\\/g, '/');
					console.log(webPath);
					tocLI += '<li><a href="' + webPath + '">' + titles[i] + '</a></li>';
				}
				if ((parentTask === 'default') || (parentTask === undefined)) {
					var reportsLinks = grunt.file.read('source/includes/quality-toc.html');
					TOC = tocULStart + tocLI + tocULEnd + reportsLinks;
				} else {
					TOC = tocULStart + tocLI + tocULEnd;
				}
				grunt.config.set('tocData', TOC);
				grunt.task.run('replace:toc');
			}
		}
	);

};