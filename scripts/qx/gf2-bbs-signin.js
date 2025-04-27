const ScriptName = "gf2-bbs-signin";

const timeout = 7000; // 时间限制(ms)
const retry_interval = 1000; // 失败自动重试间隔时间(ms)
const retry_times = 3; // 失败自动重试次数


if ($environment.executor == 'rewrite-request-body') {
    savetoken();
} else if ($environment.executor == 'cron' || $environment.executor == 'test-purpose') {
    main();
} else {
    console.log(`unknown executor: ${$environment.executor}`);
    $done();
}


async function main() {

    let accounts = $prefs.valueForKey("gf2-bbs-accounts");

    if (!accounts) {
        $notify(ScriptName, "没有需要签到的账号！", "请登录论坛获取账号", {"open-url":"https://gf2-bbs.exiliumgf.com"});
        $done();
    }

    accounts = JSON.parse(accounts);

    for (let account of Object.keys(accounts)) {
        for (let i = 0; i < retry_times; i ++) {
            const result = await signinTimeout(timeout, account, accounts[account]);
            if (Array.isArray(result)) {
                $notify(ScriptName, result[1], result[2], {"open-url":"https://gf2-bbs.exiliumgf.com"});
                if (result[0] === 0) {
                    break;
                }
            }
            await sleep(retry_interval);
            if (i === retry_times - 1) {
                console.log(`${account} failed`);
                $notify(ScriptName, `❌账号${account}签到失败`, '超出失败次数限制');
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
            setTimeout(() => [1, `🚫账号${account}签到失败！`, `错误：运行超时`], timeout)
        )
    ]);
}


async function signin(account, passwd) {

    let code;

    try {

        console.log(`${account} start`);
        sign: {

            let url = 'https://gf2-bbs-api.exiliumgf.com';
            let request = {
                url: `${url}/login/account`,
                method: 'POST',
                headers: {},
                body: `{"account_name":"${account}","passwd":"${passwd}","source":"phone"}`,
                timeout: 1000
            };
            const token_resp = await $task.fetch(request);
            const token_data = JSON.parse(token_resp.body);
            console.log(`token ${token_resp.statusCode} ${token_data.Code}`);

            if (token_data.Code == -1) {
                code = [1, `🚫账号${account}签到失败！`, "密码错误，请重新登录"];
                break sign;
            } else if (token_data.Code != 0) {
                code = [1, `🚫账号${account}签到失败！`, `未知错误：${token_data.Code}`];
                break sign;
            }

            const reward = {};
            let notifybody = '';

            url += "/community";
            request.url = `${url}/task/get_current_sign_in_status`;
            request.method = 'GET';
            request.headers.Authorization = token_data.data.account.token;
            request.body = '';

            const status_resp = await $task.fetch(request);
            const status_data = JSON.parse(status_resp.body);
            console.log(`status ${status_resp.statusCode} ${status_data.Code}`);

            if (status_data.data.has_sign_in) {
                notifybody = `❇️账号${account}今日已签到过！`;
            } else {
                request.url = `${url}/task/sign_in`;
                request.method = 'POST';
                request.body = '{}';

                const sign_resp = await $task.fetch(request);
                const sign_data = JSON.parse(sign_resp.body);
                console.log(`signin ${sign_resp.statusCode} ${sign_data.Code}`);

                if (sign_data.Code == 0) {
                    notifybody = `✅账号${account}签到成功！`;
                    reward['社区经验'] = sign_data.data.get_exp;
                    reward[sign_data.data.get_item_name] = sign_data.data.get_item_count;
                } else {
                    notifybody = `🚫账号${account}签到失败！错误： ${sign_data.Code}`;
                }
            }
            console.log(`signin finished`);

            request.url = `${url}/topic/list?sort_type=1&category_id=1&query_type=1&last_tid=0&pub_time=0&reply_time=0&hot_value=0`;
            request.method = 'GET';
            request.body = '';

            const topiclist_resp = await $task.fetch(request);
            const topiclist_data = JSON.parse(topiclist_resp.body);
            console.log(`topiclist ${topiclist_resp.statusCode} ${topiclist_data.Code}`);

            request.url = `${url}/task/get_current_task_list`;

            const tasklist_resp = await $task.fetch(request);
            const tasklist_data = JSON.parse(tasklist_resp.body);
            console.log(`tasklist ${tasklist_resp.statusCode} ${tasklist_data.Code}`);

            const actions = ['', 'like/', 'share/'];
            const taskreward = [15, 10, 5];

            for (let i = 0; i < tasklist_data.data.daily_task.length; i ++) {
                let topics = [];

                for (let topic of topiclist_data.data.list) {

                    if (topics.length + tasklist_data.data.daily_task[i].complete_count < tasklist_data.data.daily_task[i].max_complete_count && i === 1) {
                        topic.is_like || topics.push(topic.topic_id);
                    } else if (topics.length + tasklist_data.data.daily_task[i].complete_count < tasklist_data.data.daily_task[i].max_complete_count && i !== 1) {
                        topics.push(topic.topic_id);
                    } else {
                        break;
                    }
                }
                while (topics.length > 0) {
                    request.url = `${url}/topic/${actions[i]}${topics[0]}?id=${topics[0]}`;
                    const topic_resp = await $task.fetch(request);
                    const topic_data = JSON.parse(topic_resp.body);
                    console.log(`${actions[i]} ${topics[0]} ${topic_resp.statusCode} ${topic_data.Code}`);
                    topics.shift();
                    reward['社区经验'] = '社区经验' in reward ? reward['社区经验'] + taskreward[i] : taskreward[i];
                }
            }
            console.log(`task finished`);

            request.url = `${url}/item/exchange_list`;

            const exchangelist_resp = await $task.fetch(request);
            let exchangelist_data = JSON.parse(exchangelist_resp.body);
            console.log(`exchangelist ${exchangelist_resp.statusCode} ${exchangelist_data.Code}`);

            if (exchangelist_resp.statusCode != 200) {
                console.log('get exchange list failed');
                throw new Error('获取兑换列表失败');
            }

            for (let i = 0; i < exchangelist_data.data.list.length; i ++) {
                while (exchangelist_data.data.list[i].exchange_count < exchangelist_data.data.list[i].max_exchange_count) {

                    request.url = `${url}/item/exchange`;
                    request.method = 'POST';
                    request.body = `{"exchange_id":${exchangelist_data.data.list[i].exchange_id}}`;

                    const exchange_resp = await $task.fetch(request);
                    const exchange_data = JSON.parse(exchange_resp.body);
                    console.log(`exchange ${exchangelist_data.data.list[i].exchange_id}  ${exchange_resp.statusCode} ${exchange_data.Code}`);

                    if (exchange_data.Code == 0) {
                        reward[exchangelist_data.data.list[i].item_name] = exchangelist_data.data.list[i].item_name in reward ? reward[exchangelist_data.data.list[i].item_name] + exchangelist_data.data.list[i].item_count : exchangelist_data.data.list[i].item_count;
                        exchangelist_data.data.list[i].exchange_count ++;
                    } else if  (exchange_resp.statusCode != 200) {
                        await sleep(1000);
                    }
                    await Promise.resolve();
                }
            }
            console.log(`exchange finished`);

            code = Object.keys(reward).length > 0 ? [0, notifybody, `获得 ${Object.entries(reward).map(([item, quantity]) => `${item}*${quantity}`).join(' ')}`] : [0, '', notifybody];
        }
    } catch (error) {
        console.log(error);
        code = [1, `🚫账号${account}签到失败！`, `错误：${error}`];
        return code;
    }

    finish = true;
    console.log(`${account} finished\n`);
    return code;
}


function savetoken() {
    const account = JSON.parse($request.body);

    let accounts = $prefs.valueForKey("gf2-bbs-accounts");
    accounts = accounts == null ? JSON.parse("{}") : JSON.parse(accounts);

    console.log(JSON.stringify(accounts) + "\n\n" + JSON.stringify(account));

    accounts[account["account_name"]] = account["passwd"];

    $prefs.setValueForKey(JSON.stringify(accounts), "gf2-bbs-accounts");
    $notify(ScriptName, "获取账号成功！请勿泄漏", account["account_name"] + ": " + account["passwd"]);

    $done();
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
