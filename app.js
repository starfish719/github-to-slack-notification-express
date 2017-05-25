var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

var server = app.listen(8080, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

const SLACK_API_TOKEN = 'XXXXX';

const CHANNEL_GITHUB = 'github';
const CHANNEL_GITHUB_PULLREQUEST = 'github_pullrequest';

const CHANNEL_ID_LIST = {
    [CHANNEL_GITHUB]: 'XXXXX',
    [CHANNEL_GITHUB_PULLREQUEST]: 'XXXXX',
};

const MAPPING_LIST = {
    'github name': 'slack name',
};

const TRACKER_LIST = [
    'tracker name',
];

/**
 * POSTまたはGETパラメータから送信データを取得する
 *
 * @param req
 */
var getSendData = function(req) {
    if (req.body && req.body.payload) {
        return JSON.parse(req.body.payload);
    }
    return {};
};

/**
 * メンションの通知先リストを、通知内容から取得する
 *
 * @param body
 * @returns {Array}
 */
var getMentionList = function(body) {
    if (body == null || body === undefined) {
        body = '';
    }

    var mentionList = [];
    Object.keys(MAPPING_LIST).forEach(function (key) {
        if (body.indexOf('@' + key) >= 0) {
            mentionList.push('<@' + MAPPING_LIST[key] + '>');
        }
    });

    return mentionList;
};

// Issue作成
app.post('/github_issue', function(req, res, next) {
    try {
        var payloadData = getSendData(req);
        if (payloadData.action != 'opened') {
            res.send();
            return;
        }

        var request = require('request');
        var async = require('async');
        async.waterfall(
            [
                function(callback) {
                    var text = encodeURIComponent('Issueが新規作成されました [<' + payloadData.issue.html_url + '|' + payloadData.issue.title + '>]');
                    var url = 'https://slack.com/api/chat.postMessage?token=' + SLACK_API_TOKEN + '&username=username&channel=' + CHANNEL_ID_LIST[CHANNEL_GITHUB] + '&text=' + text;
                    request.get({
                        url: url,
                        encoding: 'utf-8',
                    }, function (err, res) {
                        callback(null); // 次の処理へ
                    });

                },
                function(callback) {
                    for (var idx = 0; idx < payloadData.issue.labels.length; idx++) {
                        var labelData = payloadData.issue.labels[idx];
                        if (TRACKER_LIST.indexOf(labelData.name) >= 0) {
                            callback(null);
                            return;
                        }
                    }

                    var user = '@' + payloadData.issue.user.login;
                    var mentionList = getMentionList(user);
                    var message = 'ラベルが設定されていません [<' + payloadData.issue.html_url + '|' + payloadData.issue.title + '>]';
                    var text = encodeURIComponent(mentionList.join(' ') + ' ' + message);
                    var url = 'https://slack.com/api/chat.postMessage?token=' + SLACK_API_TOKEN + '&username=username&channel=' + CHANNEL_ID_LIST[CHANNEL_GITHUB] + '&text=' + text;
                    request.get({
                        url: url,
                        encoding: 'utf-8',
                    }, function (err, res) {
                        callback(null);
                    });
                },
            ],
            function(err) {
                res.send();
            }
        );
    } catch (e) {
        console.error(e);
    }
});

// Issueへのコメント
app.post('/github_issue_comment', function(req, res, next) {
    try {

        var request = require('request');
        var async = require('async');
        async.waterfall(
            [
                function(callback) {
                    var payloadData = getSendData(req);
                    var comment = payloadData.comment.body;
                    var mentionList = getMentionList(comment);
                    if (mentionList.length <= 0) {
                        callback(null);
                        return;
                    }

                    var message = 'Issueにコメントが追加されました [<' + payloadData.comment.html_url + '|' + payloadData.issue.title + '>]';
                    var text = encodeURIComponent(mentionList.join(' ') + ' ' + message);
                    var url = 'https://slack.com/api/chat.postMessage?token=' + SLACK_API_TOKEN + '&username=username&channel=' + CHANNEL_ID_LIST[CHANNEL_GITHUB] + '&text=' + text;
                    request.get({
                        url: url,
                        encoding: 'utf-8',
                    }, function (err, res) {
                        callback(null);
                    });

                },
            ],
            function(err) {
                res.send();
            }
        );
    } catch (e) {
        console.error(e);
    }
});

// コミット内容へのコメント
app.post('/github_commit_comment', function(req, res, next) {
    try {

        var payloadData = getSendData(req);
        if (!payloadData.action || payloadData.action != 'created') {
            res.send();
            return;
        }

        var request = require('request');
        var async = require('async');
        async.waterfall(
            [
                function(callback) {
                    var comment = payloadData.comment.body;
                    var mentionList = getMentionList(comment);
                    if (mentionList.length <= 0) {
                        callback(null);
                        return;
                    }

                    var message = 'コードレビューのコメントが追加されました <' + payloadData.comment.html_url + '|' + payloadData.comment.path + '>';
                    var text = encodeURIComponent(mentionList.join(' ') + ' ' + message);
                    var url = 'https://slack.com/api/chat.postMessage?token=' + SLACK_API_TOKEN + '&username=username&channel=' + CHANNEL_ID_LIST[CHANNEL_GITHUB_PULLREQUEST] + '&text=' + text;
                    request.get({
                        url: url,
                        encoding: 'utf-8',
                    }, function (err, res) {
                        callback(null);
                    });

                },
            ],
            function(err) {
                res.send();
            }
        );
    } catch (e) {
        console.error(e);
    }
});

// プルリクの通知
app.post('/github_pullrequest', function(req, res, next) {
    try {

        var request = require('request');
        var async = require('async');
        async.waterfall(
            [
                function(callback) {
                    var payloadData = getSendData(req);
                    var text = '';
                    if (payloadData.action == 'opened') {
                        var message = 'プルリクエストが送信されました <' + payloadData.pull_request.html_url + '|' + payloadData.pull_request.title + '>';
                        var mentionList = getMentionList(payloadData.pull_request.body);
                        if (mentionList.length > 0) {
                            text = encodeURIComponent(mentionList.join(' ') + ' ' + message);
                        } else {
                            text = encodeURIComponent(message);
                        }
                    } else if (payloadData.action == 'closed' && payloadData.pull_request.merged) {
                        text = encodeURIComponent('プルリクエストがマージされました <' + payloadData.pull_request.html_url + '|' + payloadData.pull_request.title + '>');
                    } else {
                        callback(null);
                        return;
                    }

                    var url = 'https://slack.com/api/chat.postMessage?token=' + SLACK_API_TOKEN + '&username=username&channel=' + CHANNEL_ID_LIST[CHANNEL_GITHUB_PULLREQUEST] + '&text=' + text;
                    request.get({
                        url: url,
                        encoding: 'utf-8',
                    }, function (err, res) {
                        callback(null);
                    });

                },
            ],
            function(err) {
                res.send();
            }
        );
    } catch (e) {
        console.error(e);
    }
});
