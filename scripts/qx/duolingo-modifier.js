const ScriptName = 'duolingo-modifier';

console.log('url: ' + $request.url);
batch_modifier();


function batch_modifier() {

    console.log('modifying batch data');

    const body = JSON.parse($response.body);
    const userdata = JSON.parse(body.responses[0].body);
    const shopdata = JSON.parse(body.responses[1].body);
    const timestamp = Math.floor(Date.now() / 1000);

    console.log('time: ' + timestamp);
    console.log('id: ' + userdata.id);

    console.log('set subscription');
    try {

        let id;
        for (let i = 0; i < shopdata.shopItems.length; i ++) {
            if (shopdata.shopItems[i].id == 'premium_subscription_twelve_month') {
                console.log('item id: ' + i);
                id = i;
                break;
            }
        }
        if (id === undefined) {
            throw new Error('subscription id not found');
        }

        let found;
        for (let i = 0; i < userdata.shopItems.length; i ++) {
            if (userdata.shopItems[i].id === 'premium_subscription') {
                console.log('subscription found');

                userdata.shopItems[i].purchaseDate = timestamp - 172800;
                userdata.shopItems[i].subscriptionInfo.expectedExpiration = timestamp + 31363200;
                userdata.shopItems[i].subscriptionInfo.productId = shopdata.shopItems[id].productId;
                userdata.shopItems[i].subscriptionInfo.isFreeTrialPeriod = false;
                userdata.shopItems[i].subscriptionInfo.isInBillingRetryPeriod = false;
                userdata.shopItems[i].subscriptionInfo.tier = 'twelve_month';
                userdata.shopItems[i].subscriptionInfo.type = 'premium';
                userdata.shopItems[i].subscriptionInfo.renewing = true;

                found = true;
                break;
            }
        }

        if (!found) {
            console.log('add subscription');

            userdata.shopItems.push({
                id: 'premium_subscription',
                purchaseDate: timestamp - 172800,
                purchasePrice: 11999,
                subscriptionInfo: {
                    expectedExpiration: timestamp + 31363200,
                    isFreeTrialPeriod: false,
                    isInBillingRetryPeriod: false,
                    productId: shopdata.shopItems[id].productId,
                    renewer: 'APPLE',
                    renewing: true,
                    tier: 'twelve_month',
                    type: 'premium'
                }
            });
        }
        userdata.subscriptionConfigs[0] = {
            vendorPurchaseId: '000000000000000',
            isInBillingRetryPeriod: false,
            isInGracePeriod: false,
            pauseStart: timestamp + 31363200,
            pauseEnd: null,
            productId: shopdata.shopItems[id].productId,
            receiptSource: 1
        }
    } catch (e) {
        console.log(e);
        console.log('failed');
    }

    console.log('set xp boost');
    let found;
    for (let i = 0; i < userdata.shopItems.length; i ++) {
        if (userdata.shopItems[i].id == 'xp_boost_stackable') {
            console.log('xp boost found');
            userdata.shopItems[i].purchaseDate = timestamp;
            userdata.shopItems[i].expectedExpirationDate = timestamp + 1800;
            userdata.shopItems[i].xpBoostMultiplier = 3;
            found = true;
            break;
        }
    }
    if (!found) {
        console.log('add boost');
        userdata.shopItems.push({
            id: 'xp_boost_stackable',
            purchaseDate: timestamp,
            expectedExpirationDate: timestamp + 1800,
            purchasePrice: 0,
            xpBoostMultiplier: 3
        });
    }

    console.log('set subscribe');
    userdata.subscriberLevel = 'PREMIUM';
    userdata.trackingProperties.has_item_premium_subscription = true;
    userdata.trackingProperties.has_item_live_subscription = true;
    userdata.trackingProperties.has_item_gold_subscription = true;

    console.log('enable heart features');
    userdata.health.unlimitedHeartsAvailable = true;
    userdata.health.eligibleForFreeRefill = true;

    console.log('get timer boost');
    userdata.timerBoostConfig.hasFreeTimerBoost = true;
    userdata.timerBoostConfig.timePerBoost = 600;

    body.responses[0].body = JSON.stringify(userdata);
    body.responses[1].body = JSON.stringify(shopdata);

    $done(JSON.stringify(body));
}
