var Crawler = require("crawler");
var jsdom = require('jsdom');
var opoemDao = require('./dao/opoemDao');
var oplabelDao = require('./dao/oplabelDao');

const { JSDOM } = jsdom;

var authors =[];
var authors_index = 0;
var page_index = 0;
var c = new Crawler({
    maxConnections : 1,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        // console.log('------Crawler')
        // console.log(error)
        // console.log(res)
        // console.log(done)
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            console.log($("title").text());
        }
        done();
    }
});


var base_url = 'http://so.gushiwen.org';


function startAuthors(){
    c.queue([{
        uri:'http://so.gushiwen.org/authors',
        rateLimit: 1000, // `maxConnections` will be forced to 1
        // encoding:null,
        jQuery: jsdom,
        // The global callback won't be called
        callback: function (error, res, done) {
            // console.log(res)
            // console.log(done)
            if(error){
                console.log(error);
            }else{
                var dom = new JSDOM(res.body);
                // console.log(dom)
                var document = dom.window.document;
                var main3 = document.querySelector('.main3');
                // console.log(main3)
                var right = main3.querySelector('.right');
                // console.log(right)
                var sons = right.querySelector('.sons');
                // console.log(sons)
                var cont = right.querySelector('.cont');
                // console.log(cont)
                var a = cont.querySelectorAll('a');
                // var isadd = false;
                for(var i = 0 ; i < a.length;i++){
                    // console.log(a[i].href);
                    // console.log(a[i].textContent);
                    // if(isadd){
                    //     authors.push({author:a[i].textContent,href:a[i].href});
                    // }
                    // if(a[i].textContent == '曹操'){
                    // if(a[i].textContent == '诸葛亮'){
                    //     isadd = true;
                    // }
                    authors.push({author:a[i].textContent,href:a[i].href});
                }
                console.log(authors);
                console.log('------全站共计作者:',authors.length)
                nextAuthor()
            }
            done();
        }
    }]);
}

/**
 * 5分-10分 10改成1000
 */
function nextAuthor(){
        console.log('------当前剩余作者:',authors.length);
        // console.log(i);
        // console.log(author)
        if(authors.length > 0){
            var author = authors[0];
            // console.log(author);
            console.log('------当前保存作者:',author.author);
            console.log('------当前保存作者href:',author.href);
            queueOneAuthor(author)
            authors.splice(0,1);
            authors_index ++;
            // var timeout = Math.round((Math.random()*1000+10000)*60*5)
            // console.log('-----authors time ',timeout/(10000*60))
            // setTimeout(function(){
            //     parseAuthors(authors)
            // },timeout);
        }else{
            console.log('------所有作者收录完成')
        }
}

function queueOneAuthor(author){
        page_index = 1;
        // console.log(author);
        var href = author.href;
        // console.log(href);
        // console.log(href.indexOf('_'));
        // console.log(href.indexOf('.'));
        // console.log('------author:',author.author)
        oplabelDao.addAuthor(author.author,function(err,result){
            if(err){
                console.error(err)
            }else{
                console.log(result)
            }
        });
        var start = href.indexOf('_');
        var end = href.indexOf('.');
        var author_id = href.substring(start+1,end);
        console.log('-----author_id:',author_id)
        var page = 1;
        // /authors/authorsw_665A41.aspx
        var authorsw_url = base_url+'/authors/authorsw_'+author_id+'A'+page+'.aspx';
        console.log('------ queueOneAuthor:','/authors/authorsw_'+author_id+'A'+page+'.aspx');
        c.queue([{
            uri:authorsw_url,
            rateLimit: 1000, // `maxConnections` will be forced to 1
            // encoding:null,
            jQuery: jsdom,
            forceUTF8:true,
            // The global callback won't be called
            callback: function (error, res, done) {
                // console.log(res)
                // console.log(done)
                if(error){
                    console.log(error);
                }else{
                    var dom = new JSDOM(res.body);
                    // console.log(dom);
                    var document = dom.window.document;
                    var main3 = document.querySelector('.main3');
                    var right = main3.querySelector('.right');
                    var sonspic = right.querySelector('.sonspic');
                    var cont = sonspic.querySelector('.cont');
                    var rps = cont.querySelectorAll('p');
                    var profile = rps[1].textContent;    
                    // console.log(main3.innerHTML)
                    var left = main3.querySelector('.left');
                    // 解析诗文
                    // console.log(left)
                    var sons = left.querySelectorAll('.sons'); 
                    console.log(sons.length);
                    for(var i = 0 ; i < sons.length ; i ++){
                        // console.log(sons[i])
                        var sons_item = sons[i];
                        // console.log(sons_item.innerHTML)
                        var cont = sons_item.querySelector('.cont');
                        // console.log(cont.innerHTML)
                        var lps = sons_item.querySelector('p');
                        var a_b = lps.querySelector('a b');
                        // console.log(q.length);
                        // console.log(title.textContent);//诗名
                        var title = a_b.textContent;
                        var source = sons_item.querySelector('.source');
                        // console.log(source.innerHTML)
                        var source_as = source.querySelectorAll('a')
                        // console.log(source_as[0].textContent);//年代
                        // console.log(source_as[1].textContent);//作者
                        var dynasty = source_as[0].textContent;
                        var author = source_as[1].textContent;
                        // console.log('------add:',author)
                        oplabelDao.addDynasty(author,dynasty,profile,function(err,result){
                            if(err){
                                console.error(err)
                            }else{
                                console.log(result)
                            }
                        });
                        var contson = sons_item.querySelector('.contson');
                        var ps = contson.querySelectorAll('p');
                        var content = '';
                        if(ps.length > 0){
                            for(var j = 0 ; j < ps.length ; j ++){
                                // console.log(ps[j].innerHTML)
                                var innerHTML = ps[j].innerHTML;
                                // console.log(innerHTML.replace(/<br>/g, "\r\n"));
                                // console.log("\r\n")
                                content += innerHTML.replace(/<br>/g, "\r\n");
                                content += "\r\n";
                            }
                        }else{
                            // console.log(contson.textContent)
                            // console.log(contson.innerHTML)
                            var innerHTML = contson.innerHTML;
                            // console.log(innerHTML.replace(/<br>/g, "\r\n"));
                            content += innerHTML.replace(/<br>/g, "\r\n");
                        }    
                        // console.log(content); //诗   
                        opoemDao.addOPoem(title,content,author,dynasty,function(err,result){
                            if(err){
                                console.error(err)
                            }else{
                                console.log(result)
                            }
                        })               
                    }
                    // 解析页码
                    var pages = left.querySelector('.pages'); 
                    var span = pages.querySelector('span');
                    console.log('-----current:',span.textContent)
                    var as = pages.querySelectorAll('a')
                    if(as.length > 0){
                        if(as[as.length-1].textContent === '下一页'){
                            var next_page = as[as.length-1].href;
                            // console.log(next_page);
                            queueAuthor(next_page)
                        }else{
                            console.log('------page end------')
                        }
                    }else{
                        nextAuthor();
                        console.log('------one page------')
                    }
                }
                done();
            }   
        }])
}
function queueAuthor(next_page){
        page_index ++;
        console.log('------ next_page:',next_page);
        console.log('-----page_index:',page_index);
        var authorsw_url = base_url+next_page;
        c.queue([{
            uri:authorsw_url,
            rateLimit: 1000, // `maxConnections` will be forced to 1
            // encoding:null,
            jQuery: jsdom,
            forceUTF8:true,
            // The global callback won't be called
            callback: function (error, res, done) {
                // console.log(res)
                // console.log(done)
                if(error){
                    console.log(error);
                }else{
                    var dom = new JSDOM(res.body);
                    // console.log(dom);
                    var document = dom.window.document;
                    var main3 = document.querySelector('.main3');
                    // console.log(main3.innerHTML)
                    var left = main3.querySelector('.left');
                    // 解析诗文
                    // console.log(left)
                    var sons = left.querySelectorAll('.sons'); 
                    // console.log(sons.length);
                    for(var i = 0 ; i < sons.length ; i ++){
                        // console.log(sons[i])
                        var sons_item = sons[i];
                        // console.log(sons_item.innerHTML)
                        var cont = sons_item.querySelector('.cont');
                        // console.log(cont.innerHTML)
                        var qs = sons_item.querySelector('p');
                        var a_b = qs.querySelector('a b');
                        // console.log(q.length);
                        // console.log(title.textContent);//诗名
                        var title = a_b.textContent;
                        var source = sons_item.querySelector('.source');
                        // console.log(source.innerHTML)
                        var source_as = source.querySelectorAll('a')
                        // console.log(source_as[0].textContent);//年代
                        // console.log(source_as[1].textContent);//作者
                        var dynasty = source_as[0].textContent;
                        var author = source_as[1].textContent;
                        var contson = sons_item.querySelector('.contson');
                        var ps = contson.querySelectorAll('p');
                        var content = '';
                        if(ps.length > 0){
                            for(var j = 0 ; j < ps.length ; j ++){
                                // console.log(ps[j].innerHTML)
                                var innerHTML = ps[j].innerHTML;
                                // console.log(innerHTML.replace(/<br>/g, "\r\n"));
                                // console.log("\r\n")
                                content += innerHTML.replace(/<br>/g, "\r\n");
                                content += "\r\n";
                            }
                        }else{
                            // console.log(contson.textContent)
                            // console.log(contson.innerHTML)
                            var innerHTML = contson.innerHTML;
                            // console.log(innerHTML.replace(/<br>/g, "\r\n"));
                            content += innerHTML.replace(/<br>/g, "\r\n");
                        }    
                        // console.log('-----two content')
                        // console.log(content); 
                        opoemDao.addOPoem(title,content,author,dynasty,function(err,result){
                            if(err){
                                console.error(err)
                            }else{
                                console.log(result)
                            }
                        })                  
                    }
                    // 解析页码
                    var pages = left.querySelector('.pages'); 
                    var span = pages.querySelector('span');
                    console.log('-----current:',span.textContent)
                    var as = pages.querySelectorAll('a')
                    if(as.length > 0){
                        if(as[as.length-1].textContent === '下一页'){
                            var next_page = as[as.length-1].href;
                            console.log(next_page);
                            var timeout = Math.round((Math.random()*1000)*5);
                            console.log('---- /authors/authorsw_ timeout:',timeout/(1000*60));
                            setTimeout(function(){
                                queueAuthor(next_page);
                            },timeout)
                        }else{
                            console.log('------page end------')
                            nextAuthor()
                        }
                    }else{
                        console.log(pages.innerHTML)
                    }
                }
                done();
            }   
        }])
}

startAuthors()


