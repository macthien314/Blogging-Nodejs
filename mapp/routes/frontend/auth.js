var express = require('express');
var router = express.Router();
const util = require('node:util');

const StringHelpers 	= require(__path_helpers + 'string');
const systemConfig  = require(__path_configs + 'system');





const { check, validationResult } = require('express-validator');
const notify         = require(__path_configs + 'notify');

const folderView	= __path_views_blog + 'pages/auth/';
const layoutLogin   = __path_views_blog + 'login';
const layoutBlog   	= __path_views_blog + 'frontend';
const layoutAdmin  	= __path_views_admin + 'backend';

const linkIndex		= StringHelpers.formatLink('/' + systemConfig.prefixBlog + '/'); 
const linkLogin		= StringHelpers.formatLink('/' + systemConfig.prefixBlog + '/auth/login/'); 

const middleGetCategoryForMenu = require(__path_middleware + 'get-category-for-menu');
const middleArticleRandom = require(__path_middleware + 'get-article-random');
const middleGetUserInfo = require(__path_middleware + 'get-user-info');

var passport = require('passport');


/* GET logout page. */
router.get('/logout', function(req, res, next) {
	req.logout(()=>{});
	res.redirect(linkIndex);
});

/* GET login page. */
router.get('/login', function(req, res, next) {
    if(req.isAuthenticated()) res.redirect(linkIndex);
	let item	= {email: '', 'password': ''};
	let errors   = null;
	res.render(`${folderView}login`, { layout: layoutLogin, errors, item });
});


/* GET dashboard page. */
router.get('/no-permission', middleGetCategoryForMenu, middleArticleRandom, middleGetUserInfo, function(req, res, next) {
	res.render(`${folderView}no-permission`, { layout: layoutBlog, top_post:false});
});


/* POST login page. */
router.post('/login', async function(req, res, next) {
    if(req.isAuthenticated()) res.redirect(linkIndex);
    req.body = JSON.parse(JSON.stringify(req.body));
    const options = {
        username: { min: 5, max: 20 },
        password: {min: 5, max : 20}
        }

    await check('username', util.format(notify.ERROR_NAME, options.username.min, options.username.max)).isLength({ min: options.username.min, max: options.username.max }).run(req);
    await check('password', util.format(notify.ERROR_NAME, options.password.min, options.password.max)).isLength({ min: options.password.min, max: options.password.max }).run(req);




	let item 	= Object.assign(req.body);
    let errors = await validationResult(req);

	if(errors.isEmpty() == false) { 
		res.render(`${folderView}login`, {  layout: layoutLogin, item, errors });
	}else {
        console.log('ok')
        passport.authenticate('local', {
            successRedirect: linkIndex,
            failureRedirect: linkLogin,
            failureFlash: true
        })(req, res, next);
		// passport.authenticate('local', { 
		// 	successRedirect: linkIndex,
		// 	failureRedirect: linkLogin,
		// 	failureFlash: true
        // })(req, res, next);
	}
});



module.exports = router;
