const ScriptName = "gf2-bbs-signin";

async function main() {

    let accounts = $prefs.valueForKey("gf2-bbs-accounts");

    if (accounts == null) {
        $notify(ScriptName, "没有需要签到的账号！", "请登录获取token");
        $done();
    }
    accounts = JSON.parse(accounts);

    const signinPromises = Object.keys(accounts).map(account => signin(account, accounts[account]));

    await Promise.all(signinPromises);
    $done();
}

function signin(account, passwd) {

    return new Promise((resolve) => {

        const token_Request = {
            url: `https://gf2-bbs-api.sunborngame.com/login/account`,
            method: 'POST',
            headers: {},
            body: `{"account_name":"${account}","passwd":"${passwd}","source":"phone"}`
        };

        $task.fetch(token_Request).then(response => {
            console.log(response.statusCode + "\n\n" + response.body);
            const resp = JSON.parse(response.body);

            if (resp["Code"] == -1) {
                $notify(ScriptName, `🚫账号${account}签到失败！`, "密码错误！请重新登录获取token");
                resolve();
                return;
            } else if (resp["Code"] != 0) {
                $notify(ScriptName, `🚫账号${account}签到失败！`, `未知错误：${resp["Code"]}，请尝试重新登录`);
                resolve();
                return;
            }

            headers = {
                'Authorization': resp['data']['account']['token']
            };

            const myRequest = {
                url: `https://gf2-bbs-api.sunborngame.com/community/task/sign_in`,
                method: 'POST',
                headers: headers,
                body: '{}'
            };

            return $task.fetch(myRequest);
        }).then(response => {
            if (response) {

                console.log(response.statusCode + "\n\n" + response.body);

                const resp = JSON.parse(response.body);
                let subtitle;
                let notifybody;

                if (response.statusCode == 200) {

                    if (resp["Code"] == 30010) {
                        subtitle = "";
                        notifybody = `❇️账号${account}今日已签到过！`;
                    } else if (resp["Code"] == 0) {
                        subtitle = `✅账号${account}签到成功！`;
                        notifybody = '获得：exp*' + resp["data"]["get_exp"] + '，' + resp["data"]["get_item_name"] + '*' + resp["data"]["get_item_count"];
                    } else {
                        subtitle = `🚫账号${account}签到失败！`;
                        notifybody = `未知错误：${resp["Code"]}，请尝试重新登录`;
                    }
                } else if (response.statusCode == 401) {
                    subtitle = `🚫账号${account}签到失败！`;
                    notifybody = "token错误，请重试";
                } else {
                    subtitle = `🚫账号${account}签到失败！`;
                    notifybody = '请求失败：' + response.statusCode + "， 请重试";
                }
                $notify(ScriptName, subtitle, notifybody);
            }
            resolve();

        }).catch(reason => {
            $notify(ScriptName, `账号${account}签到失败！`, `错误: ${reason.error}`);
            console.log(reason.error);
            resolve();
        });
    });
}

main();