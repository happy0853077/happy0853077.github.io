// https://happy0853077.github.io/scripts/qx/duolingo-modifier.js


const ScriptName = 'duolingo-modifier';

if (typeof $task !== 'undefined') {
    ;
} else {
    console.log('此脚本仅支持Quantumult X，有需要请自行适配');
    throw new Error('不支持的环境');
}


let body = JSON.parse($response.body);
let userdata = JSON.parse(body['responses'][0]['body']);
let shopdata = JSON.parse(body['responses'][1]['body']);

console.log('enable beta');
userdata['betaStatus'] = 'ELIGIBLE';
userdata['trackingProperties']['beta_enrollment_status'] = 'ELIGIBLE';

console.log('set premium');
try {
    if (shopdata['shopItems'][6]['id'] != 'premium_subscription_twelve_month') {
        throw new Error('商品数据已变化');
    }
    let found = false;
    const timestamp = Math.floor(Date.now() / 1000);
    console.log('time: ' + timestamp);
    for (let item of userdata['shopItems']) {
        if (item.id === 'premium_subscription') {
            console.log('subscription found');
            item.purchaseDate = timestamp;
            item.subscriptionInfo.expectedExpiration = timestamp + 31536000;
            item.subscriptionInfo.productId = shopdata['shopItems'][6]['productId'];
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
        userdata['shopItems'].push({
            id: 'premium_subscription',
            purchaseDate: timestamp,
            purchasePrice: 11999,
            subscriptionInfo: {
                expectedExpiration: timestamp + 31536000,
                isFreeTrialPeriod: false,
                isInBillingRetryPeriod: false,
                productId: shopdata['shopItems'][6]['productId'],
                renewer: 'APPLE',
                renewing: true,
                tier: 'twelve_month',
                type: 'premium'
            },
            familyPlanInfo: {
                ownerId: userdata['id'],
                secondaryMembers: [],
                inviteToken: '0-0000-0000-0000-0000',
                pendingInvites: [],
                pendingInviteSuggestions: []
            }
        });
    }

    userdata['subscriptionConfigs'][0] = {
        vendorPurchaseId: '000000000000000',
        isInBillingRetryPeriod: false,
        isInGracePeriod: false,
        pauseStart: timestamp + 1209600,
        pauseEnd: null,
        productId: shopdata['shopItems'][6]['productId'],
        receiptSource: 1
    }
} catch (e) {
    console.log('failed');
}

console.log('set subscribe');
userdata['subscriberLevel'] = 'PREMIUM';
userdata['trackingProperties']['has_item_premium_subscription'] = true;
userdata['trackingProperties']['has_item_live_subscription'] = true;
userdata['trackingProperties']['has_item_gold_subscription'] = true;

console.log('remove restrict');
userdata['privacySettings'] = [];
userdata['trackingProperties']['china_social_restricted'] = false;

console.log('enable heart features');
userdata['health']['unlimitedHeartsAvailable'] = true;
userdata['health']['eligibleForFreeRefill'] = true;

/*
console.log('set price');
try {
    for (let item of shopdata['shopItems']) {
        item['price'] = (item['price'] === 0) ? 0 : 1;
    }
} catch (e) {
    console.log('failed');
}
*/

console.log('get timer boost');
userdata['timerBoostConfig']['hasFreeTimerBoost'] = true;
userdata['timerBoostConfig']['timePerBoost'] = 600;

/*
console.log('remove ads')
userdata.optionalFeatures.forEach(feature => {
    if (feature.id === 'max_upsell_treatment') {
        feature.status = 'OFF';
    }
});

userdata.optionalFeatures = userdata.optionalFeatures.filter(
    feature => feature.id !== 'max_upsell_treatment'
);
*/

/*
userdata['referralInfo']['isEligibleForBonus'] = true;
userdata['referralInfo']['isEligibleForOffer'] = true;
*/

// $notify(ScriptName, '', '成功修改数据');
body['responses'][0]['body'] = JSON.stringify(userdata);
body['responses'][1]['body'] = JSON.stringify(shopdata);

$done(JSON.stringify(body));
