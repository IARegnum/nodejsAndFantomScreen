
var phantom = require("phantom");
var fs = require('fs');
var Dropbox = require('dropbox');

var ACCESS_TOKEN = 'ACCESS_TOKEN;
var dbx = new Dropbox({ accessToken: ACCESS_TOKEN });
var countNewsYandex=5;

screenYandex();
setInterval(screenYandex, 900000);

function screenYandex() {

    var homePage = 'https://yandex.ru';
    var path = 'screens';

    var count = 0;
    var fileName='';
    var patnFileUpload = '';
    var yandexPageLinkNews = [];

    var today = new Date();
    var day = (today.getDate() < 10) ? '0' + today.getDate() : today.getDate();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    var hour = today.getHours();
    var min = (today.getMinutes() < 10) ? '0' + today.getMinutes() : today.getMinutes();

    phantom.create().then(function (ph) {
        ph.createPage().then(function (page) {
            page.open(homePage).then(function (status) {
                console.log(status);

                if (status !== 'success')
                    console.log('Unable to access network');
                else {
                    fileName = 'home.png';
                    patnFileUpload = path + '/'+fileName;

                    console.log('Created screen ');
                    page.render(patnFileUpload).then(function () {
                        console.log(homePage);
                        uploadDropBox();
                    });

                    // получаем все ссылки на новости
                    page.evaluate(function (countNewsYandex) {
                        var getAllHrefLinkQuery = document.querySelectorAll('a.list__item-content');
                        var getAllHrefLink = [];
                        var length = countNewsYandex;

                        if (getAllHrefLinkQuery.length < 5) length = getAllHrefLinkQuery.length;

                        // получаем ссылки на сюжеты
                        for (var i = 0; i < length; i++)
                            getAllHrefLink.push(getAllHrefLinkQuery[i].href);

                        return getAllHrefLink;

                    },countNewsYandex)
                        .then(function (data) {
                            yandexPageLinkNews = data;
                            nextPageNews();
                        });
                }
            });

            function screenPage(href) {
                page.open(href).then(function () {
                    page.render(patnFileUpload).then(function () {
                        console.log(href);
                        uploadDropBox();
                    });
                    setTimeout(nextPageNews, 1700);
                });
            }

            function nextPageNews() {
                var href = yandexPageLinkNews.shift();
                fileName = count + '.png';
                patnFileUpload = path + '/' + fileName;
                count++;

                if (!href) {
                    count = 0;
                    page.close();
                    setTimeout(deleteFilesPath, 15000);
                    setTimeout(exitPh, 17000);
                }
                else
                    screenPage(href);
            }

            function uploadDropBox() {
                var pathDay = day + '.' + month + '.' + year;
                var pathHour = hour + ':' + min;

                dbx.filesUpload({
                    path: '/screens/' + pathDay + '/' + pathHour + '/' + fileName,
                    contents: fs.readFileSync(patnFileUpload)
                })
                    .then(function (response) {
                        console.log(response);
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            }

            function deleteFilesPath() {
                console.log('Delete files in path ' + path);
                fs.readdir(path, function (err, files) {
                    files.forEach(function (file) {
                        fs.unlinkSync(path + '/' + file);
                        console.log(file);
                    })
                });
            }

            function exitPh() {
                ph.exit(1);
            }
        });
    });
}