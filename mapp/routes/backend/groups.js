var express = require('express');
var router  = express.Router();
const util  = require('node:util');

const GroupsModel    = require(__path_models + 'groups');
const UsersModel     = require(__path_models + 'users');
// const ValidateGruops = require(__path_validates + 'groups');
const utilsHelpers   = require(__path_helpers + 'utils');
const ParamsHelpers  = require(__path_helpers + 'params');

const systemConfig   = require(__path_configs + 'system');
const notify         = require(__path_configs + 'notify');

const { check, validationResult } = require('express-validator');
const linkIndex                   = '/' + systemConfig.prefixAdmin + '/groups/';

const pageTitleIndex  = 'Group Management';
const pageTitleAdd    = pageTitleIndex + ' - Add';
const pageTitleEdit   = pageTitleIndex + ' - Edit';

const folderView      = __path_views_admin + 'pages/groups/';


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

  let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'groups');

  await GroupsModel.countGroup( params ).then((data) => {
    params.pagination.totalItems = data;
  })
  // console.log(pagination.totalGroups)
  GroupsModel
    .listGroup(params)
    .then((groups) => {
      res.render(`${folderView}list`,
        {
          pageTitle: pageTitleIndex,
          groups,
          statusFilter,
          params
        });
    });
});


/* Change status. */
router.get('/change-status/:id/:status', (req, res, next) => {
  let changedUser = req.user.username;

  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '');

  GroupsModel.changeStatus(id, currentStatus, createdUser, {task:"update-one"}).then((result) =>{
    req.flash('success', util.format(notify.UPDATE_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  })
});

/* Change Group ACP. */
router.get('/change-group-acp/:id/:group_acp', (req, res, next) => {
  let currentGroupACP = ParamsHelpers.getParam(req.params, 'group_acp', 'yes');
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let changedUser = req.user.username;
  GroupsModel.changeGroupACP(currentGroupACP,changedUser, id, null).then((result) => {
    req.flash('success', util.format(notify.CHANGE_GROUP_ACP_SUCCESS));
    res.redirect(linkIndex);
  });
});

/* Change status - Multi */
router.post('/change-status/:status', (req, res, next) => {
  let changedUser = req.user.username;
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  GroupsModel.changeStatus(req.body.cid, currentStatus,changedUser, {task:"update-multi"}).then((result)=>{
    req.flash('success', util.format(notify.UPDATE_MUITI_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  });
});

/* Change ordering - Multi */
router.post('/change-ordering', (req, res, next) => {
  let changedUser = req.user.username;
  let cids = req.body.cid;
  let orderings = req.body.ordering;
  GroupsModel.changeOrdering(cids ,orderings,changedUser, null).then((result) =>{
    req.flash('success',  notify.UPDATE_ORDERING);
    res.redirect(linkIndex);
  });
});

/* Delete */
router.get('/delete/:id', (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  GroupsModel.deleteGroup(id, {task:"delete-one"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});

/* Delete */
router.post('/delete', (req, res, next) => {
  GroupsModel.deleteGroup(req.body.cid, {task:"delete-multi"}).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});


/* Add group. */
router.get(('/form(/:id)?'), (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let groups = { name: '', ordering: 0, status: 'novalue' };
  let errors = null;
  if (id === '') {
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd, groups, errors });
  } else {
    GroupsModel.getGroup(id).then((groups) => {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit, groups, errors });
    });
  }

  // req.flash('success', 'hehee');
  // res.send('Test Flash');
  // res.end();

});



/* Add Edit*/
router.post('/save', async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));
  let changedUser = req.user.username;
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
  await check('group_acp', util.format(notify.ERROR_GROUPACP)).notEmpty().run(req);


  let groups = Object.assign(req.body);
  let errors = await validationResult(req);
  let taskCurrent = (typeof groups !== "undefined" && groups.id !== "") ? "edit" : "add";
  
  if (errors.isEmpty() === false) {
    let pageTitle = (taskCurrent == "add") ? pageTitleAdd :  pageTitleEdit;
    res.render(`${folderView}form`, { pageTitle, groups, errors });

  } else { 
    let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.UPDATE_SUCCESS;
    GroupsModel.saveGroup(groups,changedUser, {task: taskCurrent}).then((result) => {
      if(taskCurrent == "add"){
        req.flash('success', message);
        res.redirect(linkIndex);
      }
      else if(taskCurrent == "edit"){
        UsersModel.saveUser(groups, {task: 'change-group-name'}).then((result) => {
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
