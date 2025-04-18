import { sleep } from './common.js';
import { test_call } from './call_test.js';
import { Account } from 'wowok_agent';
const main = async () => {
    if (!await Account.Instance().default()) {
        await Account.Instance().gen(true);
        await Account.Instance().faucet();
        await sleep(2000);
        console.log('Gen account: ' + await Account.Instance().default());
        console.log('Test related functions, please make sure that the account contains SUI test coins');
    }
    else {
        console.log('Default account: ' + await Account.Instance().default());
    }
    await test_call();
    //await airdrop();
    //await e_commerce();
};
main().catch(console.error);
