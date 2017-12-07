var pool = require('./dao');
var utils = require('../utils/utils'); 

const OPLABEL_TABLE = 'oplabel'; 

module.exports = {
	/**
	 * 插入作者
	 */
	addAuthor(author,callback){
		var sql = 'SELECT * FROM '+OPLABEL_TABLE+' WHERE author = ? LIMIT 1';
        pool.getConnection(function(err, connection) {
            connection.query(sql, author, function(err, result) {
                if(err){
                	callback(err, result)
	                connection.release();
                }else{
                	if(result.length <= 0){
                	    var time = utils.getTime();
	                	sql = 'INSERT INTO '+OPLABEL_TABLE+' (author,time) VALUES (?,?)';
			            connection.query(sql, [author,time], function(err, result) {
			            	if(err){
			            		callback(err, null)
			            	}else{
			            		// result.insertId
			            		callback(null, 'id:'+result.insertId+' author:'+author)
			            	}
			                connection.release();
			            });
                	}else{
                		callback('作者已存在', null)
		                connection.release();
                	}
                }
            });
        });
	},
	addDynasty(author,dynasty,profile,callback){
		var sql = 'UPDATE '+OPLABEL_TABLE+' SET dynasty = ? ,profile = ? WHERE author = ? ';
        pool.getConnection(function(err, connection) {
            connection.query(sql, [dynasty,profile,author], function(err, result) {
            	if(err){
            		callback(err, null)
            	}else{
            		// result.insertId
            		callback(null,author+'更新年代为:'+dynasty)
            	}
                connection.release();
            });
        });
	},
}