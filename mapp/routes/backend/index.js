var express = require('express');
var router = express.Router();


const middleAuthentication = require(__path_middleware + 'auth');


router.use('/',middleAuthentication,  require('./home'));

router.use('/dashboard', require('./dashboard'));
router.use('/items', require('./item'));
router.use('/groups', require('./groups'));
router.use('/users', require('./users'));
router.use('/category', require('./category'));
router.use('/article', require('./article'));

module.exports = router;
