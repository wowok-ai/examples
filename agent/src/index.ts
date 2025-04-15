
import { sleep } from './common'
import { test_call } from './call_test';
import { airdrop } from './airdrop';
import { e_commerce } from './e-commerce';
import { Account, query_objects } from 'wowok_agent';

const main = async () => {
    if (!await Account.Instance().get_address()) {
        await Account.Instance().gen('my default account', true);
        await Account.Instance().faucet();
        await sleep(2000);
        console.log('Gen account: '+await Account.Instance().get_address());
        console.log('Test related functions, please make sure that the account contains SUI test coins');
    } else {
        console.log('Default account: '+await Account.Instance().get_address());
    }


    //await test_call()*/
    //await airdrop();
    //await e_commerce();
}  

main().catch(console.error)