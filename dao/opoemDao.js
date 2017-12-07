var pool = require('./dao');
var utils = require('../utils/utils'); 

const OPOEM_TABLE = 'opoem'; 

module.exports = {
	/**
	 * 查询banners
	 */
	addOPoem(title,content,author,dynasty,callback){
		// console.log('title:'+title+'content:'+content+'author:'+author)
		var sql = 'SELECT * FROM '+OPOEM_TABLE+' WHERE title = ? LIMIT 1';
    	pool.getConnection(function(err, connection) {
	        connection.query(sql, title, function(err, result) {
	            if(err){
	            	callback(err, result)
	                connection.release();
	            }else{
	            	// console.log('-----select:'+title+'数量:'+result.length)
	            	if(result.length <= 0){
	            		var time = utils.getTime();
						sql = 'INSERT INTO '+OPOEM_TABLE+' (title,content,author,dynasty,time) VALUES (?,?,?,?,?)';
				        // console.log('------插入:'+title)
			            connection.query(sql, [title,content,author,dynasty,time], function(err, result) {
			            	// console.log(err)
			            	// console.log(result)
			            	if(err){
			            		callback(err, null)
			            	}else{
			            		// result.insertId
			            		callback(null, 'id:'+result.insertId+' title:'+title)
			            	}
			                connection.release();
			            });
	            	}else{
	            		callback('作品:'+title+'已存在', null)
		                connection.release();
	            	}
	            }
	        });
	    });
	},
}