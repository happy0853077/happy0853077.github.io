const ScriptName = 'acfun-token';
if ('access_token' in $request.headers) {
    console.log('get token: ' + $request.headers['access_token']);
    if ($prefs.ValueForKey('token_acfun') != $request.headers['access_token']) {
        $notify(ScriptName, '', 'token获取成功');
        $prefs.setValueForKey($request.headers['access_token'], 'token_acfun');
    }
}
if ('Cookie' in $request.headers) {
    console.log('get cookie: ' + $request.headers['Cookie']);
    if ($prefs.ValueForKey('cookie_acfun') != $request.headers['cookie']) {
        $notify(ScriptName, '', 'cookie获取成功');
        $prefs.setValueForKey($request.headers['Cookie'], 'cookie_acfun');
    }
}
$done();
