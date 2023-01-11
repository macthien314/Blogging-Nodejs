var express = require('express');
var router = express.Router();
const util = require('node:util');

const FileHelpers = require(__path_helpers + 'file');

const UsersModel = require(__path_models + 'users');
const GroupsModel = require(__path_models + 'groups');

const utilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');

const { check, validationResult } = require('express-validator');
const linkIndex = '/' + systemConfig.prefixAdmin + '/users/';

const pageTitleIndex = 'User Management';
const pageTitleAdd = pageTitleIndex + ' - Add';
const pageTitleEdit = pageTitleIndex + ' - Edit';

const folderView = __path_views_admin + 'pages/users/';

const uploadAvatar = FileHelpers.upload('avatar', 'users');





/* GET home page. */
router.get('(/status/:status)?', async (req, res, next) => {

  let params = {};
  params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
  params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
  params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
  params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');
  params.groupID = ParamsHelpers.getParam(req.session, 'group_id', '');
  params.pagination = {
    totalItems: 1,
    totalItemsPerPage: 5,
    currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
    pageRanges: 3
  };

  let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'users');

  let groupsItems = [];
  await GroupsModel.listItemSelectbox().then((users) => {
    groupsItems = users;
    groupsItems.unshift({ _id: 'allvalue', name: 'All group' });
  });



  await UsersModel.countUser(params).then((data) => {
    params.pagination.totalItems = data;
  })

  // console.log(pagination.totalUsers)
  UsersModel.listUser(params)
    .then((users) => {
      console.log(users);
      res.render(`${folderView}list`, {
        pageTitle: pageTitleIndex,
        users,
        statusFilter,
        groupsItems,
        params
      });
    });
});


/* Change status. */
router.get('/change-status/:id/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '');

  UsersModel.changeStatus(id, currentStatus, { task: "update-one" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  })
});

/* Change status - Multi */
router.post('/change-status/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');

  UsersModel.changeStatus(req.body.cid, currentStatus, { task: "update-multi" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_MUITI_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  });
});

/* Change ordering - Multi */
router.post('/change-ordering', (req, res, next) => {
  let cids = req.body.cid;
  let orderings = req.body.ordering;

  UsersModel.changeOrdering(cids, orderings, null).then((result) => {
    req.flash('success', notify.UPDATE_ORDERING);
    res.redirect(linkIndex);
  });
});

/* Delete */
router.get('/delete/:id', async (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');

 

  UsersModel.deleteUser(id, { task: 'delete-one' }).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });


});

/* Delete */
router.post('/delete', (req, res, next) => {
  UsersModel.deleteUser(req.body.cid, { task: 'delete-multi' }).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});


/* Add user. */
router.get(('/form(/:id)?'), async (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let user = { name: '', ordering: 0, status: 'novalue', group_id: '', group_name: '' };
  let errors = null;
  let groupsItems = [];

  await GroupsModel.listItemSelectbox().then((users) => {
    groupsItems = users;
    groupsItems.unshift({ _id: 'allvalue', name: 'All group' });
  })


  if (id === '') { //add 
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd, user, errors, groupsItems });
  } else { // edit
    UsersModel.getUser(id).then((user) => {
      user.group_id = user.group.id;
      user.group_name = user.group.name;
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit, user, errors, groupsItems });
    });
  }

  // req.flash('success', 'hehee');
  // res.send('Test Flash');
  // res.end();

});



/* Add */
router.post('/save',  (req, res, next) => {
  uploadAvatar(req, res, async (errUpload) => {
    req.body = JSON.parse(JSON.stringify(req.body));

  const options = {
    name: { min: 5, max: 20 },
    ordering: { min: 0, max: 100 },
    status: { value: "novalue" },
    group: { value: "allvalue" },
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
  await check('group_id').custom((value) => {
    console.log(req.body)
    if (value === options.group.value) {
      throw new Error(util.format(notify.ERROR_GROUP));
    }
    else {
      return value;
    }
  }).run(req);



  let user = Object.assign(req.body);
  let taskCurrent = (typeof user !== "undefined" && user.id !== "") ? "edit" : "add";
  let errors = await validationResult(req);
 
  if (errUpload) {
    console.log(errUpload)
    if(errUpload.code == "LIMIT_FILE_SIZE")
    {
      errUpload = notify.ERROR_FILE_LIMIT;
    }
    console.log(errUpload)
    errors.errors.push({param: 'avatar', msg: errUpload});
 
  }
  else{
    if(req.file == undefined && taskCurrent == "add"){
      errors.errors.push({param: 'avatar', msg: notify.ERROR_FILE_REQUIRE}); 
    }
  }

  
  

  

  //edit

  if (errors.isEmpty() == false)  {
    let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
    if(req.file !== undefined) FileHelpers.remove('public/uploads/users/', req.file.filename);  // xóa hình khi form không hợp lệ   
    let groupsItems = [];
    await GroupsModel.listItemSelectbox().then((users) => {
      groupsItems = users;
      groupsItems.unshift({ _id: 'allvalue', name: 'All group' });

    })
    if (taskCurrent == "edit") user.avatar = user.image_old;
    res.render(`${folderView}form`, { pageTitle, user, errors, groupsItems });

  } else {
    let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.UPDATE_SUCCESS;
    if(req.file == undefined){ // không có upload lại hình
      user.avatar = user.image_old;
    }else{
    user.avatar = req.file.filename; 
    console.log("cc1",user.avatar);
    if(taskCurrent == "edit") FileHelpers.remove('public/uploads/users/', user.image_old);
    console.log("cc",user.image_old);
    }
    UsersModel.saveUser(user,  { task: taskCurrent }).then((result) => {
      req.flash('success', message);
      res.redirect(linkIndex);
    });
  }

  });
  


});


// SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
  let sortField = ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
  let sortType = ParamsHelpers.getParam(req.params, 'sort_type', 'asc');

  req.session.sort_field = sortField;
  req.session.sort_type = sortType;

  res.redirect(linkIndex);

});


// SORT-group
router.get(('/filter-group/:group_id'), (req, res, next) => {
  req.session.group_id = ParamsHelpers.getParam(req.params, 'group_id', '');
  res.redirect(linkIndex);

});



module.exports = router;