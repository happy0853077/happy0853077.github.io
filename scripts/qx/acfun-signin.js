const ScriptName = 'AcFun-signin';

const times = 3;
const interval = 1000;
const timeout = 7000;


if ($environment.executor == 'cron' || $environment.executor == 'test-purpose') {
    main();

} else if ($environment.executor == 'rewrite-request-header') {
    getToken();
    $done();
} else {
    console.log(`unknown executor: ${$environment.executor}`);
    $done();
}


async function main() {

    for (let i = 0; i < times; i ++) {
        if (await signTimeout(timeout) == 0) {
            $done();
        } else {
            console.log((i + 1) + ' failed');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    $notify(ScriptName, '❌签到失败', '运行超时，请重试');
    $done();
}

async function signTimeout(time) {

    return Promise.race([
        sign(),
        new Promise((_, reject) => 
            setTimeout(() => 1, time)
        )
    ]);
}


async function sign() {

    const request = {
        url: `https://api-new.acfunchina.com/rest/app/user/signIn`,
        headers: {
            Cookie: $prefs.valueForKey('cookie_acfun'),
            access_token: $prefs.valueForKey('token_acfun'),
            acPlatform: 'IPHONE',
            'User-Agent': 'AcFun/6.14.2 (iPhone; iOS 13.3; Scale/2.00)'
        },
        body: '',
        method: 'POST'
    };

    const response = await $task.fetch(request);
    const result = JSON.parse(response.body);
    console.log(response.body);

    if (result.result == 0 || result.result == 122) {

        request.url = `https://api-new.acfunchina.com/rest/app/user/hasSignedIn`;

        const checkResponse = await $task.fetch(request);
        console.log(checkResponse.body);
        const checkresult = JSON.parse(checkResponse.body);

        let subTitle;
        let detail;

        if (result.result == 0) {
            subTitle = `✅签到成功`;
            const regex = /(\d+蕉)/;
            let bananaCount = result.msg.match(regex)[1];
            detail = `连续签到${checkresult.cumulativeDays}天，获得${bananaCount}`;

        } else if (result.result == 122) {
            subTitle = `❇️重复签到`;
            detail = `连续签到${checkresult.cumulativeDays}天，${result.msg}`;

        } else {
            console.log('unknown code: ' + result.result);
            subTitle = '⚠️签到异常';
            detail = `错误：${result.result}`;
        }

        $notify(ScriptName, subTitle, detail);
        return 0;

    } else {
        $notify(ScriptName, `❌签到失败`, `编码: ${result.result}, 说明: ${result.error_msg}`);
        return 1;
    }
}


function getToken() {

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
}
