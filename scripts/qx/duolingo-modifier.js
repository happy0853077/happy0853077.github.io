const ScriptName = 'duolingo-modifier';


const get_boost = true; // 获取3倍经验buff
const enable_beta = true; // 启用beta版功能

console.log('url: ' + $request.url);
main();


function main() {

    const body = JSON.parse($response.body);

    if ('etag' in body.responses[0].headers) {
        console.log('not the data');
        $done($response.body);
    }

    const userdata = JSON.parse(body.responses[0].body);
    const shopdata = JSON.parse(body.responses[1].body);

    const timestamp = Math.floor(Date.now() / 1000);

    console.log('time: ' + timestamp);
    console.log('id: ' + userdata.id);

    console.log('modifying data');

    console.log('set premium subscription');
    try {

        let id;
        for (let i = 0; i < shopdata.shopItems.length; i ++) {
            if (shopdata.shopItems[i].id == 'premium_subscription_twelve_month_family') {
                console.log('  item id: ' + i);
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
                userdata.shopItems[i].subscriptionInfo.tier = 'twelve_month';
                userdata.shopItems[i].subscriptionInfo.type = 'premium';
                userdata.shopItems[i].subscriptionInfo.renewing = true;

                found = true;
                break;
            }
        }

        if (!found) {
            console.log('  add subscription');

            userdata.shopItems.push({
                id: 'premium_subscription',
                purchaseDate: timestamp - 172800,
                purchasePrice: 11999,
                subscriptionInfo: {
                    expectedExpiration: timestamp + 31363200,
                    productId: shopdata.shopItems[id].productId,
                    renewer: 'APPLE',
                    renewing: true,
                    tier: 'twelve_month',
                    type: 'premium'
                },
                familyPlanInfo: {
                    ownerId: userdata['id'],
                    secondaryMembers: []
                }
            });
        }
        userdata.subscriptionConfigs[0] = {
            pauseStart: timestamp + 31363200,
            pauseEnd: null,
            productId: `com.duolingo.immersive_family_subscription`,
            receiptSource: 1,
            expirationTimestamp: (timestamp + 31363200) * 1000,
            itemType: "immersive_subscription"
        }
    } catch (e) {
        console.log(e);
        console.log('failed');
    }

    if (get_boost) {
        console.log('set xp boost');
        let found;
        for (let i = 0; i < userdata.shopItems.length; i ++) {
            if (userdata.shopItems[i].id == 'xp_boost_stackable') {
                console.log('xp boost found');
                userdata.shopItems[i].purchaseDate = timestamp;
                userdata.shopItems[i].expectedExpirationDate = timestamp + 3600;
                userdata.shopItems[i].xpBoostMultiplier = 3;
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('  add xp boost');
            userdata.shopItems.push({
                id: 'xp_boost_stackable',
                purchaseDate: timestamp,
                expectedExpirationDate: timestamp + 3600,
                purchasePrice: 0,
                xpBoostMultiplier: 3
            });
        }
    }

    if (enable_beta) {
        console.log('enable beta feature');
        userdata.betaStatus = 'ELIGIBLE';
        userdata.trackingProperties.beta_enrollment_status = 'ELIGIBLE';
    }

    console.log('set subscribe level');
    userdata.subscriberLevel = 'PREMIUM';
    userdata.trackingProperties.has_item_premium_subscription = true;
    userdata.trackingProperties.has_item_live_subscription = true;
    userdata.trackingProperties.has_item_gold_subscription = true;
    userdata.trackingProperties.has_item_max_subscription = true;

    console.log('set unlimited heart');
    userdata.health.unlimitedHeartsAvailable = true;
    userdata.health.eligibleForFreeRefill = true;

    console.log('set timer boost');
    userdata.timerBoostConfig.hasFreeTimerBoost = true;
    userdata.timerBoostConfig.timePerBoost = 3600;
    userdata.timerBoostConfig.hasPurchasedTimerBoost = true;

    console.log('misc setups');
    userdata.shouldPreventMonetizationForSchoolsUser = true;
    userdata.pushFamilyPlanNudge = false;

    body.responses[0].body = JSON.stringify(userdata);
    body.responses[1].body = JSON.stringify(shopdata);

    $done(JSON.stringify(body));
}
