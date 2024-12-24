const ScriptName = "gf2-bbs-token";
const account = JSON.parse($request.body);

let accounts = $prefs.valueForKey("gf2-bbs-accounts");
accounts = accounts == null ? JSON.parse("{}") : JSON.parse(accounts);

console.log(JSON.stringify(accounts) + "\n\n" + JSON.stringify(account));

accounts[account["account_name"]] = account["passwd"];

$prefs.setValueForKey(JSON.stringify(accounts), "gf2-bbs-accounts");
$notify(ScriptName, "获取账号成功！请勿泄漏", account["account_name"] + ": " + account["passwd"]);

$done();
