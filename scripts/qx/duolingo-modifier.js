const ScriptName = 'duolingo-modifier';

if (typeof $task !== 'undefined') {
    main();
} else {
    console.log('此脚本仅支持Quantumult X，有需要请自行修改');
    throw new Error('不支持的环境');
}


function todata() {
    let body = JSON.parse($response.body);
    let userdata = JSON.parse(body['responses'][0]['body']);
    let shopdata = JSON.parse(body['responses'][1]['body']);
    let data = {
        'body': body,
        'userdata': userdata,
        'shopdata': shopdata
    };
    return data;
}


function tobody(data) {
    let body = data['body'];
    body['responses'][0]['body'] = JSON.stringify(data['userdata']);
    body['responses'][1]['body'] = JSON.stringify(data['shopdata']);
    return JSON.stringify(body);
}


function main() {

    let data = todata();

    console.log('enable beta');
    try {
        data['userdata']['betaStatus'] = 'ELIGIBLE';
        data['userdata']['trackingProperties']['beta_enrollment_status'] = 'ELIGIBLE';
    } catch (e) {
        console.log('failed');
    }

    console.log('set premium');
    try {
        let found = false;
        const timestamp = Math.floor(Date.now() / 1000);
        console.log('time: ' + timestamp);
        for (let item of data['userdata']['shopItems']) {
            if (item.id === 'premium_subscription') {
                console.log('subscription found');
                item.purchaseDate = timestamp;
                item.subscriptionInfo.expectedExpiration = timestamp + 1209600;
                item.subscriptionInfo.productId = data['shopdata']['shopItems'][6]['productId'];
                item.subscriptionInfo.isFreeTrialPeriod = true;
                item.subscriptionInfo.isInBillingRetryPeriod = false;
                item.subscriptionInfo.tier = 'twelve_month';
                item.subscriptionInfo.type = 'premium';
                item.subscriptionInfo.renewing = true;
                found = true;
                break;
            }
        }

        if (!found) {
            data['userdata']['shopItems'].push({
                id: 'premium_subscription',
                purchaseDate: timestamp,
                purchasePrice: 11999,
                subscriptionInfo: {
                    expectedExpiration: timestamp + 1209600,
                    isFreeTrialPeriod: true,
                    isInBillingRetryPeriod: false,
                    productId: data['shopdata']['shopItems'][6]['productId'], //'com.duolingo.DuolingoMobile.subscription.Premium.TwelveMonth.24Q2MaxWB14D.Trial14.120',
                    renewer: 'APPLE',
                    renewing: true,
                    tier: 'twelve_month',
                    type: 'premium'
                },
                familyPlanInfo: {
                    ownerId: data['userdata']['id'],
                    secondaryMembers: [],
                    inviteToken: '1-0000-0000-0000-0000',
                    pendingInvites: [],
                    pendingInviteSuggestions: []
                }
            });
        }

        data['userdata']['subscriptionConfigs'][0] = {
            vendorPurchaseId: '000000000000000',
            isInBillingRetryPeriod: false,
            isInGracePeriod: false,
            pauseStart: timestamp + 1209600,
            pauseEnd: null,
            productId: data['shopdata']['shopItems'][6]['productId'],
            receiptSource: 1
        }
    } catch (e) {
        console.log('failed');
    }

    console.log('set subscribe');
    try {
        data['userdata']['subscriberLevel'] = 'PREMIUM';
        data['userdata']['trackingProperties']['has_item_premium_subscription'] = true;
        data['userdata']['trackingProperties']['has_item_live_subscription'] = true;
        data['userdata']['trackingProperties']['has_item_gold_subscription'] = true;
    } catch (e) {
        console.log('failed');
    }

    console.log('remove restrict');
    try {
        data['userdata']['privacySettings'] = [];
        data['userdata']['trackingProperties']['china_social_restricted'] = false;
    } catch (e) {
        console.log('failed');
    }

/*
    console.log('set price');
    try {
        for (let item of data['shopdata']['shopItems']) {
            item['price'] = (item['price'] === 0) ? 0 : 1;
        }
    } catch (e) {
        console.log('failed');
    }
*/

    console.log('get timer boost');
    try {
        data['timerBoostConfig']['hasFreeTimerBoost'] = true;
        data['timerBoostConfig']['timePerBoost'] = 600;
    } catch (e) {
        console.log('failed');
    }

    // $notify(ScriptName, '', '成功修改数据');
    $done(tobody(data));
}
