var express = require('express');
var router  = express.Router();
const util  = require('node:util');

const CategoryModel  = require(__path_models + 'category');
const UsersModel     = require(__path_models + 'users');
// const ValidateGruops = require(__path_validates + 'groups');
const utilsHelpers   = require(__path_helpers + 'utils');
const ParamsHelpers  = require(__path_helpers + 'params');

const systemConfig   = require(__path_configs + 'system');
const notify         = require(__path_configs + 'notify');

const { check, validationResult } = require('express-validator');
const linkIndex                   = '/' + systemConfig.prefixAdmin + '/category/';

const pageTitleIndex  = 'Category Management';
const pageTitleAdd    = pageTitleIndex + ' - Add';
const pageTitleEdit   = pageTitleIndex + ' - Edit';

const folderView      = __path_views_admin + 'pages/category/';


/* GET home page. */
router.get('(/status/:status)?', async (req, res, next) => {
  let params = {};
  params.keyword       = ParamsHelpers.getParam(req.query, 'keyword', '');
  params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
  params.sortField     = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
  params.sortType      = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');

  params.pagination = {
    totalItems: 1,
    totalItemsPerPage: 5,
    currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
    pageRanges: 3
  };

  let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'category');

  await CategoryModel.countCategory( params ).then((data) => {
    params.pagination.totalItems = data;
  })
  // console.log(pagination.totalGroups)
  CategoryModel
    .listCategory(params)
    .then((categories) => {
      res.render(`${folderView}list`,
        {
          pageTitle: pageTitleIndex,
          categories,
          statusFilter,
          params
        });
    });
});


 

/* Change status. */
router.get('/change-status/:id/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '');

  CategoryModel.changeStatus(id, currentStatus, {task:"update-one"}).then((result) =>{
    req.flash('success', util.format(notify.UPDATE_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  })
});


/* Change status - Multi */
router.post('/change-status/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  CategoryModel.changeStatus(req.body.cid, currentStatus, {task:"update-multi"}).then((result)=>{
    req.flash('success', util.format(notify.UPDATE_MUITI_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  });
});

/* Change ordering - Multi */
router.post('/change-ordering', (req, res, next) => {
  let cids = req.body.cid;
  let orderings = req.body.ordering;
  CategoryModel.changeOrdering(cids ,orderings, null).then((result) =>{
    req.flash('success', notify.UPDATE_ORDERING);
    res.redirect(linkIndex);
  });
});

/* Delete */
router.get('/delete/:id', (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  CategoryModel.deleteCategory(id, {task:"delete-one"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});

/* Delete */
router.post('/delete', (req, res, next) => {
  CategoryModel.deleteCategory(req.body.cid, {task:"delete-multi"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});


/* Add group. */
router.get(('/form(/:id)?'), (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let category = { name: '', ordering: 0, status: 'novalue' };
  let errors = null;
  if (id === '') {
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd, category, errors });
  } else {
    CategoryModel.getCategory(id).then((category) => {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit, category, errors });
    });
  }

  // req.flash('success', 'hehee');
  // res.send('Test Flash');
  // res.end();

});



/* Add Edit*/
router.post('/save', async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));

  const options = {
    name: { min: 5, max: 20 },
    ordering: { min: 0, max: 100 },
    status: { value: "novalue" },
    content: {min: 5, max: 200}
  }

  await check('name', util.format(notify.ERROR_NAME, options.name.min, options.name.max)).isLength({ min: options.name.min, max: options.name.max }).run(req);
  await check('ordering', util.format(notify.ERROR_ORDERING, options.ordering.min, options.ordering.max)).isInt({ gt: options.ordering.min, lt: options.ordering.max }).run(req);
  await check('status').custom((value) => {
    if (value == options.status.value) {
      throw new Error(util.format(notify.ERROR_STATUS));
    }
    else {
      return value;
    }
  }).run(req);
  await check('content', util.format(notify.ERROR_CONTENT, options.content.min, options.content.max)).isLength({ min: options.content.min, max: options.content.max }).run(req);
  await check('slug', util.format(notify.ERROR_SLUG)).notEmpty().run(req);


  let category = Object.assign(req.body);
  let errors = await validationResult(req);
  let taskCurrent = (typeof category !== "undefined" && category.id !== "") ? "edit" : "add";
  
  if (errors.isEmpty() === false) {
    let pageTitle = (taskCurrent == "add") ? pageTitleAdd :  pageTitleEdit;
    res.render(`${folderView}form`, { pageTitle, category, errors });

  } else { 
    let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.UPDATE_SUCCESS;
    CategoryModel.saveCategory(category, {task: taskCurrent}).then((result) => {
      if(taskCurrent == "add"){
        req.flash('success', message);
        res.redirect(linkIndex);
      }
      else if(taskCurrent == "edit"){
        UsersModel.saveUser(category, {task: 'change-group-name'}).then((result) => {
          req.flash('success', notify.UPDATE_SUCCESS);
          res.redirect(linkIndex);
        });
      }

    })
  }

});


// SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
  let sortField = ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
  let sortType  = ParamsHelpers.getParam(req.params, 'sort_type', 'asc');
  
  req.session.sort_field = sortField;
  req.session.sort_type  = sortType;

  res.redirect(linkIndex);

});



module.exports = router;
