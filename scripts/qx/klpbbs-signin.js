const ScriptName = "klpbbs-signin";

const user = JSON.parse($prefs.valueForKey('klpbbs-user'));
const username = user['username'];
const password = user['password'];

const headers = {
  "origin": "https://klpbbs.com",
  "Referer": "https://klpbbs.com/k_misign-sign.html",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function login(username, password) {

  const loginRequest = {
    url: "https://klpbbs.com/member.php?mod=logging&action=login&loginsubmit=yes",
    method: "POST",
    headers: headers,
    body: `fastloginfield=username&username=${username}&password=${password}&questionid=0&answer=&agreebbrule=`
  };

  return $task.fetch(loginRequest);
}

function getSignInUrl() {
  const signurlRequest = {
    url: "https://klpbbs.com/",
    method: "GET",
    headers: headers,
    body: ""
  };

  return $task.fetch(signurlRequest).then(response => {
    // console.log("body: \n" + response.body);
    const regex = /name="formhash" value="([0-9a-f]{8})"/;
    const match = response.body.match(regex);
    if (match && match[1]) {
      // console.log("formhash: " + match[1]);
      return 'https://klpbbs.com/k_misign-sign.html?operation=qiandao&format=button&formhash=' + match[1];
    } else {
      throw new Error("获取formhash失败");
    }
  });
}

function signIn(signInUrl) {
  const signinRequest = {
    url: signInUrl,
    method: "GET",
    headers: headers,
    body: ""
  };

  return $task.fetch(signinRequest);
}

async function main() {

  if (!username || !password) {
    $notify(ScriptName, "❌无法签到", "用户名或密码未设置");
    $done();
  }

  await sleep(1500);

  try {

    const loginResponse = await login(username, password);
    if (loginResponse.statusCode !== 200) {
      throw new Error("状态码: " + loginResponse.statusCode);
    }

    const signInUrl = await getSignInUrl();
    const signInResponse = await signIn(signInUrl);

    // console.log('signinheader: \n\n' + JSON.stringify(signInResponse.headers));
    // console.log('signinbody: \n\n' + signInResponse.body);

    if (signInResponse.statusCode === 200) {
      if (signInResponse.body.includes('CDATA')) {
        regex = /!\[CDATA\[([^\[\]]*)\]\]/
        errmsg = signInResponse.body.match(regex);
        $notify(ScriptName, '❌错误', errmsg[1], {'open-url': 'https://klpbbs.com/k_misign-sign.html'});
        $done();
      }
      const regex1 = /获得随机奖励 (\d+)粒铁粒 和 (\d+)EP经验。/;
      const regex2 = /连续(\d+)天/;
      let reward = signInResponse.body.match(regex1);
      let days = signInResponse.body.match(regex2);
      // console.log(reward[0]);
      // console.log(days[0]);
      $notify(ScriptName, "✅签到成功", `连续签到${days[1]}天，获得铁粒${reward[1]}粒，经验${reward[2]}EP`, {'open-url': 'https://klpbbs.com/k_misign-sign.html'});
      $done();
    }
    throw new Error("状态码: " + signInResponse.statusCode);
  } catch (error) {
    $notify(ScriptName, "❌签到失败", error.message);
  }

  $done();
}

main();
