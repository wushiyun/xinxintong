var LS = (function(fields) {
    function locationSearch() {
        var ls, search;
        ls = location.search;
        search = {};
        angular.forEach(fields, function(q) {
            var match, pattern;
            pattern = new RegExp(q + '=([^&]*)');
            match = ls.match(pattern);
            search[q] = match ? match[1] : '';
        });
        return search;
    };
    /*join search*/
    function j(method) {
        var j, l, url = '/rest/site/fe/user/member',
            _this = this,
            search = [];
        method && method.length && (url += '/' + method);
        if (arguments.length > 1) {
            for (i = 1, l = arguments.length; i < l; i++) {
                search.push(arguments[i] + '=' + _this.p[arguments[i]]);
            };
            url += '?' + search.join('&');
        }
        return url;
    };
    return {
        p: locationSearch(),
        j: j
    };
})(['site', 'schema', 'debug']);
var ngApp = angular.module('app', ['page.ui.xxt']);
ngApp.config(['$controllerProvider', function($cp) {
    ngApp.provider = {
        controller: $cp.register
    };
}]);
ngApp.controller('ctrlMember', ['$scope', '$http', '$timeout', '$q', 'tmsDynaPage', function($scope, $http, $timeout, $q, tmsDynaPage) {
    var validate = function() {
        var required = function(value, len, alerttext) {
            if (value == null || value == "" || value.length < len) {
                $scope.errmsg = alerttext;
                return false;
            } else
                return true;
        };
        var isMobile = function(value, alerttext) {
            if (false === /^1[3|4|5|7|8][0-9]\d{4,8}$/.test(value)) {
                $scope.errmsg = alerttext;
                return false;
            } else {
                return true;
            }
        };
        var isEmail = function(value, alerttext) {
            if (value === undefined) {
                $scope.errmsg = alerttext;
                return false;
            }
            var apos = value.indexOf("@"),
                dotpos = value.lastIndexOf(".");
            if (apos < 1 || dotpos - apos < 2) {
                $scope.errmsg = alerttext;
                return false;
            } else {
                return true;
            }
        };
        var member = $scope.member;
        if (member.name !== undefined && false === required(member.name, 2, '请提供您的姓名！')) {
            return false;
        }
        if (member.mobile !== undefined && false === isMobile(member.mobile, '请提供正确的手机号（11位数字）！')) {
            return false;
        }
        if (member.email !== undefined && false === isEmail(member.email, '请提供正确的邮箱！')) {
            return false;
        }
        return true;
    };

    function sendRequest(url, deferred) {
        $scope.posting = true;
        $http.post(url, $scope.member).success(function(rsp) {
            $scope.posting = false;
            if (angular.isString(rsp)) {
                $scope.errmsg = rsp;
                deferred.reject(rsp);
            } else if (rsp.err_code != 0) {
                $scope.errmsg = rsp.err_msg;
                deferred.reject(rsp.err_msg);
            } else if (window.parent && window.parent.onClosePlugin) {
                window.parent.onClosePlugin();
                deferred.resolve();
            } else {
                $http.get(LS.j('passed', 'site', 'schema') + '&redirect=N').success(function(rsp) {
                    location.href = rsp.data;
                });
            }
        }).error(function(data, header, config, status) {
            if (data) {
                $http.post('/rest/log/add', { src: 'site.fe.user.login', msg: JSON.stringify(arguments) });
            }
            alert('操作失败：' + (data === null ? '网络不可用' : data));
        });;
    }

    function setMember(user) {
        var member;
        user.members && (member = user.members[LS.p.schema]);
        $scope.member = {
            schema_id: LS.p.schema
        };
        if (member) {
            $scope.member.id = member.id;
            $scope.member.verified = member.verified;
            $scope.attrs.name && ($scope.member.name = member.name);
            $scope.attrs.email && ($scope.member.email = member.email);
            $scope.attrs.mobile && ($scope.member.mobile = member.mobile);
            if ($scope.attrs.extattrs && $scope.attrs.extattrs.length) {
                $scope.member.extattr = {};
                member.extattr = member.extattr ? JSON.parse(member.extattr) : [];
                angular.forEach($scope.attrs.extattrs, function(ea) {
                    $scope.member.extattr[ea.id] = member.extattr[ea.id];
                });
            }
        }
    }

    var siteId = LS.p.site;
    if (/MicroMessenger/i.test(navigator.userAgent)) {
        $scope.snsClient = 'wx';
    } else if (/YiXin/i.test(navigator.userAgent)) {
        $scope.snsClient = 'yx';
    }
    $scope.posting = false;
    $scope.errmsg = '';
    $scope.infomsg = '';
    $scope.loginUser = {};
    $scope.subView = 'register';
    $scope.debug = LS.p.debug;
    $scope.switchSubView = function(name) {
        $scope.subView = name;
    };
    $scope.login = function() {
        var deferred = $q.defer();
        $http.post('/rest/site/fe/user/login/do?site=' + siteId, $scope.loginUser).success(function(rsp) {
            if (rsp.err_code != 0) {
                $scope.errmsg = rsp.err_msg;
                return;
            }
            var user = rsp.data;
            $scope.user = user;
            setMember(user);
            deferred.resolve(user);
        }).error(function(text) {
            $scope.errmsg = text;
            deferred.reject(text);
        });
        return deferred.promise;
    };
    $scope.logout = function() {
        var deferred = $q.defer();
        $http.post('/rest/site/fe/user/logout/do?site=' + siteId, $scope.loginUser).success(function(rsp) {
            if (rsp.err_code != 0) {
                $scope.errmsg = rsp.err_msg;
                return;
            }
            location.reload(true);
        }).error(function(text) {
            $scope.errmsg = text;
        });
        return deferred.promise;
    };
    $scope.gotoHome = function() {
        location.href = '/rest/site/fe/user?site=' + siteId;
    };
    $scope.repeatPwd = (function() {
        return {
            test: function(value) {
                return value === $scope.password;
            }
        };
    })();
    $scope.register = function() {
        var deferred = $q.defer();
        $http.post('/rest/site/fe/user/register/do?site=' + siteId, {
            uname: $scope.loginUser.uname,
            password: $scope.loginUser.password
        }).success(function(rsp) {
            if (rsp.err_code != 0) {
                $scope.errmsg = rsp.err_msg;
                return;
            }
            $scope.user = rsp.data;
            // 解决版本迁移造成的问题，正常逻辑不需要
            setMember($scope.user);
            deferred.resolve($scope.user);
        }).error(function(text) {
            $scope.errmsg = text;
            deferred.reject(text);
        });
        return deferred.promise;
    };
    $scope.doAuth = function(ignoreCheck) {
        var deferred = $q.defer();
        if (!ignoreCheck) {
            if (!validate()) {
                return;
            }
            if (document.querySelectorAll('.ng-invalid-required').length) {
                $scope.errmsg = '请填写必填项';
                return;
            }
        }
        sendRequest(LS.j('doAuth', 'site', 'schema'), deferred);
        return deferred.promise;
    };
    $scope.doReauth = function() {
        var deferred = $q.defer();
        if (!validate()) return;
        if (document.querySelectorAll('.ng-invalid-required').length) {
            $scope.errmsg = '请填写必填项';
            return;
        }
        sendRequest(LS.j('doReauth', 'site', 'schema'), deferred);
        return deferred.promise;
    };
    $http.get('/rest/site/fe/get?site=' + LS.p.site).success(function(rsp) {
        $scope.site = rsp.data;
    });
    $http.get(LS.j('schemaGet', 'site', 'schema')).success(function(rsp) {
        if (rsp.err_code !== 0) {
            $scope.errmsg = rsp.err_msg;
            return;
        }
        $scope.user = rsp.data.user;
        $scope.schema = rsp.data.schema;
        $scope.attrs = {};
        angular.forEach(rsp.data.attrs, function(attr, name) {
            if (name === 'extattrs') {
                $scope.attrs['extattrs'] = attr;
            } else if (attr && attr[0] === '0') {
                $scope.attrs[name] = true;
            } else {
                $scope.attrs[name] = false;
            }
        });
        /*内置用户认证信息*/
        setMember($scope.user);
        /*社交账号信息*/
        if ($scope.user.sns) {
            if ($scope.user.sns.wx) {
                $scope.loginUser.nickname = $scope.user.sns.wx.nickname;
            } else if ($scope.user.sns.yx) {
                $scope.loginUser.nickname = $scope.user.sns.yx.nickname;
            }
        }
        tmsDynaPage.loadCode(ngApp, rsp.data.schema.page).then(function() {
            $scope.page = rsp.data.schema.page;
            $timeout(function() {
                $scope.$broadcast('xxt.member.auth.ready', rsp.data);
            });
        });
    }).error(function(content, httpCode) {
        $scope.errmsg = content;
    });
}]);
