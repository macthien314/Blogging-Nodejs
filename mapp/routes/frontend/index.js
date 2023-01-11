var express = require('express');
var router = express.Router();

const middleGetUserInfo = require(__path_middleware + 'get-user-info');
const middleGetCategoryForMenu = require(__path_middleware + 'get-category-for-menu');
const middleArticleRandom = require(__path_middleware + 'get-article-random');

router.use('/auth', require('./auth'));
router.use('/', middleGetUserInfo, middleGetCategoryForMenu,middleArticleRandom, require('./home'));
router.use('/category', require('./category'));
router.use('/post', require('./post'));
router.use('/about', require('./about'));
router.use('/contact', require('./contact'));
router.use('/article', require('./article'));




module.exports = router;
