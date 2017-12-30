var Crawler = require("crawler");
var jsdom = require('jsdom');
var opoemDao = require('./dao/opoemDao');
var oplabelDao = require('./dao/oplabelDao');
const { JSDOM } = jsdom;
var c = new Crawler({
    maxConnections : 1,
    // This will be called for each crawled page
    callback : function (error, res, done) {
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

var base_url = 'http://www.chinapoesy.com/';

var authors = [];
var workss = [];
var author_index = 0;
var works_index = 0;

function parseAuthors(authors_url){
    var uri = base_url+authors_url;
    c.queue([{
        // uri:base_url+'/XianDaiAuthorList_1.html',
        uri:uri,
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
                var DLAtuhor = document.querySelector('#DLAtuhor');
                // console.log(DLAtuhor)
                var tbody = DLAtuhor.querySelector('tbody');
                // console.log(tbody)
                var tr = DLAtuhor.querySelectorAll('tr');
                // console.log(tr)
                 authors = [];
                for(var i = 0 ; i < tr.length ; i++){
                 var tr_item = tr[i];
                 // console.log(tr_item);
                 var td = tr_item.querySelectorAll('td');
                 // console.log(td);
                     for(var j = 0 ; j < td.length ; j++){
                         var td_tiem = td[j];
                         var div = td_tiem.querySelector('div');
                         if(div){
                             var a = div.querySelector('a');
                             // console.log(a.textContent);
                             // console.log(a.href);
                             //每个作者url
                             authors.push({author:a.textContent.trim(),href:a.href})
                         }
                     }
                }
                // console.log(authors.length)
                authors.splice(0,95);
                parseOneAuthor();
            }
            done();
        }
    }]);
}

function parseOneAuthor(){
    author_index = 0 ;
    console.log('------待解析作者数量:'+authors.length)
    if(authors.length > 0){
        var timeout = Math.round((Math.random()*1000)*5);
        setTimeout(function(){
            var author_url = authors[0].href
            parseAuthor(author_url);
            authors.splice(0,1);
        },timeout);
    }else{
        console.log('当前页解析完成')
    }
}

function parseAuthor(author){
    var temp_author = author;
    author_index += 1;
    var uri = base_url+author
    console.log('------parseAuthor:'+uri)
    c.queue([{
        // uri:base_url+'/XianDaiAuthorB7A35632-130F-4A9E-A977-05950AD10EF2.html',
        uri:uri,
        rateLimit: 3000, // `maxConnections` will be forced to 1
        // encoding:null,
        jQuery: jsdom,
        // The global callback won't be called
        callback: function (error, res, done) {
            // console.log(res)
            // console.log(done)
            if(error){
                console.log(error);
            }else{
                var dynasty = '近现代'
                
                var dom = new JSDOM(res.body);
                // console.log(dom)
                var document = dom.window.document;
                var table = document.querySelector('.Global1');
                // console.log(table)
                var tbody = table.querySelector('tbody');
                var right = tbody.children[1].children[1];
                var div = right.querySelectorAll('div');
                var div4 = div[4];
                var h2 = div4.querySelector('h2');
                // console.log(h2.innerHTML)
                if(h2 == null){
                    console.log(div.length)
                    console.log(div4.innerHTML)
                    console.log(uri)
                    parseAuthor(temp_author)
                    console.log('尝试重试，author:'+temp_author)
                    done();
                    return;
                }
                // console.log(h2)
                var author = h2.innerHTML.replace("简介", "");
                
                var p = div4.querySelectorAll('p');
                // console.log(p.length)
                var profile = '';
                for(var i = 0 ; i < p.length ; i++){
                    var innerHTML = p[i].innerHTML;
                    // console.log('------'+innerHTML)
                    profile += innerHTML.replace(/<br>/, "\r\n");
                    profile += "\r\n";
                    // console.log('------'+i)
                }


                var table = right.querySelectorAll('table');
                if(table.length == 0){//无作品
                    console.log(right.innerHTML);
                    parseOneAuthor();
                    return;
                }
                console.log(author)
                console.log(dynasty)
                console.log(profile)
                console.log('---当前正在解析第'+author_index+'位')
                oplabelDao.addLabel(author,dynasty,profile,function(err,result){
                     if(err){
                        console.error(err)
                     }else{
                        console.log(result)
                     }
                })

                var tbody = table[table.length-1].querySelector('tbody');
                var tr = tbody.querySelectorAll('tr');
                workss = [];
                for(var i = 0 ; i < tr.length ;i++){
                    // console.log(tr[i].innerHTML)
                    var td = tr[i].querySelectorAll('td');
                    // console.log(td.length)
                    for(var j = 0 ; j < td.length ; j++){
                        var a = td[j].querySelector('a');
                        if(a != null){
                            var textContent = a.textContent;
                            textContent = textContent.slice(0,textContent.indexOf('('));
                            // console.log(textContent.trim())
                            workss.push({author:author,title:textContent.trim(),href:a.href});
                        }
                        // console.log(a)
                        // console.log(a.href);
                    }
                }
                // console.log(workss);
                parseOneWorks(author);
                // console.log(tr[0].innerHTML)
                // var td = tr[0].querySelectorAll('td');
                // var a = td[0].querySelector('a');
                // console.log(a.href);
                // var textContent = a.textContent;
                // // console.log(textContent.indexOf('('));
                // // console.log(textContent.indexOf(')'));
                // textContent = textContent.slice(0,textContent.indexOf('('));
                // console.log(textContent.trim())
                // console.log(a.innerHTML);
                // var h2 = div4.querySelector('h2')
                // console.log(h2.innerHTML)
                // var div = div4.querySelector('div')
                // console.log(div)
                // var p = div.querySelectorAll('p');
                // console.log(p)
                // console.log(div[4].innerHTML)
                // console.log(tbody.innerHTML)
                // console.log(tbody.children[1].children[1].innerHTML)
                // console.log(tbody.children[1].innerHTML)
                // console.log(tr[1].innerHTML);
                // console.log(tr[1].innerHTML);
                // var td = tr[2].querySelectorAll('td');
                // console.log(td[1].innerHTML)
                // console.log(td[1].innerHTML);
                // var div = td[1].querySelectorAll('div');
                // console.log(div.innerHTML)
            }
            done();
        }
    }]);  
}


function parseOneWorks(author){
    console.log('------开始解析'+author+'作品，共'+workss.length)
    works_index = 0;
    if(workss.length > 0){
        var timeout = Math.round((Math.random()*1000));
        setTimeout(function(){
            var works_url = workss[0].href
            parseWorks(works_url);
            workss.splice(0,1);
        },timeout)
    }else{
        parseOneAuthor();
    }
}

function parseWorks(works_url){
    var uri = base_url+works_url;
    works_index +=1;
    c.queue([{
        // uri:base_url+'/XianDaiFB6C6D63-FBE8-4F07-94E9-C4C149BA76C4.html',
        // uri:base_url+'/XianDai76FFFB63-2899-4DD1-8365-D70801F02777.html',
        uri:uri,
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
                var table = document.querySelector('.Global1');
                // console.log(table)
                var tbody = table.querySelector('tbody');
                var right = tbody.children[1].children[1];
                // console.log(right.innerHTML)
                var qh = right.querySelectorAll('.HeightBorderCenter');
                var title = qh[0].textContent;
                var author = qh[1].textContent.trim();
                var content = '';
                var ps =  qh[2].querySelectorAll('p');
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
                    var innerHTML = qh[2].innerHTML;
                    // console.log(innerHTML.replace(/<br>/g, "\r\n"));
                    content += innerHTML.replace(/<br>/g, "\r\n");
                }  
                // console.log(ps.length)
                // var innerHTML = qh[2].innerHTML;
                // content = innerHTML.replace(/<br>/g, "\r\n");
                // content = innerHTML.replace(/<br>/g, "\r\n");
                // content += "\r\n";
                var dynasty = '近现代';
                console.log(title)
                console.log(content)
                console.log(author)
                console.log(dynasty)
                opoemDao.addOPoem(title,content,author,dynasty,function(err,result){
                        if(err){
                            console.error(err)
                        }else{
                            console.log(result)
                        }
                    })   
                console.log('------当前解析第'+works_index+'首')
                if(workss.length > 0){
                    var timeout = Math.round((Math.random()*1000)*2);
                    console.log('------延时'+(timeout/1000))
                    setTimeout(function(){
                        var works_url = workss[0].href
                        parseWorks(works_url);
                        workss.splice(0,1);
                    },timeout)
                }else{
                    parseOneAuthor();
                }
            }
            done();
        }
    }]); 
} 

// http://www.chinapoesy.com/XianDaiAuthor1f9279f8-76f1-4e98-a9d3-30a7817c4863.html

function parseSingleAuthor(author){
    var temp_author = author;
    author_index += 1;
    var uri = base_url+author
    console.log('------parseAuthor:'+uri)
    c.queue([{
        // uri:base_url+'/XianDaiAuthorB7A35632-130F-4A9E-A977-05950AD10EF2.html',
        uri:uri,
        rateLimit: 3000, // `maxConnections` will be forced to 1
        // encoding:null,
        jQuery: jsdom,
        // The global callback won't be called
        callback: function (error, res, done) {
            // console.log(res)
            // console.log(done)
            if(error){
                console.log(error);
            }else{
                var dynasty = '近现代'
                
                var dom = new JSDOM(res.body);
                // console.log(dom)
                var document = dom.window.document;
                var table = document.querySelector('.Global1');
                // console.log(table)
                var tbody = table.querySelector('tbody');
                var right = tbody.children[1].children[1];
                var div = right.querySelectorAll('div');
                var div4 = div[4];
                var h2 = div4.querySelector('h2');
                // console.log(h2.innerHTML)
                if(h2 == null){
                    console.log(div.length)
                    console.log(div4.innerHTML)
                    console.log(uri)
                    console.log('尝试重试，author:'+temp_author)
                    done();
                    return;
                }
                // console.log(h2)
                var author = h2.innerHTML.replace("简介", "");
                
                var p = div4.querySelectorAll('p');
                console.log(p.length)
                var profile = '';
                if(p.length > 0){
                    for(var i = 0 ; i < p.length ; i++){
                        var innerHTML = p[i].innerHTML;
                        // console.log('------'+innerHTML)
                        profile += innerHTML.replace(/<br>/, "\r\n");
                        profile += "\r\n";
                        // console.log('------'+i)
                    }
                }else{
                    var innerHTML = div4.innerHTML;
                    console.log(innerHTML)
                }



                var table = right.querySelectorAll('table');
                if(table.length == 0){//无作品
                    console.log(right.innerHTML);
                    done();
                    return;
                }
                console.log(author)
                console.log(dynasty)
                console.log(profile)
                if(profile){
                    oplabelDao.upLabelProfile(author,profile,function(err,result){
                         if(err){
                            console.error(err)
                         }else{
                            console.log(result)
                         }
                    })
                }
            }
            done();
        }
    }]);  
}


// parseAuthor('/XianDaiAuthorB7A35632-130F-4A9E-A977-05950AD10EF2.html')
// parseAuthors('/XianDaiAuthorList_5.html');

 parseSingleAuthor('/XianDaiAuthor0B6858CB-E78E-44DD-B1A8-0F1D43986A09.html');   
    