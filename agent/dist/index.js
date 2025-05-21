import { test_call } from './call_test.js';
import { Account } from 'wowok_agent';
const main = async () => {
    var acc = await Account.Instance().default();
    if (!acc) {
        acc = await Account.Instance().gen(true);
    }
    if (!acc) {
        console.error('default account error!');
        return;
    }
    await Account.Instance().faucet(acc.address);
    console.log('Default account: ' + acc);
    await test_call();
    //await airdrop();
    //await e_commerce();
};
main().catch(console.error);
