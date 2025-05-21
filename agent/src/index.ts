
import { sleep } from './common.js'
import { test_call } from './call_test.js';
import { airdrop } from './airdrop.js';
import { e_commerce } from './e-commerce.js';
import { Account, query_objects } from 'wowok_agent';

const main = async () => {
    var acc = await Account.Instance().default();
    if (!acc) {
        acc = await Account.Instance().gen(true);
    }

    if (!acc) {
        console.error('default account error!');
        return;
    } else {
        console.log('default account: '+ acc.address);
    }

    //await Account.Instance().faucet(acc.address);


    await test_call()
    //await airdrop();
    //await e_commerce();
}  

main().catch(console.error)