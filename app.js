var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var site = "backpage.com";
// we could accept the sub-domain as an arguement...for now, we'll make it "seattle"
var rootURI = "http://seattle.backpage.com/";
var dataStoreEntity_ProductListContent = 'ProductListContent';
var dataStoreEntity_ProductContent = 'ProductContent';
var config = {
  projectId: 'project-blue-cat'
};

const Datastore = require('@google-cloud/datastore');
const datastore = Datastore(config);

function handleGET (req, res) {
  console.log('handleGET');
  res.status(200).send('use post (passing in json construct for arguments)');
}

function handlePUT (req, res) {
  console.log('handlePUT');
  res.status(403).send('Put not supported!');
}

function handlePOST (req, res) {
  console.log('handlePOST');
  var category = req.body.category;
  var requestURI = rootURI + category;

  var scrapeListContentCallback = function(productPages){
    console.log('scrapeListContentCallback callback');
    scrapeProductPages(productPages, 0, category, scrapeProductPagesCallback);
  }

  var scrapeProductPagesCallback = function(numberOfProductPagesProcessed){
    console.log('scrapeListContentCallback callback');
    console.log('numberOfProductPagesProcessed=' + numberOfProductPagesProcessed)
    
    console.log('complete');
    res.status(200).send('complete');
  }

  scrapeListContent(requestURI, category, scrapeListContentCallback);
}

function insertProductContent (entity) {
  console.log('insertProductContent');
  return datastore.save(entity);
}

function insertProductListContent (entity) {
  console.log('insertProductListContent');
  return datastore.upsert(entity);
}

function scrapeListContent (requestURI, category, callback){
  console.log('scrapeListContent requestURI=' + requestURI + ' category=' + category);
  return request(requestURI, function(error, response, html){
    
    if(!error){

      var $ = cheerio.load(html);

      var productPages = JSON.parse('[]');
      $('div.mainBody div.cat a').each(function(index, el){
        var a_href = $(el).attr('href').trim();
        var title = $(el).text();
        productPages.push({ 'uri' : a_href, 'title' : title });
      });

      var dt = new Date();
      var dtString = dt.toLocaleString();

      var data = [
                    {
                      name: 'site',
                      value: site
                    },
                    {
                      name: 'rootURI',
                      value: rootURI
                    },
                    {
                      name: 'datetime',
                      value: dt
                    },
                    {
                      name: 'datetimeString',
                      value: dtString
                    },
                    {
                      name: 'category',
                      value: category
                    },
                    {
                      name: 'requestURI',
                      value: requestURI
                    },
                    {
                      name: 'productPages',
                      value: productPages
                    },
                    {
                      name: 'html',
                      value: $.html(),
                      excludeFromIndexes: true
                    }
                  ];

      var entity = {
        key: datastore.key(dataStoreEntity_ProductListContent),
        data: data
      }

      insertProductListContent(entity).then(function(){
        callback(productPages, 0, category);
      });
    }else{
      // handle error
    }
  })
}

function scrapeProductPages (productPages, productPageIndex, category, callback){
  console.log('scrapeProductPages productPages.length=' + productPages.length + ' productPageIndex=' + productPageIndex + ' category=' + category);

  var curProductPage = productPages[productPageIndex];
  var requestURI = curProductPage.uri;
  
  console.log('scrapeProductPage ' + requestURI);
  request(requestURI, function(error, response, html){
    
    if(!error){

      var $ = cheerio.load(html);

      // product page images
      var images = JSON.parse('[]');
      $('div.mainBody div.postingBody img').each(function(index, el){
        var imageURI = $(el).attr('src').trim();
        var fileName = imageURI.substring(imageURI.lastIndexOf('/')+1);
        images.push({ 'uri' : imageURI, 'fileName' :  fileName });
      });

      var postBody = $('div.mainBody div.postingBody').text().trim();
      var dt = new Date();
      var dtString = dt.toLocaleString();
      var imagesStoragePath = requestURI.replace('http://', '/') + '/';

      var data = [
                {
                  name: 'site',
                  value: site
                },
                {
                  name: 'rootURI',
                  value: rootURI
                },
                {
                  name: 'datetime',
                  value: dt
                },
                {
                  name: 'datetimeString',
                  value: dtString
                },
                {
                  name: 'category',
                  value: category
                },
                {
                  name: 'requestURI',
                  value: requestURI
                },
                {
                  name: 'title',
                  value: curProductPage.title
                },
                {
                  name: 'postBody',
                  value: postBody,
                  excludeFromIndexes: true
                },
                {
                  name: 'images',
                  value: images
                },
                {
                  name: 'imagesStoragePath',
                  value: imagesStoragePath
                },
                {
                  name: 'html',
                  value: $.html(),
                  excludeFromIndexes: true
                }
              ];
      
      var entity = {
        key: datastore.key([
                dataStoreEntity_ProductContent,
                requestURI
              ]),
        data: data
      }

      insertProductContent(entity).then(function(){
        
        productPageIndex += 1;

        if(productPageIndex >= productPages.length){
          console.log('scrapeProductPages complete all productPages');
          callback(productPageIndex);
        }else{
          scrapeProductPages(productPages, productPageIndex, category, callback);
        }
      });
    }else{
      // handle error
    }
  })
}

/**
 * Responds to a POST request
 *
 * @example
 * gcloud alpha functions call backpageScraper
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.backpageScraper = function backpageScraper (req, res) {
  switch (req.method) {
    case 'GET':
      handleGET(req, res);
      break;
    case 'PUT':
      handlePUT(req, res);
      break;
    case 'POST':
      handlePOST(req, res);
      break;
    default:
      res.status(500).send({ error: 'Something blew up!' });
      break;
  }
};