import { test_call } from './call_test.js';
import { Account } from 'wowok_agent';
const main = async () => {
    const acc = await Account.Instance().default(true);
    await Account.Instance().faucet(acc);
    console.log('Default account: ' + acc);
    await test_call();
    //await airdrop();
    //await e_commerce();
};
main().catch(console.error);
