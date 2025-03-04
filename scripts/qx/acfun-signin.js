const ScriptName = 'AcFun-signin';

const cookieKey = 'cookie_acfun';
const tokenKey = 'token_acfun';
const cookieVal = $prefs.valueForKey(cookieKey);
const tokenVal = $prefs.valueForKey(tokenKey);

console.log(tokenVal);
console.log(cookieVal);

const headers = {
    Cookie: cookieVal,
    access_token: `${tokenVal}`,
    acPlatform: 'IPHONE',
    'User-Agent': 'AcFun/6.14.2 (iPhone; iOS 13.3; Scale/2.00)'
};

if ($environment.executor == 'cron' || $environment.executor == 'test-purpose') {
    sign();
} else if ($environment.executor == 'rewrite-request-body') {
    if ('access_token' in $request.headers) {
        console.log('get token: ' + $request.headers['access_token']);
        if ($prefs.ValueForKey(tokenKey) != $request.headers['access_token']) {
            $notify(ScriptName, '', 'token获取成功');
            $prefs.setValueForKey($request.headers['access_token'], tokenKey);
        }
    }
    if ('Cookie' in $request.headers) {
        console.log('get cookie: ' + $request.headers['Cookie']);
        if ($prefs.ValueForKey(cookieKey) != $request.headers['cookie']) {
            $notify(ScriptName, '', 'cookie获取成功');
            $prefs.setValueForKey($request.headers['Cookie'], cookieKey);
        }
    }
    $done();
} else {
    console.log(`unknown executor: ${$environment.executor}`);
    $done();
}


function sign() {
    const request = {
        url: `https://api-new.acfunchina.com/rest/app/user/signIn`,
        headers: headers,
        body: '',
        method: 'POST'
    };
    $task.fetch(request).then(response => {
        const result = JSON.parse(response.body);
        if (result.result == 0 || result.result == 122) {
            request.url = `https://api-new.acfunchina.com/rest/app/user/hasSignedIn`;
            $task.fetch(request).then(response => {
                const checkresult = JSON.parse(response.body);
                let subTitle;
                let detail;
                if (result.result == 0) {
                    subTitle = `✅签到成功`;
                    const regex = /(\d+蕉)/;
                    let bananaCount = result.msg.match(regex)[1];
                    detail = `连续签到${checkresult.continuousDays}天，获得${bananaCount}`;
                } else if (result.result == 122) {
                    subTitle = `❇️重复签到`;
                    detail = `连续签到${checkresult.continuousDays}天，${result.msg}`;
                } else {
                    console.log('unknown code: ' + result.result);
                    subTitle = '⚠️签到异常';
                    detail = `错误：${result.result}`;
                }
                $notify(ScriptName, subTitle, detail);
                $done();
            });
        } else {
            $notify(ScriptName, `❌签到失败`, `编码: ${result.result}, 说明: ${result.error_msg}`);
            $done();
        }
    });
}


function getinfo(signresult) {
    let request = {
        url: `https://api-new.acfunchina.com/rest/app/user/hasSignedIn`,
        headers: headers,
        body: '',
        method: 'POST'
    };
    $task.fetch(request).then(response => {
        const result = JSON.parse(response.body);
        let subTitle;
        let detail;
        if (signresult.result == 0) {
            subTitle = `✅签到成功`;
            const regex = /(\d+蕉)/;
            let bananaCount = signresult.msg.match(regex)[1];
            detail = `连续签到${result.continuousDays}天，获得${bananaCount}`;
        } else if (signresult.result == 122) {
            subTitle = `❇️重复签到`;
            detail = `连续签到${result.continuousDays}天，${signresult.msg}`;
        } else {
            console.log('unknown code: ' + signresult.result);
            subTitle = '⚠️签到异常';
            detail = `错误：${signresult.result}`;
        }
        $notify(ScriptName, subTitle, detail);
        $done();
    });
}
