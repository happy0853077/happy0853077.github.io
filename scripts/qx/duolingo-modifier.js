// https://happy0853077.github.io/scripts/qx/duolingo-modifier.js


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
    data['userdata']['betaStatus'] = 'ELIGIBLE';
    data['userdata']['trackingProperties']['beta_enrollment_status'] = 'ELIGIBLE';

    console.log('set premium');
    try {
        if (data['shopdata']['shopItems'][6]['id'] != 'premium_subscription_twelve_month') {
            throw new Error('商品数据已变化');
        }
        let found = false;
        const timestamp = Math.floor(Date.now() / 1000);
        console.log('time: ' + timestamp);
        for (let item of data['userdata']['shopItems']) {
            if (item.id === 'premium_subscription') {
                console.log('subscription found');
                item.purchaseDate = timestamp;
                item.subscriptionInfo.expectedExpiration = timestamp + 31536000;
                item.subscriptionInfo.productId = data['shopdata']['shopItems'][6]['productId'];
                item.subscriptionInfo.isFreeTrialPeriod = false;
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
                    expectedExpiration: timestamp + 31536000,
                    isFreeTrialPeriod: false,
                    isInBillingRetryPeriod: false,
                    productId: data['shopdata']['shopItems'][6]['productId'],
                    renewer: 'APPLE',
                    renewing: true,
                    tier: 'twelve_month',
                    type: 'premium'
                },
                familyPlanInfo: {
                    ownerId: data['userdata']['id'],
                    secondaryMembers: [],
                    inviteToken: '0-0000-0000-0000-0000',
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
    data['userdata']['subscriberLevel'] = 'PREMIUM';
    data['userdata']['trackingProperties']['has_item_premium_subscription'] = true;
    data['userdata']['trackingProperties']['has_item_live_subscription'] = true;
    data['userdata']['trackingProperties']['has_item_gold_subscription'] = true;

    console.log('remove restrict');
    data['userdata']['privacySettings'] = [];
    data['userdata']['trackingProperties']['china_social_restricted'] = false;

    console.log('enable heart features');
    data['userdata']['health']['unlimitedHeartsAvailable'] = true;
    data['userdata']['health']['eligibleForFreeRefill'] = true;

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
    data['userdata']['timerBoostConfig']['hasFreeTimerBoost'] = true;
    data['userdata']['timerBoostConfig']['timePerBoost'] = 600;

    // $notify(ScriptName, '', '成功修改数据');
    $done(tobody(data));
}
