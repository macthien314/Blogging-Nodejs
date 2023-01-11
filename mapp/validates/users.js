const util = require('util');
const notify = require(__path_configs + 'notify');
const { check, validationResult } = require('express-validator');
const options = {
    name: { min: 5, max: 20 },
    ordering: { min: 0, max: 100 },
    status: { value: "novalue" },
    group: { value: "allvalue" },
    content: { min: 5, max: 200 }
}

module.exports = {
    validator: async (req, errUpload, taskCurrent) => {
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
          return errors;
    }

    
}