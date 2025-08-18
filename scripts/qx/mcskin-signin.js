const ScriptName = 'mcskin-signin';


const retry_times = 3;
const retry_interval = 1000;
const timeout = 7000;


if ($environment.executor == 'cron' || $environment.executor == 'test-purpose') {
    main();

} else if ($environment.executor == 'rewrite-request-body') {
    getToken();
    $done();
} else {
    console.log(`unknown executor: ${$environment.executor}`);
    $done();
}


async function main() {

    let accounts = $prefs.valueForKey("mcskin-accounts");

    if (!accounts) {
        $notify(ScriptName, "没有需要签到的账号！", "请登录论坛获取账号", {"open-url":"https://mcskin.com.cn"});
        $done();
    }

    accounts = JSON.parse(accounts);

    for (let account of Object.keys(accounts)) {
        for (let i = 0; i < retry_times; i ++) {

            const result = await signinTimeout(timeout, account, accounts[account]);
            if (! result) {
                // $notify(ScriptName, result[1], result[2], {"open-url":"https://mcskin.com.cn"});
                break;
            }

            await sleep(retry_interval);
            if (i === retry_times - 1) {
                console.log(`${account} failed`);
                $notify(ScriptName, `❌账号${account.split('@')[0]}签到失败`, '超出失败次数限制');
                break;
            }
            console.log(`${account} retrying ${i + 1} times`);
        }
    }

    console.log("all finished");
    $done();
}


async function signinTimeout(timeout, account, passwd) {

    return Promise.race([
        signin(account, passwd),
        new Promise((_, reject) => 
            setTimeout(() => $notify(`🚫账号${account.split('@')[0]}签到失败！`, `错误：运行超时`, {"open-url":"https://mcskin.com.cn"}), timeout)
        )
    ]);
}


async function signin(account, passwd) {

    const request = {
        url: `https://mcskin.com.cn/auth/login`,
        headers: {Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},
        body: '',
        method: 'GET'
    };

    console.log(account);
    const response = await $task.fetch(request);

    const csrfRegex = /"csrf-token" content="(\w+)"/;
    const csrfToken = response.body.match(csrfRegex);

    if (!csrfToken[0] || !csrfToken[1]) {
        $notify(ScriptName, `❌账号${account.split('@')[0]}签到失败`, `错误：获取token失败`);
        return 1;
    }

    console.log(csrfToken[1]);
    request.method = 'POST';
    request.body = JSON.stringify({'identification': account, 'password': passwd, 'keep': false});

    request.headers.Accept = 'application/json';
    request.headers['X-CSRF-TOKEN'] = csrfToken[1];
    request.headers['Content-Type'] = 'application/json';

    const loginResponse = await $task.fetch(request);
    console.log(loginResponse.body);
    try {
        const loginResp = JSON.parse(loginResponse.body);
    
        if (! 'code' in loginResp || loginResp.code != 0) {
            $notify(ScriptName, `❌账号${account.split('@')[0]}签到失败`, `错误：登录失败`);
            return 1;
        }
    } catch (e) {
        console.log(e);
    }

    request.url = `https://mcskin.com.cn/user/sign`;
    request.body = '';

    const signResp = await $task.fetch(request);
    const signResult = JSON.parse(signResp.body);
    console.log(signResp.body);

    if (signResult.code == 0) {
        const regex = /(\d+)/;
        const scores = signResult.message.match(regex)[1];
        $notify(ScriptName, `✅账号${account.split('@')[0]}签到成功`, `获得${scores}积分`, {"open-url":"https://mcskin.com.cn"});
    } 
    else if (signResult.code == 1) {
                $notify(ScriptName, '', `❇️账号${account.split('@')[0]}今日已签到过`, {"open-url":"https://mcskin.com.cn"});
    } else {
        $notify(ScriptName, `❌账号${account.split('@')[0]}签到失败`, `错误：${signResult.code}`);
    }

    request.url = `https://mcskin.com.cn/auth/logout`;

    const logoutResp = await $task.fetch(request);
    console.log(logoutResp.body);

    return 0;
}


function getToken() {

    const account = JSON.parse($request.body);
    console.log(JSON.stringify(account));

    let accounts = $prefs.valueForKey("mcskin-accounts");
    accounts = accounts == null ? JSON.parse("{}") : JSON.parse(accounts);

    console.log(JSON.stringify(accounts) + "\n\n" + JSON.stringify(account));

    accounts[account.identification] = account.password;
    console.log(JSON.stringify(accounts));

    $prefs.setValueForKey(JSON.stringify(accounts), "mcskin-accounts");
    $notify(ScriptName, "✳️获取账号成功", account.identification + ": " + account.password.slice(0, 2) + '*'.repeat(account.password.length - 4) + account.password.slice(-2));

    $done($request.body);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
