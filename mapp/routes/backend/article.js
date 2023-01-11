var express = require('express');
var router = express.Router();
const util = require('node:util');

const FileHelpers = require(__path_helpers + 'file');

const ArticlelModel = require(__path_models + 'article');
const CategorylModel = require(__path_models + 'category');

const utilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');

const { check, validationResult } = require('express-validator');
const linkIndex = '/' + systemConfig.prefixAdmin + '/article/';

const pageTitleIndex = 'Article Management';
const pageTitleAdd = pageTitleIndex + ' - Add';
const pageTitleEdit = pageTitleIndex + ' - Edit';

const folderView = __path_views_admin + 'pages/article/';

const uploadThumb = FileHelpers.upload('thumb', 'article');





/* GET home page. */
router.get('(/status/:status)?', async (req, res, next) => {

  let params = {};
  params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
  params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
  params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
  params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');
  params.categoryID = ParamsHelpers.getParam(req.session, 'category_id', '');
  params.pagination = {
    totalItems: 1,
    totalItemsPerPage: 5,
    currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
    pageRanges: 3
  };

  let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'articles');

  let categoryItems = [];
  await CategorylModel.listItemSelectbox().then((users) => {
    categoryItems = users;
    categoryItems.unshift({ _id: 'allvalue', name: 'All Category' });
  });



  await ArticlelModel.countUser(params).then((data) => {
    params.pagination.totalItems = data;
  })


  ArticlelModel.listUser(params)
    .then((users) => {
      console.log(users);
      res.render(`${folderView}list`, {
        pageTitle: pageTitleIndex,
        users,
        statusFilter,
        categoryItems,
        params,

      });
    });

});


/* Change status. */
router.get('/change-status/:id/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '');

  ArticlelModel.changeStatus(id, currentStatus, { task: "update-one" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  })
});

/* Change status - Multi */
router.post('/change-status/:status', (req, res, next) => {
  let currentStatus = ParamsHelpers.getParam(req.params, 'status', 'active');

  ArticlelModel.changeStatus(req.body.cid, currentStatus, { task: "update-multi" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_MUITI_STATUS, result.modifiedCount));
    res.redirect(linkIndex);
  });
});

/* Change special - Multi */
router.get('/change-special/:id/:special', (req, res, next) => {
  let currentSpecial = ParamsHelpers.getParam(req.params, 'special', 'active');
  let id = ParamsHelpers.getParam(req.params, 'id', '')
  ArticlelModel.changeSpecial(id, currentSpecial, { task: "update-one" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_SPECIAL_SUCCESS));
    res.redirect(linkIndex);
  });
});

/* Change special - Multi */
router.post('/change-special/:special', (req, res, next) => {
  let currentSpecial = ParamsHelpers.getParam(req.params, 'special', 'active');
  ArticlelModel.changeSpecial(req.body.cid, currentSpecial, { task: "update-multi" }).then((result) => {
    req.flash('success', util.format(notify.UPDATE_SPECIAL_SUCCESS));
    res.redirect(linkIndex);
  });
});

/* Change ordering - Multi */
router.post('/change-ordering', (req, res, next) => {
  let cids = req.body.cid;
  let orderings = req.body.ordering;

  ArticlelModel.changeOrdering(cids, orderings, null).then((result) => {
    req.flash('success', notify.UPDATE_ORDERING);
    res.redirect(linkIndex);
  });
});

/* Delete */
router.get('/delete/:id', async (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');



  ArticlelModel.deleteUser(id, { task: 'delete-one' }).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });


});

/* Delete */
router.post('/delete', (req, res, next) => {
  ArticlelModel.deleteUser(req.body.cid, { task: 'delete-multi' }).then((result) => {
    req.flash('success', util.format(notify.DELETE_SUCCESS, result.deletedCount));
    res.redirect(linkIndex);
  });
});


/* Form user. */
router.get(('/form(/:id)?'), async (req, res, next) => {
  let id = ParamsHelpers.getParam(req.params, 'id', '');
  let user = { name: '', ordering: 0, status: 'novalue', special: 'novalue', category_id: '', category_name: '' };
  let errors = null;
  let categoryItems = [];

  await CategorylModel.listItemSelectbox().then((users) => {
    categoryItems = users;
    categoryItems.unshift({ _id: 'allvalue', name: 'All Category' });
  })


  if (id === '') { //add 
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd, user, errors, categoryItems });
  } else { // edit
    ArticlelModel.getUser(id).then((user) => {
      user.category_id = user.category.id;
      user.category_name = user.category.name;
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit, user, errors, categoryItems });
    });
  }

  // req.flash('success', 'hehee');
  // res.send('Test Flash');
  // res.end();

});



/* Add */
router.post('/save', (req, res, next) => {
  uploadThumb(req, res, async (errUpload) => {
    req.body = JSON.parse(JSON.stringify(req.body));

    const options = {
      name: { min: 5, max: 500 },
      ordering: { min: 0, max: 100 },
      status: { value: "novalue" },
      special: { value: "novalue" },
      category: { value: "allvalue" },
      content: { min: 5, max: 20000 }
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
    await check('special').custom((value) => {
      if (value == options.special.value) {
        throw new Error(util.format(notify.ERROR_SPECIAL));
      }
      else {
        return value;
      }
    }).run(req);
    await check('category_id').custom((value) => {
      console.log(req.body)
      if (value === options.category.value) {
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
      if (errUpload.code == "LIMIT_FILE_SIZE") {
        errUpload = notify.ERROR_FILE_LIMIT;
      }
      console.log(errUpload)
      errors.errors.push({ param: 'thumb', msg: errUpload });

    }
    else {
      if (req.file == undefined && taskCurrent == "add") {
        errors.errors.push({ param: 'thumb', msg: notify.ERROR_FILE_REQUIRE });
      }
    }






    //edit

    if (errors.isEmpty() == false) {
      let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
      if (req.file !== undefined) FileHelpers.remove('public/uploads/article/', req.file.filename);  // xóa hình khi form không hợp lệ   

      let categoryItems = [];
      await CategorylModel.listItemSelectbox().then((users) => {
        categoryItems = users;
        categoryItems.unshift({ _id: 'allvalue', name: 'All Category' });

      })

      if (taskCurrent == "edit") user.thumb = user.image_old;
      res.render(`${folderView}form`, { pageTitle, user, errors, categoryItems });

    } else {
      let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.UPDATE_SUCCESS;
      if (req.file == undefined) { // không có upload lại hình
        user.thumb = user.image_old;
      } else {
        user.thumb = req.file.filename;
        if (taskCurrent == "edit") FileHelpers.remove('public/uploads/article/', user.image_old);
      }
      ArticlelModel.saveUser(user, { task: taskCurrent }).then((result) => {
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


// SORT-Category
router.get(('/filter-category/:category_id'), (req, res, next) => {
  req.session.category_id = ParamsHelpers.getParam(req.params, 'category_id', '');
  res.redirect(linkIndex);

});



module.exports = router;