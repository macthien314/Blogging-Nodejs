const CategoryModel = require(__path_schemas + 'category');
const StringHelpers = require(__path_helpers + 'string');
module.exports = {

    listCategory: (params, options = null) => {
        let objWhere = {};
        let sort = {};
        if (params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if (params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i');
        sort[params.sortField] = params.sortType;
        return CategoryModel
            .find(objWhere)
            .select('name status ordering created modified slug')
            .sort(sort)
            .skip((params.pagination.currentPage - 1) * params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage);
    },

    getCategory: (id, options = null) => {
        return CategoryModel.findById(id);
    },

    // listItemsFrontend: (params= null, options = null) => {
    //     let find = {};
    //     let select = 'name';
    //     let limit = 10;
    //     let sort = '';

    //     if (options.task == 'items-in-menu'){
    //         find = {status:'active'};
    //         sort = {ordering: 'asc'};            
    //     }

    //     return CategoryModel.find(find).select(select).limit(limit).sort(sort);
    // },

    listItemSelectbox: (params, options = null) => {
        return CategoryModel.find({}, {_id: 1, name: 1})
    },

    countCategory: (params, options = null) => {
        return CategoryModel.count(params.objWhere);
    },

    changeStatus: (id, currentStatus, options = null) => {

        let status = (currentStatus === 'active') ? 'inactive' : 'active';
        let data = {
            status: status,
            modified: {
                user_id: 0,
                user_name: 0,
                time: Date.now()
            }
        }
        if (options.task == "update-one") {
            return CategoryModel.updateOne({ _id: id }, data);
        }
        if (options.task == "update-multi") {
            data.status = currentStatus;
            return CategoryModel.updateMany({ _id: { $in: id } }, data);
        }
    },

    changeOrdering: async (cids, orderings, options = null) => {

        let data = {
            ordering: parseInt(orderings),
            modified: {
                user_id: 0,
                user_name: 0,
                time: Date.now()
            }
        }

        if (Array.isArray(cids)) {
            for (let index = 0; index < cids.length; index++) {
                data.ordering = parseInt(orderings[index]);
                await CategoryModel.updateOne({ _id: cids[index] }, data);
            }
            return Promise.resolve();
        } else {
            return CategoryModel.updateOne({ _id: cids }, data);
        }
    },

    deleteCategory: (id, options = null) => {
        if (options.task == "delete-one") {
            return CategoryModel.deleteOne({ _id: id });
        }
        if (options.task == "delete-multi") {
            return CategoryModel.remove({ _id: { $in: id } });
        }
    },
    saveCategory: (category, options = null) => {
        if (options.task == "add") {
            category.created = {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            }
            category.slug = StringHelpers.createAlias(category.slug);
            return new CategoryModel(category).save();
        }
        if (options.task == "edit") {
            return CategoryModel.updateOne({ _id: category.id }, {
                ordering: parseInt(category.ordering),
                name: category.name,
                status: category.status,
                content: category.content,
                slug: StringHelpers.createAlias(category.slug),
                modified: {
                    user_id: 0,
                    user_name: 0,
                    time: Date.now()
                }
            })
        }
    },
    
        //Front end
        listItemsFrontend: (params = null, options = null) => {
            let find ={};
            let select = 'name';
            let limit = 10;
            let sort = '';
            if (options.task == 'items-in-menu'){
                find = {status:'active'};
                sort= {ordering:'asc'};
            }

            return CategoryModel.find(find).select(select).limit(limit).sort(sort);
          
        },



}