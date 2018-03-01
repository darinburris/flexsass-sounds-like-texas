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
	// Project configuration.
	grunt.initConfig(
		{

		/**
		* @description  grunt task compiles sass files, copies them into a pre release
		* folder under /source/ in order to allow for linting prior to
		* minification/concatination
		**/
		sass: {
			options : {
				includePaths: require('node-bourbon').includePaths,
			},
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
				'source/scss/\*.scss'
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
					src: ['**/*.html'],
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
				'./source/css'
			],
			cssRelease: ['./release/css'],
			reports: ['./reports/']
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
				tasks: ['newer:copy:buildHTML'],
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
				['clean:preRelease', 'copy:buildHTML','sass:dist','rename:sass']//'rjsReplace', , 'jscs','clean:postRelease
			);
		}
	);

};