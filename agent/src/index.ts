
import { sleep } from './common'
import { test_agent_objects } from './query_test';
import { test_call } from './call_test';
import { airdrop } from './airdrop';
import { e_commerce } from './e-commerce';
import { Account } from 'wowok_agent';

const main = async () => {

    if (!Account.Instance().get_address()) {
        Account.Instance().gen('my default account', true);
        await Account.Instance().faucet();
        await sleep(2000);
        console.log('Gen account: '+Account.Instance().get_address());
        console.log('Test related functions, please make sure that the account contains SUI test coins');
    }

    //await test_call()
    //await airdrop();
    await e_commerce();
}  

main().catch(console.error)