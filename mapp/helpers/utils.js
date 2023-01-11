
let createFilterStatus = async (currentStatus, collection) =>{
  const curentModel = require(__path_schemas + collection);
    let statusFilter = [
        {name:"ALL", value: "all", count: 1,  class:"default"},
        {name:"Active", value: "active", count: 2,  class:"default"},
        {name:"InActive", value: "inactive", count: 3,  class:"default"},
      ];
  
      // statusFilter.forEach((item, index) =>{
        for(let index = 0; index < statusFilter.length; index++){
        let item = statusFilter[index];
        let condition =(item.value !== "all") ? {status: item.value} : {};
        
        if(item.value === currentStatus) statusFilter[index].class ="success";
        // console.log(item.value);
        await curentModel.count(condition).then((data) => {
          statusFilter[index].count = data;
          // console.log("data" + data);
         });
      }
      return statusFilter;
}

module.exports = {
    createFilterStatus: createFilterStatus,

}