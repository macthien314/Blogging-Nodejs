var express = require('express');
var router = express.Router();
const util = require('node:util');

const ItemsModel = require(__path_models + 'items');
const ValidateItems = require(__path_validates + 'items');
const utilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');

const { check, validationResult } = require('express-validator');
const linkIndex = '/' + systemConfig.prefixAdmin + '/items/';

const pageTitleIndex = 'Item Management';
const pageTitleAdd = pageTitleIndex + ' - Add';
const pageTitleEdit = pageTitleIndex + ' - Edit';

const folderView = __path_views_admin + 'pages/item/';


/* List item */
router.get('(/status/:status)?', async (req, res, next) => {
  let params = {};


  params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
  params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
  params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
  params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');


  params.pagination = {
    totalItems: 1,
    totalItemsPerPage: 5,
    currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
    pageRanges: 3
  };

  let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'items');

  // if(currentStatus === 'all') {
  //   if(keyword !== "") objWhere={name: new RegExp(keyword , 'i')};
  // }
  // else {
  //   objWhere={status: currentStatus, name: new RegExp(keyword , 'i')};
  // }



  await ItemsModel.countItem(params).then((data) => {
    params.pagination.totalItems = data;
  })
  // console.log(pagination.totalItems)
  ItemsModel.listItem(params)
    .then((items) => {
      res.render(`${folderView}list`,
        {
          pageTitle: pageTitleIndex,
          items,
          statusFilter,
          params
        });
    });
});


/* Change status. */
router.get('/change-status/:id/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '');

  ItemsModel.changeStatus(id, currentStatus, {task:"update-one"}).then((result) =>{
    req.flash('success', util.format(notify.UPDATE_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  })
});

/* Change status - Multi */
router.post('/change-status/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
 
  ItemsModel.changeStatus(req.body.cid, currentStatus, {task:"update-multi"}).then((result)=>{
    req.flash('success', util.format(notify.UPDATE_MUITI_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  });
});

/* Change ordering - Multi */
router.post('/change-ordering', (req, res, next) => {
  let cids = req.body.cid;
  let orderings = req.body.ordering;
  ItemsModel.changeOrdering(cids ,orderings, null).then((result) =>{
    req.flash('success', `Cập nhật ordering thành công!`);
    res.redirect(linkIndex);
  });

});

/* Delete */
router.get('/delete/:id', (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  ItemsModel.deleteItem(id, {task:"delete-one"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});

/* Delete */
router.post('/delete', (req, res, next) => {
  ItemsModel.deleteItem(req.body.cid, {task:"delete-multi"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});


/* Add item. */
router.get(('/form(/:id)?'), (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let item = { name: '', ordering: 0, status: 'novalue' };
  let errors = null;
  if (id === '') {
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors });
  } else {
    ItemsModel.getItem(id).then((item) => {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors });
    });
  }

  // req.flash('success', 'hehee');
  // res.send('Test Flash');
  // res.end();

});



/* Add */
router.post('/save', async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));

  const options = {
    name: { min: 6, max: 20 },
    ordering: { min: 0, max: 100 },
    status: { value: "novalue" },
    content: { min: 5, max: 200 }
  }
  await check('name', util.format(notify.ERROR_NAME, options.name.min, options.name.max)).isLength({ min: options.name.min, max: options.name.max }).run(req);
  await check('ordering', util.format(notify.ERROR_ORDERING, options.ordering.min, options.ordering.max)).isInt({ gt: options.ordering.min, lt: options.ordering.max }).run(req);
  await check('content', util.format(notify.ERROR_NAME, options.content.min, options.content.max)).isLength({ min: options.content.min, max: options.content.max }).run(req);
  await check('status').custom((value) => {
    if (value == options.status.value) {
      throw new Error(util.format(notify.ERROR_STATUS));
    }
    else {
      return value;
    }
  }).run(req);


  let item = Object.assign(req.body);
  let errors = validationResult(req);
  let taskCurrent = (typeof item !== "undefined" && item.id !== "") ? "edit" : "add";
  console.log(taskCurrent)

    if(errors.isEmpty() === false) {
      let pageTitle = (taskCurrent == "add") ? pageTitleAdd :  pageTitleEdit;
      res.render(`${folderView}form`, { pageTitle, item, errors });
    } else { 
      let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.UPDATE_SUCCESS;
      ItemsModel.saveItem(item, {task: taskCurrent}).then((result) => {
        req.flash('success', message);
        res.redirect(linkIndex);
      })
    }

});


// SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
  let sortField = ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
  let sortType = ParamsHelpers.getParam(req.params, 'sort_type', 'asc');

  req.session.sort_field = sortField;
  req.session.sort_type = sortType;

  res.redirect(linkIndex);

});



module.exports = router;
