const ScriptName = "klpbbs-signin";

new Promise(resolve => setTimeout(resolve, 10000)).then(()=>{
    $notify(ScriptName, '❌签到失败', '运行超时，请重试');
    $done();
});

if ($environment.executor == 'rewrite-request-body') {
    saveaccount();
} else if ($environment.executor == 'cron' || $environment.executor == 'test-purpose') {
    main();
} else {
    console.log(`unknown executor: ${$environment.executor}`);
    $done();
}


async function main() {

    const user = JSON.parse($prefs.valueForKey('klpbbs-user'));
    const username = user['username'];
    const password = user['password'];

    const headers = {
        "origin": "https://klpbbs.com",
        "Referer": "https://klpbbs.com/k_misign-sign.html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    };

    if (!username || !password) {
        $notify(ScriptName, "❌无法签到", "请登录获取账号", {'open-url': 'https://klpbbs.com/'});
        $done();
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    let formhash;
    try {

        const request = {
            url: "https://klpbbs.com/member.php?mod=logging&action=login&loginsubmit=yes",
            method: "POST",
            headers: headers,
            body: `fastloginfield=username&username=${username}&password=${password}&questionid=0`
        };
        const action = {'open-url': 'https://klpbbs.com/k_misign-sign.html'};

        const loginResponse = await $task.fetch(request);
        if (loginResponse.statusCode !== 200) {
            throw new Error("状态码: " + loginResponse.statusCode);
        }

        request.url = "https://klpbbs.com/";
        request.method = "GET";
        request.body = "";
        const loginUrlResponse = await $task.fetch(request);

        const formhashRegex = /name="formhash" value="([0-9a-f]{8})"/;
        const matched = loginUrlResponse.body.match(formhashRegex);
        if (matched && matched[1]) {
            formhash = matched[1];

            console.log("formhash: " + formhash);
        } else {
            throw new Error("获取formhash失败");
        }

        request.url = 'https://klpbbs.com/k_misign-sign.html?operation=qiandao&format=button&formhash=' + formhash;
        const signInResponse = await $task.fetch(request);

        if (signInResponse.statusCode === 200) {

            if (signInResponse.body.includes('<root><![CDATA[')) {
                const messageRegex = /CDATA\[(.*?)\]/
                const errmsg = signInResponse.body.match(messageRegex);

                if (errmsg[1] == '今日已签') {
                    request.url = 'https://klpbbs.com/k_misign-sign.html';
                    checkResponse = await $task.fetch(request);

                    let daysRegex = /"lxdays" value="(\d+)"/;
                    let rankRegex = /排名：(\d+)/;
                    let days = checkResponse.body.match(daysRegex);
                    let rank = checkResponse.body.match(rankRegex);
                    console.log(days[0] + '  ' + rank[0]);

                    $notify(ScriptName, '❇️重复签到', `已连续签到${days[1]}天，今日排名${rank[1]}`, action);
                } else {
                    $notify(ScriptName, '❌错误', errmsg[1], action);
                }

                request.url = "https://klpbbs.com/member.php?mod=logging&action=logout&formhash=" + formhash;
                await $task.fetch(request);
                $done();
            }

            const rewardRegex = /奖励 (\d+)粒铁粒 和 (\d+)EP/;
            const streakRegex = /连续(\d+)天/;
            const rankRegex = /^(\d+)<\/div>/m;
            let reward = signInResponse.body.match(rewardRegex);
            let days = signInResponse.body.match(streakRegex);
            let rank = signInResponse.body.match(rankRegex);
            console.log(`${reward[0]}  ${days[0]}  ${rank[0]}`);

            $notify(ScriptName, "✅签到成功", `连续签到${days[1]}天，今日排名${rank[1]}，获得铁粒${reward[1]}粒，经验${reward[2]}EP`, action);

            if (days[1] === 1) {
                $notify(ScriptName, '⚠️昨日未签到', '请及时补签', action);
            }

        } else {
            throw new Error("状态码: " + signInResponse.statusCode);
        }

        request.url = "https://klpbbs.com/member.php?mod=logging&action=logout&formhash=" + formhash;
        await $task.fetch(request);

    } catch (error) {
        console.log(error);
        $notify(ScriptName, "❌签到失败", '错误：' + error.message);
    }

    $done();
}

function saveaccount() {

    const body = $request.body;
    console.log(body);

    const regex = /username=(\w+?)&password=(\w+?)&/;
    let matched = body.match(regex);

    if (matched && matched[1] && matched[2]) {
        const user = JSON.stringify({"username": matched[1], "password": matched[2]});
        console.log(user);
        $prefs.setValueForKey(user, "klpbbs-user");

        $notify(ScriptName, '✅获取账号密码成功', `${matched[1]}: ${matched[2]}`);
    } else {
        $notify(ScriptName, '', '⚠️获取账号失败');
    }

    $done();
}
